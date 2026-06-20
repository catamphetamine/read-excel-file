import { strFromU8 } from 'fflate'

import checkpoint from '../utility/checkpoint.js'

/**
 * @param {Record<string,Uint8Array} entries
 * @returns {Record<string,string>}
 */
export default function convertValuesFromUint8ArraysToStrings(entries) {
	checkpoint('convert files to strings')
	const convertedEntries = {}
	for (const key of Object.keys(entries)) {
		convertedEntries[key] = strFromU8(entries[key])
	}
	return convertedEntries
}