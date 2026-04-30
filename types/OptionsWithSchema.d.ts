import type { Options } from './Options.d.js'
import type { Schema } from './parseSheetData/parseSheetDataSchema.d.js'

export interface OptionsWithSchema<
	Object extends object,
	ColumnTitle extends string = string,
	ParsedNumber = number
> extends Options<ParsedNumber> {
	schema: Schema<Object, ColumnTitle>;
}