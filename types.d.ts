export function Integer(): void;
export function URL(): void;
export function Email(): void;

export type CellValue = string | number | boolean | typeof Date
export type Row = CellValue[]

type BasicType =
	| string
	| number
	| boolean
	| typeof Date
	| typeof Integer
	| typeof URL
	| typeof Email;

// A cell "type" is a function that receives a "raw" value and returns a "parsed" value or `undefined`.
export type Type<ParsedValue> = (value: CellValue) => ParsedValue | undefined;

type SchemaEntryRequiredProperty<Object> = boolean | ((row: Object) => boolean);

interface SchemaEntryForValue<Key extends keyof Object, Object, TopLevelObject> {
	prop: Key;
	type?: BasicType | Type<Object[Key]>;
	oneOf?: Object[Key][];
	required?: SchemaEntryRequiredProperty<TopLevelObject>;
	validate?(value: Object[Key]): void;
}

// Legacy versions of this library supported supplying a custom `parse()` function.
// Since then, the `parse()` function has been renamed to `type()` function.
interface SchemaEntryForValueLegacy<Key extends keyof Object, Object, TopLevelObject> {
	prop: Key;
	parse: (value: CellValue) => Object[Key] | undefined;
	oneOf?: Object[Key][];
	required?: SchemaEntryRequiredProperty<TopLevelObject>;
	validate?(value: Object[Key]): void;
}

// Implementing recursive types in TypeScript:
// https://dev.to/busypeoples/notes-on-typescript-recursive-types-and-immutability-5ck1
interface SchemaEntryRecursive<Key extends keyof Object, Object, TopLevelObject, ColumnTitle extends string> {
	prop: Key;
	type: Record<ColumnTitle, SchemaEntry<keyof Object[Key], Object[Key], TopLevelObject, ColumnTitle>>;
	required?: SchemaEntryRequiredProperty<TopLevelObject>;
}

type SchemaEntry<Key extends keyof Object, Object, TopLevelObject, ColumnTitle extends string> =
	SchemaEntryForValue<Key, Object, TopLevelObject> |
	SchemaEntryForValueLegacy<Key, Object, TopLevelObject> |
	SchemaEntryRecursive<Key, Object, TopLevelObject, ColumnTitle>

export type Schema<Object = Record<string, any>, ColumnTitle extends string = string> = Record<ColumnTitle, SchemaEntry<keyof Object, Object, Object, ColumnTitle>>

export interface Error<CellValue_ = CellValue, ParsedValue = any> {
	error: string;
	reason?: string;
	row: number;
	column: string;
	value?: CellValue_;
	type?: Type<ParsedValue>;
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
	ignoreEmptyRows?: boolean;
	// `includeNullValues: true` parameter is deprecated.
	// It could be replaced with the following combination of parameters:
	// * `schemaPropertyValueForMissingColumn: null`
	// * `schemaPropertyValueForEmptyCell: null`
	// * `getEmptyObjectValue = () => null`
	includeNullValues?: boolean;
}

type MapProperty = string;
type MapObject = {
  [key: string]: MapProperty | MapObject;
};
type Map = MapObject;

export interface ParseWithMapOptions extends ParseCommonOptions {
	map: Map;
	transformData?: (rows: Row[]) => Row[];
	dateFormat?: string;
}

export interface ParseWithoutSchemaOptions extends ParseCommonOptions {
	dateFormat?: string;
}

interface MappingParametersCommon {
	schemaPropertyValueForMissingColumn?: any;
	schemaPropertyShouldSkipRequiredValidationForMissingColumn?(column: string, parameters: { object: Record<string, any> }): boolean;
	getEmptyObjectValue?(object: Record<string, any>, parameters: { path?: string }): any;
	getEmptyArrayValue?(array: any[], parameters: { path: string }): any;
}

interface MappingParametersReadExcelFile extends MappingParametersCommon {
	schemaPropertyValueForEmptyCell?: null | undefined;
}

export interface MappingParameters extends MappingParametersCommon {
	schemaPropertyValueForUndefinedCellValue?: any;
	schemaPropertyValueForNullCellValue?: any;
	isColumnOriented?: boolean;
	rowIndexMap?: Record<string, number>;
}