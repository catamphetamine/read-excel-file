import { CellValue } from '../types.d.js'

import {
	StringType,
	DateType,
	NumberType,
	BooleanType,
	Integer,
	Email,
	URL,
	ParseDataCustomType,
	ParseDataValueType
} from './parseDataValueType.d.js'

export interface ParseDataValueRequiredError<
	ColumnTitle extends string = string,
	CustomType extends ParseDataCustomType<unknown> = never
> {
	// row: number;
	column: ColumnTitle;
	// `type: undefined` is treated as `type: String`.
	type?: ParseDataValueType<CustomType>;
	error: 'required';
	reason: undefined;
	// When `error` is `"required"`, `value` could only be `null` or `undefined`.
	// * `null` means "cell is empty"
	// * `undefined` means "column is missing"
	value: null | undefined;
}

interface ParseDataError_<
	ColumnTitle extends string,
	// ` | undefined` is added to support `parseData()` errors that originate
	// on properties that have no `type` property specified. In such cases,
	// `type` defaults to `String`.
	//
	// One could ask: "Why is then the `type` not simply marked as optional?".
	// The answer is that `type` could only be `undefined` in case of `parseData()` errors
	// that originate from `type: String` parser while other type parsers can't have `type` be `undefined`.
	//
	Type extends ParseDataValueType<unknown> | undefined,
	ErrorMessage extends string,
	ErrorReason extends string | undefined
> {
	// row: number;
	column: ColumnTitle;
	type: Type;
	error: ErrorMessage;
	reason: ErrorReason;
	// When `error` is not `"required"`, `value` is known to not be `null` or `undefined`
	// because when `value` is `null` or `undefined`, it won't be parsed at all,
	// so there can't be any error thrown during parsing phase.
	value: CellValue;
}

export type ParseDataCustomTypeErrorMessage<
	CustomType extends ParseDataCustomType<unknown>
> = string

export type ParseDataCustomTypeErrorReason<
	CustomType extends ParseDataCustomType<unknown>,
	ErrorMessage extends ParseDataCustomTypeErrorMessage<CustomType>
> = string | undefined

// This is just a public export. It's not used internally.
interface ParseDataErrorCustomType<
	ColumnTitle extends string = string,
	CustomType extends ParseDataCustomType<unknown> = never,
	ErrorMessage extends ParseDataCustomTypeErrorMessage<CustomType> = string,
	ErrorReason extends ParseDataCustomTypeErrorReason<CustomType, ErrorMessage> = string | undefined
> extends ParseDataError_<
	ColumnTitle,
	CustomType,
	ErrorMessage,
	ErrorReason
> {}

interface ParseDataErrorNotABoolean<ColumnTitle extends string = string> extends ParseDataError_<
	ColumnTitle,
	BooleanType,
	'not_a_boolean',
	undefined
> {
	value: Exclude<CellValue, boolean>;
}

interface ParseDataErrorNotADate<ColumnTitle extends string = string> extends ParseDataError_<
	ColumnTitle,
	DateType,
	'not_a_date',
	undefined
> {
	value: Exclude<CellValue, typeof Date | number>;
}

interface ParseDataErrorDateOutOfBounds<ColumnTitle extends string = string> extends ParseDataError_<
	ColumnTitle,
	DateType,
	'out_of_bounds',
	undefined
> {
	value: typeof Date;
}

interface ParseDataErrorNotAString<ColumnTitle extends string = string> extends ParseDataError_<
	ColumnTitle,
	StringType | undefined,
	'not_a_string',
	undefined
> {
	value: Exclude<CellValue, string | number>;
}

interface ParseDataErrorStringInvalidNumber<ColumnTitle extends string = string> extends ParseDataError_<
	ColumnTitle,
	StringType | undefined,
	'invalid_number',
	undefined
> {
	value: number;
}

interface ParseDataErrorStringNumberOutOfBounds<ColumnTitle extends string = string> extends ParseDataError_<
	ColumnTitle,
	StringType | undefined,
	'out_of_bounds',
	undefined
> {
	value: number;
}

interface ParseDataErrorNotANumber<
	ColumnTitle extends string = string,
	Type extends ParseDataCustomType<unknown> | undefined = NumberType
> extends ParseDataError_<
	ColumnTitle,
	Type,
	'not_a_number',
	undefined
> {
	value: Exclude<CellValue, number | string>;
}

interface ParseDataErrorNotANumberString<
	ColumnTitle extends string = string,
	Type extends ParseDataCustomType<unknown> | undefined = NumberType
> extends ParseDataError_<
	ColumnTitle,
	Type,
	'not_a_number',
	undefined
> {
	value: string;
}

interface ParseDataErrorNumberInvalid<
	ColumnTitle extends string = string,
	Type extends ParseDataCustomType<unknown> | undefined = NumberType
> extends ParseDataError_<
	ColumnTitle,
	Type,
	'invalid_number',
	undefined
> {
	value: number | string;
}

