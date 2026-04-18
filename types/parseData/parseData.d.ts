import { ParseDataError } from './parseDataError.d.js'

interface ParseDataResultSuccess<Object> {
	objects: Object[];
	errors: undefined;
}

interface ParseDataResultError<
	Error extends ParseDataError
> {
	objects: undefined;
	errors: Error[];
}

export type ParseDataResult<
	Object,
	Error extends ParseDataError = ParseDataError
> =
	| ParseDataResultSuccess<Object>
	| ParseDataResultError<Error>

export interface ParseDataOptions {
	propertyValueWhenColumnIsMissing?: any;
	propertyValueWhenCellIsEmpty?: any;
	transformEmptyArray?(arrayPropertyValue: never[], parameters: { path: string }): any;
	transformEmptyObject?(object: Record<string, undefined | null>, parameters: { path?: string }): any;
	// shouldSkipRequiredValidationWhenColumnIsMissing?(columnTitle: string, parameters: { object: Record<string, any> }): boolean;
	arrayValueSeparator?: string;
}