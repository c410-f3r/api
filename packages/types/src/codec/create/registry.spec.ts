// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import '../../injector';

import { Constructor } from '../../types';

import { TypeRegistry, getTypeRegistry } from './registry';
import Struct from '../Struct';
import Text from '../../primitive/Text';
import U32 from '../../primitive/U32';

// Copied from interfacesTs
function isChildClass (Parent: Constructor<any>, Child?: Constructor<any>): boolean {
  return Child
    // eslint-disable-next-line no-prototype-builtins
    ? Parent === Child || Parent.isPrototypeOf(Child)
    : false;
}

describe('TypeRegistry', (): void => {
  let registry: TypeRegistry;

  beforeEach((): void => {
    registry = getTypeRegistry();
  });

  it('handles non exist type', (): void => {
    expect(registry.get('non-exist')).toBeUndefined();
  });

  it('can register single type', (): void => {
    registry.register(Text);
    expect(registry.get('Text')).toBe(Text);
  });

  it('can register type with a different name', (): void => {
    registry.register('TextRenamed', Text);
    expect(isChildClass(Text, registry.get('TextRenamed'))).toBe(true);
  });

  describe('object registration', (): void => {
    it('can register multiple types', (): void => {
      registry.register({
        Text,
        U32Renamed: U32
      });
      expect(isChildClass(Text, registry.get('Text'))).toBe(true);
      expect(isChildClass(U32, registry.get('U32Renamed'))).toBe(true);
    });

    it('can register recursive types', (): void => {
      registry.register({
        Recursive: {
          next: 'Option<Recursive>'
        }
      });

      expect(registry.hasDef('Recursive')).toBe(true);
      expect(registry.hasClass('Recursive')).toBe(false);

      const Recursive = registry.getOrThrow('Recursive');

      expect(registry.hasClass('Recursive')).toBe(true);

      const last = new Recursive({ next: null });
      const first = new Recursive({ next: last });

      expect((first as any).next.isSome).toBe(true);
      expect((first as any).next.unwrap().next.isSome).toBe(false);
    });

    it('can register cross-referencing types ()', (): void => {
      registry.register({
        A: {
          next: 'B'
        },
        B: {
          _enum: {
            End: null,
            Other: 'A'
          }
        }
      });

      const A = registry.getOrThrow('A');
      const B = registry.getOrThrow('B');

      expect(registry.hasClass('Recursive')).toBe(true);

      const last = new B({ End: null });
      const first = new B({ Other: new A({ next: last }) });

      expect((first as any).isOther).toBe(true);
    });

    it('can create types from string', (): void => {
      registry.register({
        U32Renamed: 'u32'
      });

      const Type = registry.getOrThrow('U32Renamed');

      expect(new Type() instanceof U32).toBe(true);
    });

    it('can create structs via definition', (): void => {
      registry.register({
        SomeStruct: {
          foo: 'u32',
          bar: 'Text'
        }
      });

      const SomeStruct: any = registry.get('SomeStruct');
      const struct: any = new SomeStruct({
        foo: 42,
        bar: 'testing'
      });

      expect(struct instanceof Struct).toBe(true);
      expect(struct.foo.toNumber()).toEqual(42);
      expect(struct.bar.toString()).toEqual('testing');
    });
  });
});