interface ParseDataErrorNumberOutOfBounds<
	ColumnTitle extends string = string,
	Type extends ParseDataCustomType<unknown> | undefined = NumberType
> extends ParseDataError_<
	ColumnTitle,
	Type,
	'out_of_bounds',
	undefined
> {
	value: number | string;
}

type ParseDataBaseValueTypeError<ColumnTitle extends string = string> =
	| ParseDataErrorNotABoolean<ColumnTitle>
	| ParseDataErrorNotADate<ColumnTitle>
	| ParseDataErrorDateOutOfBounds<ColumnTitle>
	| ParseDataErrorNotAString<ColumnTitle>
	| ParseDataErrorStringInvalidNumber<ColumnTitle>
	| ParseDataErrorStringNumberOutOfBounds<ColumnTitle>
	| ParseDataErrorNotANumber<ColumnTitle, NumberType>
	| ParseDataErrorNotANumberString<ColumnTitle, NumberType>
	| ParseDataErrorNumberInvalid<ColumnTitle, NumberType>
	| ParseDataErrorNumberOutOfBounds<ColumnTitle, NumberType>;

interface ParseDataErrorNotAnInteger<ColumnTitle extends string = string> extends ParseDataError_<
	ColumnTitle,
	typeof Integer,
	'not_an_integer',
	undefined
> {
	value: number | string;
}

interface ParseDataErrorIntegerNotANumber<ColumnTitle extends string = string> extends ParseDataErrorNotANumber<ColumnTitle, typeof Integer> {}
interface ParseDataErrorIntegerNotANumberString<ColumnTitle extends string = string> extends ParseDataErrorNotANumberString<ColumnTitle, typeof Integer> {}
interface ParseDataErrorIntegerNumberInvalid<ColumnTitle extends string = string> extends ParseDataErrorNumberInvalid<ColumnTitle, typeof Integer> {}
interface ParseDataErrorIntegerNumberOutOfBounds<ColumnTitle extends string = string> extends ParseDataErrorNumberOutOfBounds<ColumnTitle, typeof Integer> {}

interface ParseDataErrorNotAUrl<ColumnTitle extends string = string> extends ParseDataError_<
	ColumnTitle,
	typeof URL,
	'not_a_url',
	undefined
> {
	value: string;
}

interface ParseDataErrorUrlNotAString<ColumnTitle extends string = string> extends ParseDataError_<
	ColumnTitle,
	typeof URL,
	'not_a_string',
	undefined
> {
	value: Exclude<CellValue, string>;
}

interface ParseDataErrorNotAnEmail<ColumnTitle extends string = string> extends ParseDataError_<
	ColumnTitle,
	typeof Email,
	'not_an_email',
	undefined
> {
	value: string;
}

interface ParseDataErrorEmailNotAString<ColumnTitle extends string = string> extends ParseDataError_<
	ColumnTitle,
	typeof Email,
	'not_a_string',
	undefined
> {
	value: Exclude<CellValue, string>;
}

type ParseDataAdditionalValueTypeError<ColumnTitle extends string = string> =
	| ParseDataErrorNotAnInteger<ColumnTitle>
	| ParseDataErrorIntegerNotANumber<ColumnTitle>
	| ParseDataErrorIntegerNotANumberString<ColumnTitle>
	| ParseDataErrorIntegerNumberInvalid<ColumnTitle>
	| ParseDataErrorIntegerNumberOutOfBounds<ColumnTitle>
	| ParseDataErrorNotAUrl<ColumnTitle>
	| ParseDataErrorUrlNotAString<ColumnTitle>
	| ParseDataErrorNotAnEmail<ColumnTitle>
	| ParseDataErrorEmailNotAString<ColumnTitle>;

type ParseDataBuiltInValueTypeError<ColumnTitle extends string = string> =
	| ParseDataBaseValueTypeError<ColumnTitle>
	| ParseDataAdditionalValueTypeError<ColumnTitle>;

interface ParseDataArrayValueSyntaxError<
	ColumnTitle extends string = string,
	ParseDataCustomType_ extends ParseDataCustomType<unknown> = ParseDataCustomType<unknown>
> extends ParseDataError_<
	ColumnTitle,
	ParseDataValueType<ParseDataCustomType_>,
	'invalid',
	'syntax'
> {}

export type ParseDataError<
	ColumnTitle extends string = string,
	CustomType extends ParseDataCustomType<unknown> = never,
	ErrorMessage extends ParseDataCustomTypeErrorMessage<CustomType> = string,
	ErrorReason extends ParseDataCustomTypeErrorReason<CustomType, ErrorMessage> = string | undefined
> =
	| ParseDataBuiltInValueTypeError<ColumnTitle>
	| ParseDataValueRequiredError<ColumnTitle, ParseDataValueType<CustomType>>
	| ParseDataArrayValueSyntaxError<ColumnTitle, ParseDataValueType<CustomType>>
	| ParseDataErrorCustomType<
		ColumnTitle,
		ParseDataValueType<CustomType>,
		ErrorMessage,
		ErrorReason
	>;
