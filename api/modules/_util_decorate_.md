[Polkadot JS API](../README.md) › [Globals](../globals.md) › ["util/decorate"](_util_decorate_.md)

# External module: "util/decorate"

## Index

### Type aliases

* [DeriveAllSections](_util_decorate_.md#deriveallsections)

### Functions

* [decorateSections](_util_decorate_.md#decoratesections)

## Type aliases

###  DeriveAllSections

Ƭ **DeriveAllSections**: *object*

*Defined in [util/decorate.ts:13](https://github.com/polkadot-js/api/blob/fb7e067/packages/api/src/util/decorate.ts#L13)*

#### Type declaration:

## Functions

###  decorateSections

▸ **decorateSections**<**ApiType**, **AllSections**>(`allSections`: AllSections, `decorateMethod`: [DecorateMethod](_types_.md#decoratemethod)‹ApiType›): *[DeriveAllSections](_util_decorate_.md#deriveallsections)‹ApiType, AllSections›*

*Defined in [util/decorate.ts:46](https://github.com/polkadot-js/api/blob/fb7e067/packages/api/src/util/decorate.ts#L46)*

This is a section decorator which keeps all type information.

**Type parameters:**

▪ **ApiType**

▪ **AllSections**: *AnyDerive*

**Parameters:**

Name | Type |
------ | ------ |
`allSections` | AllSections |
`decorateMethod` | [DecorateMethod](_types_.md#decoratemethod)‹ApiType› |

**Returns:** *[DeriveAllSections](_util_decorate_.md#deriveallsections)‹ApiType, AllSections›*