import type { CellValue } from '../SheetData.d.js';

export type StringType = StringConstructor;
export type DateType = DateConstructor;
export type NumberType = NumberConstructor;
export type BooleanType = BooleanConstructor;

// Parsed value `type` (foundational ones).
type ParseSheetDataBaseType =
	| StringType
	| DateType
	| NumberType
	| BooleanType

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
export type ParseSheetDataSchemaPropertyType<ParseSheetDataCustomType> =
	| ParseSheetDataBaseType
	| ParseSheetDataAdditionalType
	| ParseSheetDataCustomType;
