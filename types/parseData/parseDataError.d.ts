import { CellValue } from '../types.d.js'

import {
	Constructor,
	ParseDataValueCustomType,
	ParseDataValueType,
	Integer,
	Email,
	URL
} from './parseDataValueType.d.js'

// When `error` is `"required"`, `value` could only be `null` or `undefined`.
export interface ParseDataValueRequiredError<
	ParseDataValueType = unknown,
	ColumnTitle = string
> {
	// row: number;
	column: ColumnTitle;
	type?: ParseDataValueType;
	error: 'required';
	reason: undefined;
	value: null | undefined;
}

// When `error` is not `"required"`, `value` is known to not be `null` or `undefined`
// because when `value` is `null` or `undefined`, it won't be parsed at all,
// so there can't be any error thrown during parsing phase.
interface ParseDataError_<
	ParseDataValueType extends ParseDataValueCustomType<unknown> | undefined = ParseDataValueCustomType<unknown>,
	ColumnTitle = string,
	ErrorMessage extends string = string,
	ErrorReason extends string | undefined = string | undefined
> {
	// row: number;
	column: ColumnTitle;
	type: ParseDataValueType;
	error: ErrorMessage;
	reason: ErrorReason;
	value: CellValue;
}

export interface ParseDataError<
	ParseDataValueType extends ParseDataValueCustomType<unknown> = ParseDataValueCustomType<unknown>,
	ColumnTitle = string,
	ErrorMessage extends string = string,
	ErrorReason extends string | undefined = string | undefined
> extends ParseDataError_<
	ParseDataValueType,
	ColumnTitle,
	ErrorMessage,
	ErrorReason
> {}

interface ParseDataErrorNotABoolean<ColumnTitle = string> extends ParseDataError_<
	Constructor<Boolean>,
	ColumnTitle,
	'not_a_boolean',
	undefined
> {
	value: Exclude<CellValue, boolean>;
}

interface ParseDataErrorNotADate<ColumnTitle = string> extends ParseDataError_<
	Constructor<Date>,
	ColumnTitle,
	'not_a_date',
	undefined
> {
	value: Exclude<CellValue, typeof Date | number>;
}

interface ParseDataErrorDateOutOfBounds<ColumnTitle = string> extends ParseDataError_<
	Constructor<Date>,
	ColumnTitle,
	'out_of_bounds',
	undefined
> {
	value: typeof Date;
}

interface ParseDataErrorNotAString<ColumnTitle = string> extends ParseDataError_<
	Constructor<String> | undefined,
	ColumnTitle,
	'not_a_string',
	undefined
> {
	value: Exclude<CellValue, string | number>;
}

interface ParseDataErrorStringInvalidNumber<ColumnTitle = string> extends ParseDataError_<
	Constructor<String> | undefined,
	ColumnTitle,
	'invalid_number',
	undefined
> {
	value: number;
}

interface ParseDataErrorStringNumberOutOfBounds<ColumnTitle = string> extends ParseDataError_<
	Constructor<String> | undefined,
	ColumnTitle,
	'out_of_bounds',
	undefined
> {
	value: number;
}

interface ParseDataErrorNotANumber<
	Type extends ParseDataValueCustomType<unknown> | undefined = Constructor<Number>,
	ColumnTitle = string
> extends ParseDataError_<
	Type,
	ColumnTitle,
	'not_a_number',
	undefined
> {
	value: Exclude<CellValue, number | string>;
}

interface ParseDataErrorNotANumberString<
	Type extends ParseDataValueCustomType<unknown> | undefined = Constructor<Number>,
	ColumnTitle = string
> extends ParseDataError_<
	Type,
	ColumnTitle,
	'not_a_number',
	undefined
> {
	value: string;
}

interface ParseDataErrorNumberInvalid<
	Type extends ParseDataValueCustomType<unknown> | undefined = Constructor<Number>,
	ColumnTitle = string
> extends ParseDataError_<
	Type,
	ColumnTitle,
	'invalid_number',
	undefined
> {
	value: number | string;
}

interface ParseDataErrorNumberOutOfBounds<
	Type extends ParseDataValueCustomType<unknown> | undefined = Constructor<Number>,
	ColumnTitle = string
