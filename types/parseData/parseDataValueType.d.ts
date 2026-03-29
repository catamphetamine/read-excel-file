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

// Parsed value `type` (foundational ones).
type BaseType =
	Constructor<String> |
	Constructor<Date> |
	Constructor<Number> |
	Constructor<Boolean>;

// Parsed value `type` (custom one).
// A function that receives a cell `value` and returns a "parsed" value.
// Returning `undefined` will have same effect as returning `null`.
// When cell value is `undefined` or `null`, its `type` is completely ignored (skipped).
export type ParseDataValueCustomType<ParsedValue> = (value: CellValue) => ParsedValue | undefined | null;

// Parsed value `type` (additional built-in ones).
export function Integer(value: CellValue): number;
export function URL(value: CellValue): string;
export function Email(value: CellValue): string;

type AdditionalBuiltInParseDataValueType =
	| typeof Integer
	| typeof URL
	| typeof Email;

// Schema entry `type`: foundational ones, additional ones, custom ones.
export type ParseDataValueType<ParseDataValueCustomType> =
	| BaseType
	| AdditionalBuiltInParseDataValueType
	| ParseDataValueCustomType;
