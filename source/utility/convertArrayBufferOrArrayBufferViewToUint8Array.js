// This code was originally submitted by Jakub Stasiak:
// https://github.com/catamphetamine/read-excel-file/pull/130

/**
 * Converts an `ArrayBuffer` or an `ArrayBufferView` view to a `Uint8Array`.
 * @param {(ArrayBuffer|ArrayBufferView)} input
 * @return {Uint8Array}
 */
export default function convertArrayBufferOrArrayBufferViewToUint8Array(input) {
	if (ArrayBuffer.isView(input)) {
		return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
	}
	return new Uint8Array(input)
}