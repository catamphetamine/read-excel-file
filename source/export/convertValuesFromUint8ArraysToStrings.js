import { strFromU8 } from 'fflate'

/**
 * @param {Record<string,Uint8Array} entries
 * @returns {Record<string,string>}
 */
export default function convertValuesFromUint8ArraysToStrings(entries) {
	const convertedEntries = {}
	for (const key of Object.keys(entries)) {
		convertedEntries[key] = strFromU8(entries[key])
	}
	return convertedEntries
}