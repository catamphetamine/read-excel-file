// The contents of this file is identical between the different exports:
// `/node`, `/browser`, etc.

import { Input } from './input.d.js'

import {
	SheetData,
	ReadOptions,
	ReadFileResult
} from '../types/types.d.js';

import {
	ParseSheetDataOptions,
	ParseSheetDataResult
} from '../types/parseSheetData/parseSheetData.d.js';

import {
	Schema
} from '../types/parseSheetData/parseSheetDataSchema.d.js';

import {
	ParseSheetDataError
} from '../types/parseSheetData/parseSheetDataError.d.js';

export {
	CellValue,
	Row,
	SheetData,
	Sheet
} from '../types/types.d.js';

export {
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
} from '../types/parseSheetData/parseSheetDataValueType.d.js';

export {
	ParseSheetDataCustomTypeErrorMessage,
	ParseSheetDataCustomTypeErrorReason,
	ParseSheetDataError,
	ParseSheetDataValueRequiredError
} from '../types/parseSheetData/parseSheetDataError.d.js';

export {
	ParseSheetDataResult
} from '../types/parseSheetData/parseSheetData.d.js';

export {
	Schema
} from '../types/parseSheetData/parseSheetDataSchema.d.js';

export default function readXlsxFile<ParsedNumber = number>(
	input: Input,
	options?: ReadOptions<ParsedNumber>
): Promise<ReadFileResult<ParsedNumber>>;

export function readSheet<ParsedNumber = number>(
	input: Input,
	sheet?: number | string,
	options?: ReadOptions<ParsedNumber>
): Promise<SheetData<ParsedNumber>>;

export function readSheet<ParsedNumber = number>(
	input: Input,
	options?: ReadOptions<ParsedNumber>
): Promise<SheetData<ParsedNumber>>;

export function parseSheetData<
	Object extends object,
	ColumnTitle extends string,
	Error extends ParseSheetDataError
>(
	data: SheetData,
	schema: Schema<Object, ColumnTitle>,
	options?: ParseSheetDataOptions
): ParseSheetDataResult<Object, Error>;
