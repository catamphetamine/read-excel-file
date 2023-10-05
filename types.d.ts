export function Integer(): void;
export function URL(): void;
export function Email(): void;

type Cell = string | number | boolean | typeof Date
export type Row = Cell[]

type BasicType =
	| string
	| number
	| boolean
	| typeof Date
	| typeof Integer
	| typeof URL
	| typeof Email;

export type Type<T> = (value: Cell) => T | undefined;

type SchemaEntryRequired = boolean | ((row: Row) => boolean);

interface SchemaEntryBasic<T> {
	prop: string;
	type?: BasicType | Type<T>;
	oneOf?: T[];
	required?: SchemaEntryRequired;
	validate?(value: T): void;
}

// Legacy versions of this library supported supplying a custom `parse()` function.
// Since then, the `parse()` function has been renamed to `type()` function.
interface SchemaEntryParsed<T> {
	prop: string;
	parse: (value: Cell) => T | undefined;
	oneOf?: T[];
	required?: SchemaEntryRequired;
	validate?(value: T): void;
}

// Implementing recursive types in TypeScript:
// https://dev.to/busypeoples/notes-on-typescript-recursive-types-and-immutability-5ck1
interface SchemaEntryRecursive {
	prop: string;
	type: Record<string, SchemaEntry>;
	required?: SchemaEntryRequired;
}

type SchemaEntry = SchemaEntryBasic<any> | SchemaEntryParsed<any> | SchemaEntryRecursive

export type Schema = Record<string, SchemaEntry>

export interface Error {
	error: string;
	reason?: string;
	row: number;
	column: string;
	value?: any;
	type?: SchemaEntry;
}

export interface ParsedObjectsResult<T extends object> {
	rows: T[];
	errors: Error[];
}

interface ParseCommonOptions {
	sheet?: number | string;
	trim?: boolean;
	parseNumber?: (string: string) => any;
}

export interface ParseWithSchemaOptions<T extends object> extends ParseCommonOptions {
	schema: Schema;
	transformData?: (rows: Row[]) => Row[];
	includeNullValues?: boolean;
	ignoreEmptyRows?: boolean;
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