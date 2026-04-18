// The contents of this file is identical between the different exports:
// `/node`, `/browser`, etc.

import { Input } from './input.d.js'

import {
	SheetData,
	ReadOptions,
	ReadFileResult
} from '../types/types.d.js';

import {
	ParseDataOptions,
	ParseDataResult
} from '../types/parseData/parseData.d.js';

import {
	Schema
} from '../types/parseData/parseDataSchema.d.js';

import {
	ParseDataError
} from '../types/parseData/parseDataError.d.js';

export {
	CellValue,
	Row,
	SheetData,
	Sheet
} from '../types/types.d.js';

export {
	ParseDataCustomType,
	// Base `type`s when parsing data.
	StringType as String,
	DateType as Date,
	NumberType as Number,
	BooleanType as Boolean,
	// Additional built-in `type`s when parsing data.
	Integer,
	Email,
	URL
} from '../types/parseData/parseDataValueType.d.js';

export {
	ParseDataCustomTypeErrorMessage,
	ParseDataCustomTypeErrorReason,
	ParseDataError,
	ParseDataValueRequiredError
} from '../types/parseData/parseDataError.d.js';

export {
	ParseDataResult
} from '../types/parseData/parseData.d.js';

export {
	Schema
} from '../types/parseData/parseDataSchema.d.js';

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

export function parseData<
	Object extends object,
	ColumnTitle extends string,
	Error extends ParseDataError
>(
	data: SheetData,
	schema: Schema<Object, ColumnTitle>,
	options?: ParseDataOptions
): ParseDataResult<Object, Error>;
