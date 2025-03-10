import {
	Row,
	Schema,
	Error,
	MappingParameters
} from '../types.d.js';

export {
	MappingParameters
} from '../types.d.js'

export default function map<T>(data: Row[], schema: Schema<T>, options?: MappingParameters): {
	rows: T[];
	errors: Error[];
};