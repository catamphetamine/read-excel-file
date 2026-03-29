import { ParseDataPossibleError } from './parseDataError.d.js'
import { ParseDataValueCustomType } from './parseDataValueType.d.js'

export type ParseDataResult<
	Object,
	ParseDataValueCustomType_ extends ParseDataValueCustomType<unknown> = never
> = ParseDataResultItem<
	Object,
	ParseDataValueCustomType_
>[]

type ParseDataResultItem<
	Object,
	ParseDataValueCustomType_ extends ParseDataValueCustomType<unknown> = never
> =
	| ParseDataResultItemSuccess<Object>
	| ParseDataResultItemError<ParseDataValueCustomType_>

interface ParseDataResultItemSuccess<Object> {
	object: Object;
	errors: undefined;
}

interface ParseDataResultItemError<
	ParseDataValueCustomType_ extends ParseDataValueCustomType<unknown> = never
> {
	object: undefined;
	errors: ParseDataPossibleError<ParseDataValueCustomType_>[];
}

export interface ParseDataOptions {
	propertyValueWhenColumnIsMissing?: any;
	propertyValueWhenCellIsEmpty?: any;
	transformEmptyArray?(arrayPropertyValue: never[], parameters: { path: string }): any;
	transformEmptyObject?(object: Record<string, undefined | null>, parameters: { path?: string }): any;
	// shouldSkipRequiredValidationWhenColumnIsMissing?(columnTitle: string, parameters: { object: Record<string, any> }): boolean;
	arrayValueSeparator?: string;
}