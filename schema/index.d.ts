import {
	Row,
	Schema
} from '../types.d.js';

export default function mapWithLegacyBehavior<T>(data: Row[], schema: Schema<T>, options?: {
	ignoreEmptyRows?: boolean,
	includeNullValues?: boolean,
	isColumnOriented?: boolean,
	rowMap?: Record<string, number>
}): T[];