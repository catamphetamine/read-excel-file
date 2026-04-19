import { CellValue } from '../types.d.js';

// A way to define a `type = String` or `type = Number` variable in TypeScript
// is by defining it as `type: StringConstructor` or `type: NumberConstructor`.
// https://gitlab.com/catamphetamine/write-excel-file/-/issues/4#note_715204034
// https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
export type Constructor<Type> =
	Type extends String
		? StringConstructor
		: Type extends Date
			? DateConstructor
			: Type extends Number
				? NumberConstructor
				: Type extends Boolean
					? BooleanConstructor
					: never;

export type StringType = Constructor<String>;
export type DateType = Constructor<Date>;
export type NumberType = Constructor<Number>;
export type BooleanType = Constructor<Boolean>;

// Parsed value `type` (foundational ones).
type ParseSheetDataBaseType =
	Constructor<String> |
	Constructor<Date> |
	Constructor<Number> |
	Constructor<Boolean>;

// Parsed value `type` (additional built-in ones).
export function Integer(value: CellValue): number;
export function URL(value: CellValue): string;
export function Email(value: CellValue): string;

type ParseSheetDataAdditionalType =
	| typeof Integer
	| typeof URL
	| typeof Email;

// Parsed value `type` (custom one).
// A function that receives a cell `value` and returns a "parsed" value.
// Returning `undefined` will have same effect as returning `null`.
// When cell value is `undefined` or `null`, its `type` is completely ignored (skipped).
export type ParseSheetDataCustomType<ParsedValue> = (value: CellValue) => ParsedValue | undefined;

// Schema entry `type`: foundational ones, additional ones, custom ones.
export type ParseSheetDataValueType<ParseSheetDataCustomType> =
	| ParseSheetDataBaseType
	| ParseSheetDataAdditionalType
	| ParseSheetDataCustomType;
