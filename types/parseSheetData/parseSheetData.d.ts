import type { ParseSheetDataError } from './parseSheetDataError.d.js'

interface ParseSheetDataResultSuccess<
	Object,
	ColumnTitle extends string
> {
	objects: Object[];
	errors: undefined;
	columns: ColumnTitle[];
}

interface ParseSheetDataResultError<
	Error extends ParseSheetDataError,
	ColumnTitle extends string
> {
	objects: undefined;
	errors: Error[];
	columns: ColumnTitle[];
}

export type ParseSheetDataResult<
	Object extends object,
	ColumnTitle extends string,
	Error extends ParseSheetDataError = ParseSheetDataError<ColumnTitle>
> =
	| ParseSheetDataResultSuccess<Object, ColumnTitle>
	| ParseSheetDataResultError<Error, ColumnTitle>

export interface ParseSheetDataOptions {
	propertyValueWhenColumnIsMissing?: any;
	propertyValueWhenCellIsEmpty?: any;
	transformEmptyArray?(arrayPropertyValue: never[], parameters: { path: string }): any;
	transformEmptyObject?(object: Record<string, undefined | null>, parameters: { path?: string }): any;
	// shouldSkipRequiredValidationWhenColumnIsMissing?(columnTitle: string, parameters: { object: Record<string, any> }): boolean;
	arrayValueSeparator?: string;
}