> extends ParseDataError_<
	Type,
	ColumnTitle,
	'out_of_bounds',
	undefined
> {
	value: number | string;
}

type ParseDataBaseValueTypeError<ColumnTitle = string> =
	| ParseDataErrorNotABoolean<ColumnTitle>
	| ParseDataErrorNotADate<ColumnTitle>
	| ParseDataErrorDateOutOfBounds<ColumnTitle>
	| ParseDataErrorNotAString<ColumnTitle>
	| ParseDataErrorStringInvalidNumber<ColumnTitle>
	| ParseDataErrorStringNumberOutOfBounds<ColumnTitle>
	| ParseDataErrorNotANumber<Constructor<Number>, ColumnTitle>
	| ParseDataErrorNotANumberString<Constructor<Number>, ColumnTitle>
	| ParseDataErrorNumberInvalid<Constructor<Number>, ColumnTitle>
	| ParseDataErrorNumberOutOfBounds<Constructor<Number>, ColumnTitle>;

interface ParseDataErrorNotAnInteger<ColumnTitle = string> extends ParseDataError_<
	typeof Integer,
	ColumnTitle,
	'not_an_integer',
	undefined
> {
	value: number | string;
}

interface ParseDataErrorIntegerNotANumber<ColumnTitle = string> extends ParseDataErrorNotANumber<typeof Integer, ColumnTitle> {}
interface ParseDataErrorIntegerNotANumberString<ColumnTitle = string> extends ParseDataErrorNotANumberString<typeof Integer, ColumnTitle> {}
interface ParseDataErrorIntegerNumberInvalid<ColumnTitle = string> extends ParseDataErrorNumberInvalid<typeof Integer, ColumnTitle> {}
interface ParseDataErrorIntegerNumberOutOfBounds<ColumnTitle = string> extends ParseDataErrorNumberOutOfBounds<typeof Integer, ColumnTitle> {}

interface ParseDataErrorNotAUrl<ColumnTitle = string> extends ParseDataError_<
	typeof URL,
	ColumnTitle,
	'not_a_url',
	undefined
> {
	value: string;
}

interface ParseDataErrorUrlNotAString<ColumnTitle = string> extends ParseDataError_<
	typeof URL,
	ColumnTitle,
	'not_a_string',
	undefined
> {
	value: Exclude<CellValue, string>;
}

interface ParseDataErrorNotAnEmail<ColumnTitle = string> extends ParseDataError_<
	typeof Email,
	ColumnTitle,
	'not_an_email',
	undefined
> {
	value: string;
}

interface ParseDataErrorEmailNotAString<ColumnTitle = string> extends ParseDataError_<
	typeof Email,
	ColumnTitle,
	'not_a_string',
	undefined
> {
	value: Exclude<CellValue, string>;
}

type ParseDataAdditionalBuiltInValueTypeError<ColumnTitle = string> =
	| ParseDataErrorNotAnInteger<ColumnTitle>
	| ParseDataErrorIntegerNotANumber<ColumnTitle>
	| ParseDataErrorIntegerNotANumberString<ColumnTitle>
	| ParseDataErrorIntegerNumberInvalid<ColumnTitle>
	| ParseDataErrorIntegerNumberOutOfBounds<ColumnTitle>
	| ParseDataErrorNotAUrl<ColumnTitle>
	| ParseDataErrorUrlNotAString<ColumnTitle>
	| ParseDataErrorNotAnEmail<ColumnTitle>
	| ParseDataErrorEmailNotAString<ColumnTitle>;

type ParseDataBuiltInValueTypeError<ColumnTitle = string> =
	| ParseDataBaseValueTypeError<ColumnTitle>
	| ParseDataAdditionalBuiltInValueTypeError<ColumnTitle>;

export type ParseDataPossibleError<
	ParseDataValueCustomType_ extends ParseDataValueCustomType<unknown>,
	ColumnTitle = string
> =
	| ParseDataBuiltInValueTypeError<ColumnTitle>
	| ParseDataValueRequiredError<ParseDataValueType<ParseDataValueCustomType_>, ColumnTitle>
	| ParseDataError<ParseDataValueType<ParseDataValueCustomType_>, ColumnTitle>;
