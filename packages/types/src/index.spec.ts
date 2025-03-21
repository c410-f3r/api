// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import './injector';

import Metadata from './Metadata';
import metadataStatic from './Metadata/static';
import { createTypeUnsafe } from './codec/create';
import GenericCall from './primitive/Generic/Call';
import { Codec } from './types';
import * as exported from './index.types';
import * as definitions from './interfaces/definitions';

// NOTE This is not a shortcut to implementing types incorrectly. This is here
// specifically for the types that _should_ throw in the constrtuctor, i.e
// `usize` is not allowed (runtime incompat) and `origin` is not passed through
// to any calls. All other types _must_ pass and allow for empty defaults
const UNCONSTRUCTABLE = [
  'ExtrinsicPayloadUnknown', 'GenericExtrinsicPayloadUnknown',
  'ExtrinsicUnknown', 'GenericExtrinsicUnknown',
  'GenericOrigin', 'Origin',
  'usize'
].map((v): string => v.toLowerCase());

function testTypes (type: string, typeNames: string[]): void {
  describe(type, (): void => {
    describe(`${type}:: default creation`, (): void => {
      typeNames.forEach((name): void => {
        it(`creates an empty ${name}`, (): void => {
          const constructFn = (): Codec =>
            createTypeUnsafe(name);

          if (UNCONSTRUCTABLE.includes(name.toLowerCase())) {
            expect(constructFn).toThrow();
          } else {
            expect(constructFn).not.toThrow();
          }
        });
      });
    });

    describe(`${type}:: default creation (empty bytes)`, (): void => {
      GenericCall.injectMetadata(new Metadata(metadataStatic));

      typeNames.forEach((name): void => {
        it(`creates an empty ${name} (from empty bytes)`, (): void => {
          const constructFn = (): Codec =>
            createTypeUnsafe(name, [createTypeUnsafe('Bytes')]);

          if (UNCONSTRUCTABLE.includes(name.toLowerCase())) {
            expect(constructFn).toThrow();
          } else {
            expect(constructFn).not.toThrow();
          }
        });
      });
    });
  });
}

describe('type creation', (): void => {
  testTypes('exported', Object.keys(exported));

  Object
    .entries(definitions)
    .forEach(([name, { types }]): void =>
      testTypes(`${name} (injected)`, Object.keys(types))
    );
});
