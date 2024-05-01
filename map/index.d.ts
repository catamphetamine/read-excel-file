import {
	Row,
	Schema,
	MappingParameters
} from '../types.d.js';

export {
	MappingParameters
} from '../types.d.js'

export default function map(data: Row[], schema: Schema, options?: MappingParameters): object[];