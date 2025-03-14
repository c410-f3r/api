// Copyright 2017-2019 @polkadot/rpc-core authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ProviderInterface } from '@polkadot/rpc-provider/types';
import { RpcMethod } from '@polkadot/jsonrpc/types';
import { AnyJson, Codec } from '@polkadot/types/types';
import { RpcInterface } from './jsonrpc.types';
import { RpcInterfaceMethod } from './types';

import memoizee from 'memoizee';
import { combineLatest, from, Observable, Observer, of, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, map, publishReplay, refCount, switchMap } from 'rxjs/operators';
import interfaces from '@polkadot/jsonrpc';
import { Option, StorageKey, Vec, createClass } from '@polkadot/types';
import { createTypeUnsafe } from '@polkadot/types/codec';
import { assert, isFunction, isNull, isNumber, logger, u8aToU8a } from '@polkadot/util';

const l = logger('rpc-core');

const EMPTY_META = {
  fallback: undefined,
  modifier: { isOptional: true },
  type: {
    asMap: { linked: { isTrue: false } },
    isMap: false
  }
};

/**
 * @name Rpc
 * @summary The API may use a HTTP or WebSockets provider.
 * @description It allows for querying a Polkadot Client Node.
 * WebSockets provider is recommended since HTTP provider only supports basic querying.
 *
 * ```mermaid
 * graph LR;
 *   A[Api] --> |WebSockets| B[WsProvider];
 *   B --> |endpoint| C[ws://127.0.0.1:9944]
 * ```
 *
 * @example
 * <BR>
 *
 * ```javascript
 * import Rpc from '@polkadot/rpc-core';
 * import WsProvider from '@polkadot/rpc-provider/ws';
 *
 * const provider = new WsProvider('ws://127.0.0.1:9944');
 * const rpc = new Rpc(provider);
 * ```
 */
export default class Rpc implements RpcInterface {
  private _storageCache = new Map<string, string | null>();

  public readonly provider: ProviderInterface;

  public readonly account: RpcInterface['account'];

  public readonly author: RpcInterface['author'];

  public readonly chain: RpcInterface['chain'];

  public readonly contracts: RpcInterface['contracts'];

  public readonly rpc: RpcInterface['rpc'];

  public readonly state: RpcInterface['state'];

  public readonly system: RpcInterface['system'];

  /**
   * @constructor
   * Default constructor for the Api Object
   * @param  {ProviderInterface} provider An API provider using HTTP or WebSocket
   */
  public constructor (provider: ProviderInterface) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    assert(provider && isFunction(provider.send), 'Expected Provider to API create');

    this.provider = provider;

