import {
	ParseWithSchemaOptions,
	ParseWithMapOptions,
	ParseWithoutSchemaOptions,
	ParsedObjectsResult,
	Row
} from './types.d.js';

export {
	Schema,
	ParsedObjectsResult,
	Error,
	CellValue,
	Row,
	Integer,
	Email,
	URL
} from './types.d.js';

export function parseExcelDate(excelSerialDate: number) : typeof Date;

type Input = File | Blob | ArrayBuffer;

export function readXlsxFile<T extends object>(input: Input, options: ParseWithSchemaOptions<T>) : Promise<ParsedObjectsResult<T>>;
export function readXlsxFile<T extends object>(input: Input, options: ParseWithMapOptions) : Promise<ParsedObjectsResult<T>>;
export function readXlsxFile(input: Input, options?: ParseWithoutSchemaOptions) : Promise<Row[]>;

export function readSheetNames(input: Input) : Promise<string[]>;

export default readXlsxFile;
