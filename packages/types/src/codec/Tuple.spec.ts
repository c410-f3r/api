// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import '../injector';

import { VoteThreshold } from '../interfaces/elections';
import { BlockNumber } from '../interfaces/runtime';
import { CodecTo } from '../types';

import { ClassOf } from './create';
import Metadata from '../Metadata';
import metadataStatic from '../Metadata/static';
import Call from '../primitive/Generic/Call';
import Text from '../primitive/Text';
import U32 from '../primitive/U32';
import U128 from '../primitive/U128';
import Tuple from './Tuple';

describe('Tuple', (): void => {
  let tuple: Tuple;

  beforeEach((): void => {
    tuple = new Tuple(
      [Text, U32],
      ['bazzing', 69]
    );
  });

  describe('decoding', (): void => {
    const testDecode = (type: string, input: any): void =>
      it(`can decode from ${type}`, (): void => {
        const t = new Tuple([
          Text,
          U32
        ], input);
        expect(
          t.toJSON()
        ).toEqual(['bazzing', 69]);
      });

    testDecode('array', ['bazzing', 69]);
    testDecode('hex', '0x1c62617a7a696e6745000000');
    testDecode('Uint8Array', Uint8Array.from([28, 98, 97, 122, 122, 105, 110, 103, 69, 0, 0, 0]));
  });

  describe('encoding', (): void => {
    const testEncode = (to: CodecTo | 'toArray', expected: any): void =>
      it(`can encode ${to}`, (): void => {
        expect(tuple[to]()).toEqual(expected);
      });

    testEncode('toHex', '0x1c62617a7a696e6745000000');
    testEncode('toJSON', ['bazzing', 69]);
    testEncode('toU8a', Uint8Array.from([28, 98, 97, 122, 122, 105, 110, 103, 69, 0, 0, 0]));
    testEncode('toString', '["bazzing",69]');
  });

  it('creates from string types', (): void => {
    expect(
      new Tuple(
        ['Text', 'u32', U32],
        ['foo', 69, 42]
      ).toString()
    ).toEqual('["foo",69,42]');
  });

  it('creates properly via actual hex string', (): void => {
    Call.injectMetadata(new Metadata(metadataStatic));

    const test = new (Tuple.with([
      ClassOf('BlockNumber'), ClassOf('VoteThreshold')
    ]
    ))('0x6219000001');

    expect((test[0] as BlockNumber).toNumber()).toEqual(6498);
    expect((test[1] as VoteThreshold).toNumber()).toEqual(1);
  });

  it('exposes the Types', (): void => {
    expect(tuple.Types).toEqual(['Text', 'u32']);
  });

  it('exposes the Types (object creation)', (): void => {
    const test = new Tuple({
      BlockNumber: ClassOf('BlockNumber'),
      VoteThreshold: ClassOf('VoteThreshold')
    }, []);

    expect(test.Types).toEqual(['BlockNumber', 'VoteThreshold']);
  });

  it('exposes filter', (): void => {
    expect(tuple.filter((v): boolean => v.toJSON() === 69)).toEqual([new U32(69)]);
  });

  it('exposes map', (): void => {
    expect(tuple.map((v): string => v.toString())).toEqual(['bazzing', '69']);
  });

  describe('utils', (): void => {
    it('compares against inputs', (): void => {
      expect(tuple.eq(['bazzing', 69])).toBe(true);
    });

    it('compares against inputs (mismatch)', (): void => {
      expect(tuple.eq(['bazzing', 72])).toBe(false);
    });
  });

  describe('toRawType', (): void => {
    it('generates sane value with array types', (): void => {
      expect(
        new Tuple([U128, ClassOf('BlockNumber')]).toRawType()
      ).toEqual('(u128,u32)');
    });

    it('generates sane value with object types', (): void => {
      expect(
        new Tuple({ number: U128, blockNumber: ClassOf('BlockNumber') }).toRawType()
      ).toEqual('(u128,u32)');
    });
  });
});