    this.account = this.createInterface('account');
    this.author = this.createInterface('author');
    this.contracts = this.createInterface('contracts');
    this.chain = this.createInterface('chain');
    this.rpc = this.createInterface('rpc');
    this.state = this.createInterface('state');
    this.system = this.createInterface('system');
  }

  /**
   * @name signature
   * @summary Returns a string representation of the method with inputs and outputs.
   * @description
   * Formats the name, inputs and outputs into a human-readable string. This contains the input parameter names input types and output type.
   *
   * @example
   * <BR>
   *
   * ```javascript
   * import Api from '@polkadot/rpc-core';
   *
   * Api.signature({ name: 'test_method', params: [ { name: 'dest', type: 'Address' } ], type: 'Address' }); // => test_method (dest: Address): Address
   * ```
   */
  public static signature ({ method, params, type }: RpcMethod): string {
    const inputs = params.map(({ name, type }): string =>
      `${name}: ${type}`
    ).join(', ');

    return `${method} (${inputs}): ${type}`;
  }

  /**
   * @description Manually disconnect from the attached provider
   */
  public disconnect (): void {
    this.provider.disconnect();
  }

  private createErrorMessage (method: RpcMethod, error: Error): string {
    return `${Rpc.signature(method)}:: ${error.message}`;
  }

  private createInterface<Section extends keyof RpcInterface> (section: Section): RpcInterface[Section] {
    const { methods } = interfaces[section];

    return Object
      .keys(methods)
      .reduce((exposed, methodName): RpcInterface[Section] => {
        const def = methods[methodName];

        // FIXME Remove any here
        // To do so, remove `RpcInterfaceMethod` from './types.ts', and refactor
        // every method inside this class to take:
        // `<S extends keyof RpcInterface, M extends keyof RpcInterface[S]>`
        // Not doing so, because it makes this class a little bit less readable,
        // and leaving it as-is doesn't harm much
        (exposed as any)[methodName] = def.isSubscription
          ? this.createMethodSubscribe(def)
          : this.createMethodSend(def);

        return exposed;
      }, {} as unknown as RpcInterface[Section]);
  }

  private createMethodSend (method: RpcMethod): RpcInterfaceMethod {
    const rpcName = `${method.section}_${method.method}`;

    const call = (...values: any[]): Observable<any> => {
      // TODO Warn on deprecated methods

      // Here, logically, it should be `of(this.formatInputs(method, values))`.
      // However, formatInputs can throw, and when it does, the above way
      // doesn't throw in the "Observable loop" (which is internally wrapped in
      // a try/catch block). So we:
      // - first do `of(1)` - won't throw
      // - then do `map(()=>this.formatInputs)` - might throw, but inside Observable.
      return of(1).pipe(
        map((): Codec[] => this.formatInputs(method, values)),
        switchMap((params): Observable<[Codec[], any]> =>
          combineLatest([
            of(params),
            from(this.provider.send(rpcName, params.map((param): AnyJson => param.toJSON())))
          ])
        ),
        map(([params, result]): any => this.formatOutput(method, params, result)),
        catchError((error): any => {
          const message = this.createErrorMessage(method, error);

          // don't scare with old nodes, this is handled transparently
          if (rpcName !== 'rpc_methods') {
            l.error(message);
          }

          return throwError(new Error(message));
        }),
        publishReplay(1), // create a Replay(1)
        refCount() // Unsubcribe WS when there are no more subscribers
      );
    };

    // We voluntarily don't cache the "one-shot" RPC calls. For example,
    // `getStorage('123')` returns the current value, but this value can change
    // over time, so we wouldn't want to cache the Observable.
    return call as RpcInterfaceMethod;
  }

  private createMethodSubscribe (method: RpcMethod): RpcInterfaceMethod {
    const [updateType, subMethod, unsubMethod] = method.pubsub;
    const subName = `${method.section}_${subMethod}`;
    const unsubName = `${method.section}_${unsubMethod}`;
    const subType = `${method.section}_${updateType}`;

    const call = (...values: any[]): Observable<any> => {
      return new Observable((observer: Observer<any>): VoidCallback => {
        // Have at least an empty promise, as used in the unsubscribe
        let subscriptionPromise: Promise<number | void> = Promise.resolve();
        const errorHandler = (error: Error): void => {
          const message = this.createErrorMessage(method, error);

          l.error(message);

          observer.error(new Error(message));
        };

        try {
          const params = this.formatInputs(method, values);
          const paramsJson = params.map((param): AnyJson => param.toJSON());
          const update = (error?: Error, result?: any): void => {
            if (error) {
              l.error(this.createErrorMessage(method, error));
              return;
            }

            observer.next(this.formatOutput(method, params, result));
          };

          subscriptionPromise = this.provider
            .subscribe(subType, subName, paramsJson, update)
            .catch(errorHandler);
        } catch (error) {
          errorHandler(error);
        }

        // Teardown logic
        return (): void => {
          // Delete from cache
          // Reason:
          // ```
          //    const s = api.query.system.accountNonce(addr1).subscribe(); // let's say it's 6
          //    s.unsubscribe();
          //    // wait a bit, for the nonce to increase to 7
          //    api.query.system.accountNonce(addr1).subscribe(); // will output 6 instead of 7 if we don't clear cache
          //    // that's because all our observables are replay(1)
          // ```
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          memoized.delete(...values);

          // Unsubscribe from provider
          subscriptionPromise
            .then((subscriptionId): Promise<boolean> =>
              isNumber(subscriptionId)
                ? this.provider.unsubscribe(subType, unsubName, subscriptionId)
                : Promise.resolve(false)
            )
            .catch((error: Error): void =>
              l.error(this.createErrorMessage(method, error))
            );
        };
      }).pipe(
        // Duplicated in api-derive/util/drr
        distinctUntilChanged((a: any, b: any): boolean =>
          JSON.stringify({ value: a }) === JSON.stringify({ value: b })
        ),
        publishReplay(1),
        refCount()
      );
    };

    const memoized = memoizee(call, {
      // Dynamic length for argument
      length: false,
      // Normalize args so that different args that should be cached
      // together are cached together.
      // E.g.: `query.my.method('abc') === query.my.method(createType('AccountId', 'abc'));`
      // eslint-disable-next-line @typescript-eslint/unbound-method
      normalizer: JSON.stringify
    });

    return memoized;
  }

  private formatInputs (method: RpcMethod, inputs: any[]): Codec[] {
    const reqArgCount = method.params.filter(({ isOptional }): boolean => !isOptional).length;
    const optText = reqArgCount === method.params.length
      ? ''
      : ` (${method.params.length - reqArgCount} optional)`;

    assert(inputs.length >= reqArgCount && inputs.length <= method.params.length, `Expected ${method.params.length} parameters${optText}, ${inputs.length} found instead`);

    return inputs.map((input, index): Codec =>
      createTypeUnsafe(method.params[index].type, [input])
    );
  }

  private treatAsHex (key: StorageKey): boolean {
    // :code is problematic - it does not have the length attached, which is
    // unlike all other storage entries where it is indeed properly encoded
    return ['0x3a636f6465'].includes(key.toHex());
  }

  private formatOutput (method: RpcMethod, params: Codec[], result?: any): Codec | Codec[] {
    if (method.type === 'StorageData') {
      const key = params[0] as StorageKey;

      try {
        return this.formatStorageData(key, result);
      } catch (error) {
        console.error(`Unable to decode storage ${key.section}.${key.method}:`, error.message);

        throw error;
      }
    } else if (method.type === 'StorageChangeSet') {
      // For StorageChangeSet, the changes has the [key, value] mappings
      const changes: [string, string | null][] = result.changes;
      const keys = params[0] as Vec<StorageKey>;
      const withCache = keys.length !== 1;

      // multiple return values (via state.storage subscription), decode the values
      // one at a time, all based on the query types. Three values can be returned -
      //   - Codec - There is a valid value, non-empty
      //   - null - The storage key is empty
      return keys.reduce((results, key: StorageKey): Codec[] => {
        try {
          results.push(this.formatStorageSet(key, changes, withCache));
        } catch (error) {
          console.error(`Unable to decode storage ${key.section}.${key.method}:`, error.message);

          throw error;
        }

        return results;
      }, [] as Codec[]);
    }

    return createTypeUnsafe(method.type, [result]);
  }

  private formatStorageData (key: StorageKey, value: string | null): Codec {
    // single return value (via state.getStorage), decode the value based on the
    // outputType that we have specified. Fallback to Data on nothing
    const type = key.outputType || 'Data';
    const meta = key.meta || EMPTY_META;
    const isEmpty = isNull(value);

    // we convert to Uint8Array since it maps to the raw encoding, all
    // data will be correctly encoded (incl. numbers, excl. :code)
    const input = isEmpty
      ? null
      : this.treatAsHex(key)
        ? value
        : u8aToU8a(value);

    if (meta.modifier.isOptional) {
      return new Option(
        createClass(type),
        isEmpty
          ? null
          : createTypeUnsafe(type, [input], true)
      );
    }

    return createTypeUnsafe(type, [isEmpty ? meta.fallback : input], true);
  }

  private formatStorageSet (key: StorageKey, changes: [string, string | null][], witCache: boolean): Codec {
    // Fallback to Data (i.e. just the encoding) if we don't have a specific type
    const type = key.outputType || 'Data';
    const hexKey = key.toHex();
    const meta = key.meta || EMPTY_META;

    // if we don't find the value, this is our fallback
    //   - in the case of an array of values, fill the hole from the cache
    //   - if a single result value, don't fill - it is not an update hole
    //   - fallback to an empty option in all cases
    const emptyVal = (witCache && this._storageCache.get(hexKey)) || null;

    // see if we have a result value for this specific key, fallback to the cache value
    // when the value in the set is not available, or is null/empty.
    const [, value] = changes.find(([key, value]): boolean =>
      !isNull(value) && key === hexKey
    ) || [null, emptyVal];
    const isEmpty = isNull(value);
    const input = isEmpty
      ? null
      : this.treatAsHex(key)
        ? value
        : u8aToU8a(value);

    // store the retrieved result - the only issue with this cache is that there is no
    // clearing of it, so very long running processes (not just a couple of hours, longer)
    // will increase memory beyond what is allowed.
    this._storageCache.set(hexKey, value);

    if (meta.modifier.isOptional) {
      return new Option(
        createClass(type),
        isEmpty
          ? null
          : createTypeUnsafe(type, [input], true)
      );
    }

    return createTypeUnsafe(type, [isEmpty ? meta.fallback : input], true);
  }
}
