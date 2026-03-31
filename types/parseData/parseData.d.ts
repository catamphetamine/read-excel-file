import { ParseDataError } from './parseDataError.d.js'

export type ParseDataResult<
	Object,
	Error extends ParseDataError = ParseDataError
> = ParseDataResultItem<
	Object,
	Error
>[]

type ParseDataResultItem<
	Object,
	Error extends ParseDataError
> =
	| ParseDataResultItemSuccess<Object>
	| ParseDataResultItemError<Error>

interface ParseDataResultItemSuccess<Object> {
	object: Object;
	errors: undefined;
}

interface ParseDataResultItemError<
	Error extends ParseDataError
> {
	object: undefined;
	errors: Error[];
}

export interface ParseDataOptions {
	propertyValueWhenColumnIsMissing?: any;
	propertyValueWhenCellIsEmpty?: any;
	transformEmptyArray?(arrayPropertyValue: never[], parameters: { path: string }): any;
	transformEmptyObject?(object: Record<string, undefined | null>, parameters: { path?: string }): any;
	// shouldSkipRequiredValidationWhenColumnIsMissing?(columnTitle: string, parameters: { object: Record<string, any> }): boolean;
	arrayValueSeparator?: string;
}