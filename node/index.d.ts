// See the discussion:
// https://github.com/catamphetamine/read-excel-file/issues/71

import { PathLike } from 'fs';
import { Stream } from 'stream';

import {
	ParseWithSchemaOptions,
	ParseWithMapOptions,
	ParseWithoutSchemaOptions,
	ParsedObjectsResult,
	Row
} from '../types.d';

export {
	ParsedObjectsResult,
	Row,
	Integer,
	Email,
	URL
} from '../types.d';

export function parseExcelDate(excelSerialDate: number) : typeof Date;

type Input = Stream | Buffer | PathLike;

export function readXlsxFile<T extends object>(input: Input, options: ParseWithSchemaOptions<T>) : Promise<ParsedObjectsResult<T>>;
export function readXlsxFile<T extends object>(input: Input, options: ParseWithMapOptions) : Promise<ParsedObjectsResult<T>>;
export function readXlsxFile(input: Input, options?: ParseWithoutSchemaOptions) : Promise<Row[]>;

export function readSheetNames(input: Input) : Promise<string[]>;

export default readXlsxFile;