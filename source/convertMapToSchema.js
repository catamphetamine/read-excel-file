export default function convertMapToSchema(map) {
	const schema = {}
	for (const key of Object.keys(map)) {
		let prop = map[key]
		let type
		if (typeof prop === 'object') {
			prop = Object.keys(map[key])[0]
			type = convertMapToSchema(map[key][prop])
		}
		schema[key] = {
			prop
		}
		if (type) {
			schema[key].type = type
		}
	}
	return schema
}