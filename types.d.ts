export type CellValue = string | number | boolean | typeof Date
export type Row = (CellValue | null)[]

// Schema entry `type` (foundational ones).
type BaseType =
	| string
	| number
	| boolean
	| typeof Date;

// Schema entry custom `type`.
// A function that receives a cell value and returns a "parsed" one.
// Returning `undefined` will have same effect as returning `null`.
export type Type<ParsedValue> = (value: CellValue) => ParsedValue | undefined | null;

export function Integer(value: CellValue): number;
export function URL(value: CellValue): string;
export function Email(value: CellValue): string;

// Schema entry `type` (additional ones).
type AdditionalType =
	| typeof Integer
	| typeof URL
	| typeof Email;

// Schema entry `type`: foundational ones, additional ones, custom ones.
type SchemaEntryType<ParsedValue> = BaseType | AdditionalType | Type<ParsedValue>;

type SchemaEntryRequired<Object> = boolean | ((row: Object) => boolean);

interface SchemaEntryForValue<Key extends keyof Object, Object, TopLevelObject, ColumnTitle extends string> {
	column: ColumnTitle;
	type?: SchemaEntryType<Object[Key]>;
	oneOf?: Object[Key][];
	required?: SchemaEntryRequired<TopLevelObject>;
	validate?(value: Object[Key]): void;
}

// Implementing recursive types in TypeScript:
// https://dev.to/busypeoples/notes-on-typescript-recursive-types-and-immutability-5ck1
interface SchemaEntryRecursive<Key extends keyof Object, Object, TopLevelObject, ColumnTitle extends string> {
	schema: Record<keyof Object[Key], SchemaEntry<keyof Object[Key], Object[Key], TopLevelObject, ColumnTitle>>;
	required?: SchemaEntryRequired<TopLevelObject>;
}

type SchemaEntry<Key extends keyof Object, Object, TopLevelObject, ColumnTitle extends string> =
	SchemaEntryForValue<Key, Object, TopLevelObject, ColumnTitle> |
	SchemaEntryRecursive<Key, Object, TopLevelObject, ColumnTitle>

export type Schema<Object = Record<string, any>, ColumnTitle extends string = string> = Record<keyof Object, SchemaEntry<keyof Object, Object, Object, ColumnTitle>>

interface SchemaParseCellValueErrorGeneralProperties<CustomType = never> {
	row: number;
	column: string;
	type?: BasicType | CustomType;
}

export interface SchemaParseCellValueError<ParsedValue = any> extends SchemaParseCellValueErrorGeneralProperties<ParsedValue> {
	error: string;
	reason?: string;
	value: CellValue;
}

export interface CellValueRequiredError<ParsedValue = any> extends SchemaParseCellValueErrorGeneralProperties<ParsedValue> {
	error: 'required';
	reason?: undefined;
	value: null;
}

export interface ParsedObjectsResult<Object> {
	rows: Object[];
	errors: Error[];
}

interface ParseCommonOptions {
	sheet?: number | string;
	trim?: boolean;
	parseNumber?: (string: string) => any;
}

export interface ParseWithSchemaOptions<Object> extends ParseCommonOptions, MappingParametersReadExcelFile {
	schema: Schema<Object>;
	transformData?: (rows: Row[]) => Row[];
	// ignoreEmptyRows?: boolean;
}

type MapProperty = string;
type MapObject = {
  [key: string]: MapProperty | MapObject;
};
type Map = MapObject;

export interface ParseWithoutSchemaOptions extends ParseCommonOptions {
	dateFormat?: string;
}

interface SpreadsheetProperties {
	epoch1904?: true;
	sheets: [{
		id: string,
		name: string,
		relationId: string
	}]
}

interface MappingParametersCommon {
	schemaPropertyValueForMissingColumn?: any;
	schemaPropertyValueForMissingValue?: any;
	schemaPropertyShouldSkipRequiredValidationForMissingColumn?(column: string, parameters: { object: Record<string, any> }): boolean;
	getEmptyObjectValue?(object: Record<string, any>, parameters: { path?: string }): any;
	getEmptyArrayValue?(array: any[], parameters: { path: string }): any;
}

interface MappingParametersReadExcelFile extends MappingParametersCommon {}

export interface MappingParameters extends MappingParametersCommon {
	isColumnOriented?: boolean;
	arrayValueSeparator?: string;
	rowIndexSourceMap?: Record<string, number>;
	properties?: SpreadsheetProperties;
}