import {
	ParseWithSchemaOptions,
	ParseWithMapOptions,
	ParseWithoutSchemaOptions,
	ParsedObjectsResult,
	Row
} from './types.d';

export function parseExcelDate(excelSerialDate: number) : typeof Date;

type Input = File;

function readXlsxFile(input: Input, options: ParseWithSchemaOptions) : Promise<ParsedObjectsResult>;
function readXlsxFile(input: Input, options: ParseWithMapOptions) : Promise<ParsedObjectsResult>;
function readXlsxFile(input: Input, options?: ParseWithoutSchemaOptions) : Promise<Row[]>;

export default readXlsxFile;