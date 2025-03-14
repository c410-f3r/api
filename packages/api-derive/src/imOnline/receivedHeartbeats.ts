// Copyright 2017-2019 @polkadot/api-derive authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountId, SessionIndex } from '@polkadot/types/interfaces';

import { of, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiInterfaceRx } from '@polkadot/api/types';
import { Bytes, Vec } from '@polkadot/types';

import { drr } from '../util/drr';

/**
 * @description Return a boolean array indicating whether the passed accounts had received heartbeats in the current session
 */
export function receivedHeartbeats (api: ApiInterfaceRx): (addresses: (AccountId | string)[]) => Observable<boolean[]> {
  return (addresses: (AccountId | string)[]): Observable<boolean[]> => {
    return api.query.imOnline && api.query.imOnline.receivedHeartbeats
      ? api.queryMulti<[SessionIndex, Vec<AccountId>]>([
        api.query.session.currentIndex,
        api.query.imOnline.keys
      ]).pipe(
        switchMap(([currentIndex, keys]): Observable<Bytes[]> =>
          api.query.imOnline.receivedHeartbeats.multi(
            addresses.map((address): [SessionIndex, number] =>
              [currentIndex, keys.indexOf(address)]
            )
          )
        ),
        map((heartbeats): boolean[] =>
          heartbeats.map((heartbeat): boolean => !heartbeat.isEmpty)
        ),
        drr()
      )
      : of([...new Array(addresses.length).keys()].map((): boolean => false));
  };
}
