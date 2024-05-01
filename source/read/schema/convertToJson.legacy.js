import convertToJson from './convertToJson.js'

export default function convertToJsonLegacyBehavior(data, schema, options = {}) {
	const {
		includeNullValues,
		ignoreEmptyRows,
		isColumnOriented,
		rowMap
	} = options
	const defaultConversionOptions = {
		schemaPropertyValueForMissingColumn: undefined,
		schemaPropertyValueForUndefinedCellValue: undefined,
		schemaPropertyValueForNullCellValue: undefined,
		schemaPropertyShouldSkipRequiredValidationForMissingColumn: (column, { path }) => false,
		getEmptyObjectValue: (object, { path }) => path ? undefined : null,
		getEmptyArrayValue: () => null,
		arrayValueSeparator: ','
	}
	if (includeNullValues) {
		defaultConversionOptions.schemaPropertyValueForMissingColumn = null
		defaultConversionOptions.schemaPropertyValueForUndefinedCellValue = null
		defaultConversionOptions.schemaPropertyValueForNullCellValue = null
		defaultConversionOptions.getEmptyObjectValue = (object, { path }) => null
	}
	const result = convertToJson(data, schema, {
		...defaultConversionOptions,
		rowIndexMap: rowMap,
		isColumnOriented
	})
	if (ignoreEmptyRows !== false) {
		result.rows = result.rows.filter(_ => _ !== defaultConversionOptions.getEmptyObjectValue(_, { path: undefined }))
	}
	return result
}