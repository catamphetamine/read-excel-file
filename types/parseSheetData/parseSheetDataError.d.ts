import { CellValue } from '../types.d.js'

import {
	StringType,
	DateType,
	NumberType,
	BooleanType,
	Integer,
	Email,
	URL,
	ParseSheetDataCustomType,
	ParseSheetDataValueType
} from './parseSheetDataValueType.d.js'

export interface ParseSheetDataValueRequiredError<
	ColumnTitle extends string = string,
	CustomType extends ParseSheetDataCustomType<unknown> = never
> {
	row: number;
	column: ColumnTitle;
	columnIndex: number;
	error: 'required';
	reason: undefined;
	// When `error` is `"required"`, `value` could only be `null` or `undefined`.
	// * `null` means "cell is empty"
	// * `undefined` means "column is missing"
	value: null | undefined;
	// When `type` is not specified, it assumes `type: String`.
	type?: ParseSheetDataValueType<CustomType>;
}

interface ParseSheetDataError_<
	ColumnTitle extends string,
	// ` | undefined` is added to support `parseSheetData()` errors that originate
	// on properties that have no `type` property specified. In such cases,
	// `type` defaults to `String`.
	//
	// One could ask: "Why is then the `type` not simply marked as optional?".
	// The answer is that `type` could only be `undefined` in case of `parseSheetData()` errors
	// that originate from `type: String` parser while other type parsers can't have `type` be `undefined`.
	//
	ValueType extends ParseSheetDataValueType<unknown> | undefined,
	ErrorMessage extends string,
	ErrorReason extends string | undefined
> {
	row: number;
	column: ColumnTitle;
	columnIndex: number;
	error: ErrorMessage;
	reason: ErrorReason;
	// When `error` is not `"required"`, `value` is known to not be `null` or `undefined`
	// because when `value` is `null` or `undefined`, it won't be parsed at all,
	// so there can't be any error thrown during parsing phase.
	value: CellValue;
	type: ValueType;
}

export type ParseSheetDataCustomTypeErrorMessage<
	CustomType extends ParseSheetDataCustomType<unknown>
> = string

export type ParseSheetDataCustomTypeErrorReason<
	CustomType extends ParseSheetDataCustomType<unknown>,
	ErrorMessage extends ParseSheetDataCustomTypeErrorMessage<CustomType>
> = string | undefined

// This is just a public export. It's not used internally.
interface ParseSheetDataErrorCustomType<
	ColumnTitle extends string = string,
	CustomType extends ParseSheetDataCustomType<unknown> = never,
	ErrorMessage extends ParseSheetDataCustomTypeErrorMessage<CustomType> = string,
	ErrorReason extends ParseSheetDataCustomTypeErrorReason<CustomType, ErrorMessage> = string | undefined
> extends ParseSheetDataError_<
	ColumnTitle,
	CustomType,
	ErrorMessage,
	ErrorReason
> {}

interface ParseSheetDataErrorNotABoolean<ColumnTitle extends string = string> extends ParseSheetDataError_<
	ColumnTitle,
	BooleanType,
	'not_a_boolean',
	undefined
> {
	value: Exclude<CellValue, boolean>;
}

interface ParseSheetDataErrorNotADate<ColumnTitle extends string = string> extends ParseSheetDataError_<
	ColumnTitle,
	DateType,
	'not_a_date',
	undefined
> {
	value: Exclude<CellValue, typeof Date | number>;
}

interface ParseSheetDataErrorDateOutOfBounds<ColumnTitle extends string = string> extends ParseSheetDataError_<
	ColumnTitle,
	DateType,
	'out_of_bounds',
	undefined
> {
	value: typeof Date;
}

interface ParseSheetDataErrorNotAString<ColumnTitle extends string = string> extends ParseSheetDataError_<
	ColumnTitle,
	StringType | undefined,
	'not_a_string',
	undefined
> {
	value: Exclude<CellValue, string | number>;
}

interface ParseSheetDataErrorStringInvalidNumber<ColumnTitle extends string = string> extends ParseSheetDataError_<
	ColumnTitle,
	StringType | undefined,
	'invalid_number',
	undefined
> {
	value: number;
}

interface ParseSheetDataErrorStringNumberOutOfBounds<ColumnTitle extends string = string> extends ParseSheetDataError_<
	ColumnTitle,
	StringType | undefined,
	'out_of_bounds',
	undefined
> {
	value: number;
}

interface ParseSheetDataErrorNotANumber<
	ColumnTitle extends string = string,
	ValueType extends ParseSheetDataCustomType<unknown> | undefined = NumberType
> extends ParseSheetDataError_<
	ColumnTitle,
	ValueType,
	'not_a_number',
	undefined
> {
	value: Exclude<CellValue, number | string>;
}

interface ParseSheetDataErrorNotANumberString<
	ColumnTitle extends string = string,
	ValueType extends ParseSheetDataCustomType<unknown> | undefined = NumberType
> extends ParseSheetDataError_<
	ColumnTitle,
	ValueType,
	'not_a_number',
	undefined
> {
	value: string;
}

interface ParseSheetDataErrorNumberInvalid<
	ColumnTitle extends string = string,
	ValueType extends ParseSheetDataCustomType<unknown> | undefined = NumberType
> extends ParseSheetDataError_<
	ColumnTitle,
	ValueType,
	'invalid_number',
	undefined
> {
	value: number | string;
}

interface ParseSheetDataErrorNumberOutOfBounds<
	ColumnTitle extends string = string,
	ValueType extends ParseSheetDataCustomType<unknown> | undefined = NumberType
> extends ParseSheetDataError_<
	ColumnTitle,
	ValueType,
	'out_of_bounds',
	undefined
> {
	value: number | string;
}

