export function Integer(): void;
export function URL(): void;
export function Email(): void;

type BasicType =
	| string
	| number
	| boolean
	| typeof Date
	| Integer
	| URL
	| Email;

export type Type = <T>(value: Cell) => T?;

interface SchemaEntryBasic<T> {
	prop: string;
	type?: BasicType | Type;
	oneOf?: T[];
	required?: boolean;
	validate?(value: T): void;
}

interface SchemaEntryParsed<T> {
	prop: string;
	parse: (value: Cell) => T?;
	oneOf?: T[];
	required?: boolean;
	validate?(value: T): void;
}

// Implementing recursive types in TypeScript:
// https://dev.to/busypeoples/notes-on-typescript-recursive-types-and-immutability-5ck1
interface SchemaEntryRecursive {
	prop: string;
	type: Record<string, SchemaEntry>;
	required?: boolean;
}

type SchemaEntry = SchemaEntryBasic<any> | SchemaEntryParsed<any> | SchemaEntryRecursive

export type Schema = Record<string, SchemaEntry>

export interface Error {
	error: string;
	row: number;
	column: number;
	value?: any;
	type?: SchemaEntry;
};

type Cell = string | number | boolean | typeof Date
export type Row = Cell[]

export interface ParsedObjectsResult {
	rows: object[];
	errors: Error[];
}

export interface ParseWithSchemaOptions {
	schema: Schema;
	transformData?: (rows: Row[]) => Row[];
	sheet?: number | string;
}

export interface ParseWithMapOptions {
	map: object;
	transformData?: (rows: Row[]) => Row[];
	sheet?: number | string;
}

export interface ParseWithoutSchemaOptions {
	sheet?: number | string;
}