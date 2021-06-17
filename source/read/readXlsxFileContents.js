import readXlsx from './readXlsx'

import convertToJson from './schema/convertToJson'
import convertMapToSchema from './schema/convertMapToSchema'

export default function readXlsxFileContents(entries, xml, { schema, map, ...options}) {
	if (!schema && map) {
		schema = convertMapToSchema(map)
	}
	const result = readXlsx(entries, xml, { ...options, properties: schema || options.properties })
	if (schema) {
		return convertToJson(result.data, schema, { ...options, properties: result.properties })
	}
	return result
}