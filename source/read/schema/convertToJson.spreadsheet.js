// Renames some of the `react-excel-file` options to `convertToJson()` options.
export default function convertToJsonSpreadsheetBehavior(convertToJson, data, schema, options = {}) {
	const {
		schemaPropertyValueForEmptyCell,
		...restOptions
	} = options
	return convertToJson(data, schema, {
		...restOptions,
		schemaPropertyValueForNullCellValue: schemaPropertyValueForEmptyCell
	})
}