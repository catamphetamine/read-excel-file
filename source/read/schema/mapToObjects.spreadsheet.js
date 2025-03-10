// Renames some of the `react-excel-file` options to `mapToObjects()` options.
export default function mapToObjectsSpreadsheetBehavior(mapToObjects, data, schema, options = {}) {
	const {
		schemaPropertyValueForEmptyCell,
		...restOptions
	} = options
	return mapToObjects(data, schema, {
		...restOptions,
		schemaPropertyValueForNullCellValue: schemaPropertyValueForEmptyCell
	})
}