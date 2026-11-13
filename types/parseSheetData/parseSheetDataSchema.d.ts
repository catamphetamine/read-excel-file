import type { ParseSheetDataSchemaPropertyType, ParseSheetDataCustomType } from './parseSheetDataSchemaPropertyType.d.js'

type SchemaEntryRequiredOrNot<
	TopLevelObject extends object
> = boolean | ((object: TopLevelObject) => boolean);

interface SchemaEntryForProperty<
	Key extends keyof PropertyContainerObject,
	PropertyContainerObject extends object,
	TopLevelObject extends object,
	ColumnTitle extends string
> {
	column: ColumnTitle;
	type?: ParseSheetDataSchemaPropertyType<ParseSheetDataCustomType<PropertyContainerObject[Key]>>;
	oneOf?: PropertyContainerObject[Key][];
	required?: SchemaEntryRequiredOrNot<TopLevelObject>;
	validate?(value: NonNullable<PropertyContainerObject[Key]>): void;
}

// Same as `SchemaEntryForProperty` but shorter.
// It can be used in simple cases when no `type` is specified,
// or no `required` requirements are set and no `validation` is required..
type SchemaEntryForPropertyShortNotation<ColumnTitle extends string> = ColumnTitle

// Implementing recursive types in TypeScript:
// https://dev.to/busypeoples/notes-on-typescript-recursive-types-and-immutability-5ck1
interface SchemaEntryForNestedObject<
	Key extends keyof ContainerObject,
	ContainerObject extends object,
	TopLevelObject extends object,
	ColumnTitle extends string
> {
	schema: ContainerObject[Key] extends object
		? NestedSchemaForObject<ContainerObject[Key], TopLevelObject, ColumnTitle>
		: never;
	required?: SchemaEntryRequiredOrNot<TopLevelObject>;
}

// Same as `SchemaEntryForNestedObject` but shorter.
// It can be used when no `required` requirements are set.
type SchemaEntryForNestedObjectShortNotation<
	Key extends keyof ContainerObject,
	ContainerObject extends object,
	TopLevelObject extends object,
	ColumnTitle extends string
> = ContainerObject[Key] extends object
	? NestedSchemaForObject<ContainerObject[Key], TopLevelObject, ColumnTitle>
	: never;

type SchemaEntry<
	Key extends keyof KeyContainerObject,
	KeyContainerObject extends object,
	TopLevelObject extends object,
	ColumnTitle extends string
> =
	| SchemaEntryForProperty<Key, KeyContainerObject, TopLevelObject, ColumnTitle>
	| SchemaEntryForPropertyShortNotation<ColumnTitle>
	| SchemaEntryForNestedObject<Key, KeyContainerObject, TopLevelObject, ColumnTitle>
	| SchemaEntryForNestedObjectShortNotation<Key, KeyContainerObject, TopLevelObject, ColumnTitle>;

type NestedSchemaForObject<
	Object extends object,
	TopLevelObject extends object,
	ColumnTitle extends string
> = {
	[Key in keyof Object]: SchemaEntry<Key, Object, TopLevelObject, ColumnTitle>
}

export type Schema<
	Object extends object,
	ColumnTitle extends string = string
> = NestedSchemaForObject<Object, Object, ColumnTitle>