type ParseSheetDataBaseValueTypeError<ColumnTitle extends string = string> =
	| ParseSheetDataErrorNotABoolean<ColumnTitle>
	| ParseSheetDataErrorNotADate<ColumnTitle>
	| ParseSheetDataErrorDateOutOfBounds<ColumnTitle>
	| ParseSheetDataErrorNotAString<ColumnTitle>
	| ParseSheetDataErrorStringInvalidNumber<ColumnTitle>
	| ParseSheetDataErrorStringNumberOutOfBounds<ColumnTitle>
	| ParseSheetDataErrorNotANumber<ColumnTitle, NumberType>
	| ParseSheetDataErrorNotANumberString<ColumnTitle, NumberType>
	| ParseSheetDataErrorNumberInvalid<ColumnTitle, NumberType>
	| ParseSheetDataErrorNumberOutOfBounds<ColumnTitle, NumberType>;

interface ParseSheetDataErrorNotAnInteger<ColumnTitle extends string = string> extends ParseSheetDataError_<
	ColumnTitle,
	typeof Integer,
	'not_an_integer',
	undefined
> {
	value: number | string;
}

interface ParseSheetDataErrorIntegerNotANumber<ColumnTitle extends string = string> extends ParseSheetDataErrorNotANumber<ColumnTitle, typeof Integer> {}
interface ParseSheetDataErrorIntegerNotANumberString<ColumnTitle extends string = string> extends ParseSheetDataErrorNotANumberString<ColumnTitle, typeof Integer> {}
interface ParseSheetDataErrorIntegerNumberInvalid<ColumnTitle extends string = string> extends ParseSheetDataErrorNumberInvalid<ColumnTitle, typeof Integer> {}
interface ParseSheetDataErrorIntegerNumberOutOfBounds<ColumnTitle extends string = string> extends ParseSheetDataErrorNumberOutOfBounds<ColumnTitle, typeof Integer> {}

interface ParseSheetDataErrorNotAUrl<ColumnTitle extends string = string> extends ParseSheetDataError_<
	ColumnTitle,
	typeof URL,
	'not_a_url',
	undefined
> {
	value: string;
}

interface ParseSheetDataErrorUrlNotAString<ColumnTitle extends string = string> extends ParseSheetDataError_<
	ColumnTitle,
	typeof URL,
	'not_a_string',
	undefined
> {
	value: Exclude<CellValue, string>;
}

interface ParseSheetDataErrorNotAnEmail<ColumnTitle extends string = string> extends ParseSheetDataError_<
	ColumnTitle,
	typeof Email,
	'not_an_email',
	undefined
> {
	value: string;
}

interface ParseSheetDataErrorEmailNotAString<ColumnTitle extends string = string> extends ParseSheetDataError_<
	ColumnTitle,
	typeof Email,
	'not_a_string',
	undefined
> {
	value: Exclude<CellValue, string>;
}

type ParseSheetDataAdditionalValueTypeError<ColumnTitle extends string = string> =
	| ParseSheetDataErrorNotAnInteger<ColumnTitle>
	| ParseSheetDataErrorIntegerNotANumber<ColumnTitle>
	| ParseSheetDataErrorIntegerNotANumberString<ColumnTitle>
	| ParseSheetDataErrorIntegerNumberInvalid<ColumnTitle>
	| ParseSheetDataErrorIntegerNumberOutOfBounds<ColumnTitle>
	| ParseSheetDataErrorNotAUrl<ColumnTitle>
	| ParseSheetDataErrorUrlNotAString<ColumnTitle>
	| ParseSheetDataErrorNotAnEmail<ColumnTitle>
	| ParseSheetDataErrorEmailNotAString<ColumnTitle>;

type ParseSheetDataBuiltInValueTypeError<ColumnTitle extends string = string> =
	| ParseSheetDataBaseValueTypeError<ColumnTitle>
	| ParseSheetDataAdditionalValueTypeError<ColumnTitle>;

interface ParseSheetDataArrayValueNotAStringError<
	ColumnTitle extends string = string,
	ParseSheetDataCustomType_ extends ParseSheetDataCustomType<unknown> = ParseSheetDataCustomType<unknown>
> extends ParseSheetDataError_<
	ColumnTitle,
	ParseSheetDataValueType<ParseSheetDataCustomType_>,
	'not_a_string',
	undefined
> {}

interface ParseSheetDataArrayValueSyntaxError<
	ColumnTitle extends string = string,
	ParseSheetDataCustomType_ extends ParseSheetDataCustomType<unknown> = ParseSheetDataCustomType<unknown>
> extends ParseSheetDataError_<
	ColumnTitle,
	ParseSheetDataValueType<ParseSheetDataCustomType_>,
	'invalid',
	'syntax'
> {}

export type ParseSheetDataError<
	ColumnTitle extends string = string,
	CustomType extends ParseSheetDataCustomType<unknown> = never,
	ErrorMessage extends ParseSheetDataCustomTypeErrorMessage<CustomType> = string,
	ErrorReason extends ParseSheetDataCustomTypeErrorReason<CustomType, ErrorMessage> = string | undefined
> =
	| ParseSheetDataBuiltInValueTypeError<ColumnTitle>
	| ParseSheetDataValueRequiredError<ColumnTitle, ParseSheetDataValueType<CustomType>>
	| ParseSheetDataArrayValueNotAStringError<ColumnTitle, ParseSheetDataValueType<CustomType>>
	| ParseSheetDataArrayValueSyntaxError<ColumnTitle, ParseSheetDataValueType<CustomType>>
	| ParseSheetDataErrorCustomType<
		ColumnTitle,
		ParseSheetDataValueType<CustomType>,
		ErrorMessage,
		ErrorReason
	>;
