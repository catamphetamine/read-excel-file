import readXlsx from './readXlsx'
import convertToJson from './convertToJson'

export default function readXlsxFileContents(entries, xml, options) {
	const result = readXlsx(entries, xml, options)
	if (options.schema) {
		return convertToJson(result.data, options.schema, { ...options, properties: result.properties })
	}
	return result
}