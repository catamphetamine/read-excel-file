import {
	ParseWithSchemaOptions,
	ParseWithMapOptions,
	ParseWithoutSchemaOptions,
	ParsedObjectsResult,
	Row
} from './types.d';

export function parseExcelDate(excelSerialDate: number) : typeof Date;

type Input = File;

export function readXlsxFile<T extends object>(input: Input, options: ParseWithSchemaOptions<T>) : Promise<ParsedObjectsResult<T>>;
export function readXlsxFile<T extends object>(input: Input, options: ParseWithMapOptions) : Promise<ParsedObjectsResult<T>>;
export function readXlsxFile(input: Input, options?: ParseWithoutSchemaOptions) : Promise<Row[]>;

export default readXlsxFile;