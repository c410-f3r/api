[Polkadot JS API](../README.md) › [Globals](../globals.md) › ["types"](../modules/_types_.md) › [IMethod](_types_.imethod.md)

# Interface: IMethod

## Hierarchy

* [Codec](_types_.codec.md)

  ↳ **IMethod**

  ↳ [IExtrinsic](_types_.iextrinsic.md)

## Implemented by

* [Call](_interfaces_runtime_types_.call.md)
* [Call](../classes/_primitive_generic_call_.call.md)
* [Proposal](_interfaces_democracy_types_.proposal.md)

## Index

### Properties

* [args](_types_.imethod.md#args)
* [argsDef](_types_.imethod.md#argsdef)
* [callIndex](_types_.imethod.md#callindex)
* [data](_types_.imethod.md#data)
* [encodedLength](_types_.imethod.md#encodedlength)
* [hasOrigin](_types_.imethod.md#hasorigin)
* [hash](_types_.imethod.md#hash)
* [isEmpty](_types_.imethod.md#isempty)
* [meta](_types_.imethod.md#meta)

### Methods

* [eq](_types_.imethod.md#eq)
* [toHex](_types_.imethod.md#tohex)
* [toJSON](_types_.imethod.md#tojson)
* [toRawType](_types_.imethod.md#torawtype)
* [toString](_types_.imethod.md#tostring)
* [toU8a](_types_.imethod.md#tou8a)

## Properties

###  args

• **args**: *[Codec](_types_.codec.md)[]*

*Defined in [types.ts:164](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L164)*

___

###  argsDef

• **argsDef**: *[ArgsDef](../modules/_types_.md#argsdef)*

*Defined in [types.ts:165](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L165)*

___

###  callIndex

• **callIndex**: *Uint8Array*

*Defined in [types.ts:166](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L166)*

___

###  data

• **data**: *Uint8Array*

*Defined in [types.ts:167](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L167)*

___

###  encodedLength

• **encodedLength**: *number*

*Inherited from [Codec](_types_.codec.md).[encodedLength](_types_.codec.md#encodedlength)*

*Defined in [types.ts:76](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L76)*

**`description`** The length of the value when encoded as a Uint8Array

___

###  hasOrigin

• **hasOrigin**: *boolean*

*Defined in [types.ts:169](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L169)*

___

###  hash

• **hash**: *[IHash](_types_.ihash.md)*

*Overrides [Codec](_types_.codec.md).[hash](_types_.codec.md#hash)*

*Defined in [types.ts:168](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L168)*

___

###  isEmpty

• **isEmpty**: *boolean*

*Inherited from [Codec](_types_.codec.md).[isEmpty](_types_.codec.md#isempty)*

*Defined in [types.ts:86](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L86)*

**`description`** Checks if the value is an empty value

___

###  meta

• **meta**: *[FunctionMetadataV7](_interfaces_metadata_types_.functionmetadatav7.md)*

*Defined in [types.ts:170](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L170)*

## Methods

###  eq

▸ **eq**(`other?`: any): *boolean*

*Inherited from [Codec](_types_.codec.md).[eq](_types_.codec.md#eq)*

*Defined in [types.ts:91](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L91)*

**`description`** Compares the value of the input to see if there is a match

**Parameters:**

Name | Type |
------ | ------ |
`other?` | any |

**Returns:** *boolean*

___

###  toHex

▸ **toHex**(`isLe?`: undefined | false | true): *string*

*Inherited from [Codec](_types_.codec.md).[toHex](_types_.codec.md#tohex)*

*Defined in [types.ts:96](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L96)*

**`description`** Returns a hex string representation of the value. isLe returns a LE (number-only) representation

**Parameters:**

Name | Type |
------ | ------ |
`isLe?` | undefined &#124; false &#124; true |

**Returns:** *string*

___

###  toJSON

▸ **toJSON**(): *[AnyJson](../modules/_types_.md#anyjson)*

*Inherited from [Codec](_types_.codec.md).[toJSON](_types_.codec.md#tojson)*

*Defined in [types.ts:101](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L101)*

**`description`** Converts the Object to JSON, typically used for RPC transfers

**Returns:** *[AnyJson](../modules/_types_.md#anyjson)*

___

###  toRawType

▸ **toRawType**(): *string*

*Inherited from [Codec](_types_.codec.md).[toRawType](_types_.codec.md#torawtype)*

*Defined in [types.ts:106](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L106)*

**`description`** Returns the base runtime type name for this instance

**Returns:** *string*

___

###  toString

▸ **toString**(): *string*

*Inherited from [Codec](_types_.codec.md).[toString](_types_.codec.md#tostring)*

*Defined in [types.ts:111](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L111)*

**`description`** Returns the string representation of the value

**Returns:** *string*

___

###  toU8a

▸ **toU8a**(`isBare?`: undefined | false | true): *Uint8Array*

*Inherited from [Codec](_types_.codec.md).[toU8a](_types_.codec.md#tou8a)*

*Defined in [types.ts:117](https://github.com/polkadot-js/api/blob/fb7e067/packages/types/src/types.ts#L117)*

**`description`** Encodes the value as a Uint8Array as per the SCALE specifications

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`isBare?` | undefined &#124; false &#124; true | true when the value has none of the type-specific prefixes (internal)  |

**Returns:** *Uint8Array*