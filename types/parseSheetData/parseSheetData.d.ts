import { ParseSheetDataError } from './parseSheetDataError.d.js'

interface ParseSheetDataResultSuccess<Object> {
	objects: Object[];
	errors: undefined;
}

interface ParseSheetDataResultError<
	Error extends ParseSheetDataError
> {
	objects: undefined;
	errors: Error[];
}

export type ParseSheetDataResult<
	Object,
	Error extends ParseSheetDataError = ParseSheetDataError
> =
	| ParseSheetDataResultSuccess<Object>
	| ParseSheetDataResultError<Error>

export interface ParseSheetDataOptions {
	propertyValueWhenColumnIsMissing?: any;
	propertyValueWhenCellIsEmpty?: any;
	transformEmptyArray?(arrayPropertyValue: never[], parameters: { path: string }): any;
	transformEmptyObject?(object: Record<string, undefined | null>, parameters: { path?: string }): any;
	// shouldSkipRequiredValidationWhenColumnIsMissing?(columnTitle: string, parameters: { object: Record<string, any> }): boolean;
	arrayValueSeparator?: string;
}