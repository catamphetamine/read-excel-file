// The contents of this file is identical between the different exports:
// `/node`, `/browser`, etc.

import type { Input } from './input.d.js'

import type {
	SheetData
} from '../types/SheetData.d.js'

import type {
	Sheet
} from '../types/Sheet.d.js'

import type {
	Options
} from '../types/Options.d.js'

import type {
	OptionsWithSchema
} from '../types/OptionsWithSchema.d.js'

import type {
	ParseSheetDataOptions,
	ParseSheetDataResult
} from '../types/parseSheetData/parseSheetData.d.js'

import type {
	Schema
} from '../types/parseSheetData/parseSheetDataSchema.d.js'

import type {
	ParseSheetDataError
} from '../types/parseSheetData/parseSheetDataError.d.js'

export type {
	CellValue,
	Row,
	SheetData
} from '../types/SheetData.d.js'

export type {
	Sheet
} from '../types/Sheet.d.js'

export type {
	ParseSheetDataCustomType,
	// Base `type`s when parsing data.
	StringType as String,
	DateType as Date,
	NumberType as Number,
	BooleanType as Boolean,
	// Additional built-in `type`s when parsing data.
	Integer,
	Email,
	URL
} from '../types/parseSheetData/parseSheetDataValueType.d.js'

export type {
	ParseSheetDataCustomTypeErrorMessage,
	ParseSheetDataCustomTypeErrorReason,
	ParseSheetDataError,
	ParseSheetDataValueRequiredError
} from '../types/parseSheetData/parseSheetDataError.d.js'

export type {
	ParseSheetDataResult
} from '../types/parseSheetData/parseSheetData.d.js'

export type {
	Schema
} from '../types/parseSheetData/parseSheetDataSchema.d.js'

export default function readXlsxFile<ParsedNumber = number>(
	input: Input,
	options?: Options<ParsedNumber>
): Promise<Sheet<ParsedNumber>[]>;

export function readSheet<ParsedNumber = number>(
	input: Input,
	sheet?: number | string,
	options?: Options<ParsedNumber>
): Promise<SheetData<ParsedNumber>>;

export function readSheet<ParsedNumber = number>(
	input: Input,
	options?: Options<ParsedNumber>
): Promise<SheetData<ParsedNumber>>;

export function readSheet<
	Object extends object,
	ColumnTitle extends string = string,
	Error extends ParseSheetDataError = ParseSheetDataError<ColumnTitle>,
	ParsedNumber = number
>(
	input: Input,
	options: OptionsWithSchema<Object, ColumnTitle, ParsedNumber>
): Promise<ParseSheetDataResult<Object, ColumnTitle, Error>>;

export function parseSheetData<
	Object extends object,
	ColumnTitle extends string = string,
	Error extends ParseSheetDataError = ParseSheetDataError<ColumnTitle>
>(
	data: SheetData,
	schema: Schema<Object, ColumnTitle>,
	options?: ParseSheetDataOptions
): ParseSheetDataResult<Object, ColumnTitle, Error>;
