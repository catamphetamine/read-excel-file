import {
	Row,
	Schema
} from '../types.d.js';

export default function mapWithLegacyBehavior(data: Row[], schema: Schema, options?: {
	ignoreEmptyRows?: boolean,
	includeNullValues?: boolean,
	isColumnOriented?: boolean,
	rowMap?: Record<string, number>
}): object[];