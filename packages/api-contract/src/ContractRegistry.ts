// Copyright 2017-2019 @polkadot/api-contract authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { CodecArg, TypeDef } from '@polkadot/types/types';
import { ContractABIArgBasePre, ContractABIContract, ContractABIContractPre, ContractABIEvent, ContractABIEventPre, ContractABIFn, ContractABIFnArg, ContractABIMethod, ContractABIMethodBase, ContractABIMethodPre, ContractABI, ContractABIPre, ContractABIRange, ContractABIRangePre, ContractABIStorage, ContractABIStorageLayout, ContractABIStorageLayoutPre, ContractABIStoragePre, ContractABIStorageStruct, ContractABIStorageStructPre, ContractABITypePre } from './types';
import { Compact } from '@polkadot/types';

import { assert, isNumber, isString, isNull, isObject, isUndefined, stringCamelCase } from '@polkadot/util';

import MetaRegistry from './MetaRegistry';
import { createArgClass } from './method';

export default class ContractRegistry extends MetaRegistry {
  // Contract ABI helpers
  public validateArgs (name: string, args: ContractABIArgBasePre[]): void {
    assert(Array.isArray(args), `Expected 'args' to exist on ${name}`);

    args.forEach((arg): void => {
      const unknownKeys = Object.keys(arg).filter((key): boolean => !['name', 'type'].includes(key));

      assert(unknownKeys.length === 0, `Unknown keys ${unknownKeys.join(', ')} found in ABI args for ${name}`);
      assert(isNumber(arg.name) && isString(this.stringAt(arg.name)), `${name} args should have valid name `);
      assert(isNumber(arg.type.ty) && isObject(this.typeDefAt(arg.type.ty)), `${name} args should have valid type`);
    });
  }

  public validateConstructors ({ contract: { constructors } }: ContractABIPre): void {
    constructors.forEach((constructor: ContractABIMethodPre, index): void => {
      const unknownKeys = Object.keys(constructor).filter((key): boolean => !['args', 'docs', 'name', 'selector'].includes(key));

      assert(unknownKeys.length === 0, `Unknown keys ${unknownKeys.join(', ')} found in ABI constructor`);

      this.validateArgs(`constructor ${index}`, constructor.args);
    });
  }

  public validateMethods ({ contract: { messages } }: ContractABIPre): void {
    messages.forEach((method): void => {
      const unknownKeys = Object.keys(method).filter((key): boolean => !['args', 'docs', 'mutates', 'name', 'selector', 'return_type'].includes(key));

      assert(unknownKeys.length === 0, `Unknown keys ${unknownKeys.join(', ')} found in ABI args for messages.${method.name}`);
      const { name, selector, return_type: returnType } = method;
      assert(isNumber(name) && isString(this.stringAt(name)), `Expected name for messages.${method.name}`);
      assert(isNumber(selector), `Expected selector for messages.${method.name}`);
      assert(isNull(returnType) || (isNumber(returnType.ty) && isObject(this.typeDefAt(returnType.ty))), `Expected return_type for messages.${method.name}`);

      this.validateArgs(`messages.${method.name}`, method.args);
    });
  }

  public validateAbi (abi: ContractABIPre): void {
    const unknownKeys = Object.keys(abi.contract).filter((key): boolean => !['constructors', 'docs', 'events', 'messages', 'name'].includes(key));
    assert(unknownKeys.length === 0, `Unknown fields ${unknownKeys.join(', ')} found in ABI`);

    const { contract: { constructors, messages, name } } = abi;
    assert(constructors && messages && isString(this.stringAt(name)), 'ABI should have constructors, messages & name sections');

    this.validateConstructors(abi);
    this.validateMethods(abi);
  }

  public createMethod (name: string, method: Partial<ContractABIMethod> & ContractABIMethodBase): ContractABIFn {
    const args = method.args.map(({ name, type }): ContractABIFnArg => {
      assert(isObject(type), `Invalid type at index ${type}`);
      return {
        name: stringCamelCase(name),
        type
      };
    });
    const Clazz = createArgClass(args, isUndefined(method.selector) ? {} : { __selector: 'u32' });
    const baseStruct: { [index: string]: any } = { __selector: method.selector };
    const encoder = (...params: CodecArg[]): Uint8Array => {
      assert(params.length === args.length, `Expected ${args.length} arguments to contract ${name}, found ${params.length}`);

      const u8a = new Clazz(
        args.reduce((mapped, { name }, index): Record<string, CodecArg> => {
          mapped[name] = params[index];

          return mapped;
        }, { ...baseStruct })
      ).toU8a();

      return Compact.addLengthPrefix(u8a);
    };

    const fn = (encoder as ContractABIFn);

    fn.args = args;
    fn.isConstant = !(method.mutates || false);
    fn.type = method.returnType || null;

    return fn;
  }

  public convertAbi ({ contract, storage }: ContractABIPre): ContractABI {
    return {
      contract: this.convertContract(contract),
      storage: this.convertStorage(storage)
    };
  }

  public convertArgs (args: ContractABIArgBasePre[]): any[] {
    return args.map(({ name, type, ...arg }) => ({ ...arg, name: this.stringAt(name), type: this.convertType(type) }));
  }

  public convertType ({ ty, display_name: displayNameIndices }: ContractABITypePre): TypeDef {
    const displayName = this.stringsAt(displayNameIndices).join('::');
    return this.typeDefAt(ty, { displayName });
  }

  public convertContract ({ constructors, messages, name, events, ...contract }: ContractABIContractPre): ContractABIContract {
    return {
      constructors: this.convertConstructors(constructors),
      messages: messages.map(method => this.convertMethod(method)),
      name: this.stringAt(name),
      ...(events
        ? { events: events.map(event => this.convertEvent(event)) }
        : {}),
      ...contract
    };
  }

  public convertConstructors (constructors: ContractABIMethodPre[]): ContractABIMethod[] {
    return constructors.map(
      (constructor: ContractABIMethodPre): ContractABIMethod => {
        return this.convertMethod(constructor);
      }
    );
  }

  public convertMethod ({ args, name, return_type: returnType, ...method }: ContractABIMethodPre): ContractABIMethod {
    return {
      ...method,
      args: this.convertArgs(args),
      name: this.stringAt(name),
      returnType: returnType ? this.convertType(returnType) : null
    };
  }

  public convertEvent ({ args }: ContractABIEventPre): ContractABIEvent {
    return {
      args: this.convertArgs(args)
    };
  }

  public convertStorage (storage: ContractABIStoragePre): ContractABIStorage {
    return this.convertStorageStruct(storage);
  }

  public convertStorageLayout (storageLayout: ContractABIStorageLayoutPre): ContractABIStorageLayout {
    if ((storageLayout as ContractABIStorageStructPre)['struct.type']) {
      return this.convertStorageStruct(storageLayout as ContractABIStorageStructPre);
    } else {
      return this.convertStorageRange(storageLayout as ContractABIRangePre);
    }
  }

  public convertStorageStruct ({ 'struct.type': structType, 'struct.fields': structFields }: ContractABIStorageStructPre): ContractABIStorageStruct {
    return {
      'struct.type': this.typeDefAt(structType),
      'struct.fields': structFields.map(({ name, layout }) => ({
        name: this.stringAt(name),
        layout: this.convertStorageLayout(layout)
      }))
    };
  }

  public convertStorageRange ({ 'range.elem_type': type, ...range }: ContractABIRangePre): ContractABIRange {
    return {
      ...range,
      'range.elem_type': this.typeDefAt(type)
    };
  }
}
