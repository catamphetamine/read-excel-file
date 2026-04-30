import type { ParseSheetDataValueType, ParseSheetDataCustomType } from './parseSheetDataValueType.d.js'

type SchemaEntryRequiredOrNot<Object> = boolean | ((row: Object) => boolean);

interface SchemaEntryForValue<
	Key extends keyof Object,
	Object extends object,
	TopLevelObject extends object,
	ColumnTitle extends string
> {
	column: ColumnTitle;
	type?: ParseSheetDataValueType<ParseSheetDataCustomType<Object[Key]>>;
	oneOf?: Object[Key][];
	required?: SchemaEntryRequiredOrNot<TopLevelObject>;
	validate?(value: Object[Key]): void;
}

// Implementing recursive types in TypeScript:
// https://dev.to/busypeoples/notes-on-typescript-recursive-types-and-immutability-5ck1
interface SchemaEntryRecursive<
	Key extends keyof Object,
	Object extends object,
	TopLevelObject extends object,
	ColumnTitle extends string
> {
	schema: Object[Key] extends object
		? Record<
			keyof Object[Key],
			SchemaEntry<keyof Object[Key], Object[Key], TopLevelObject, ColumnTitle>
		>
		: never;
	required?: SchemaEntryRequiredOrNot<TopLevelObject>;
}

type SchemaEntry<
	Key extends keyof Object,
	Object extends object,
	TopLevelObject extends object,
	ColumnTitle extends string
> =
	| SchemaEntryForValue<Key, Object, TopLevelObject, ColumnTitle>
	| SchemaEntryRecursive<Key, Object, TopLevelObject, ColumnTitle>;

export type Schema<
	Object extends object,
	ColumnTitle extends string = string
> = Record<
	keyof Object,
	SchemaEntry<keyof Object, Object, Object, ColumnTitle>
>