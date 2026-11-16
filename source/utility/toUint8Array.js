/**
 * Creates a byte view without copying the underlying memory.
 * @param {(ArrayBuffer|ArrayBufferView)} input
 * @return {Uint8Array}
 */
export default function toUint8Array(input) {
	if (ArrayBuffer.isView(input)) {
		return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
	}
	return new Uint8Array(input)
}
