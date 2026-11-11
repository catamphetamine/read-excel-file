// A `.zip` archive declares both the compressed size and the uncompressed size
// of each file in it. Those numbers are written by whoever created the archive,
// so they can't be trusted: a tiny malformed archive could declare that one of
// its files is gigabytes in size when uncompressed.
//
// `fflate`'s `unzip()` and `unzipSync()` functions allocate the output buffer
// for a file from the declared uncompressed size without checking it.
// https://github.com/101arrowz/fflate/issues/311
//
// This function tells if the declared sizes of a file could possibly be true.

// `DEFLATE` can't compress data more than about 1032 times:
// the shortest "symbol" is 2 bits long and it could produce 258 bytes at most.
const MAX_DEFLATE_COMPRESSION_RATIO = 1032

// "Stored" means "not compressed".
const COMPRESSION_METHOD_STORED = 0

/**
 * Tells if the declared sizes of a file in a `.zip` archive could possibly be true.
 * @param  {number} options.compressedSize — The declared compressed size of the file, in bytes.
 * @param  {number} options.uncompressedSize — The declared uncompressed size of the file, in bytes.
 * @param  {number} options.compressionMethod — `0` means "stored" (not compressed), `8` means `DEFLATE`.
 * @param  {number} options.availableSize — The amount of bytes in the archive that could be occupied by the compressed data of this file.
 * @return {boolean}
 */
export default function isPossibleFileSize({
	compressedSize,
	uncompressedSize,
	compressionMethod,
	availableSize
}) {
	// The compressed data of the file must fit inside the archive.
	if (compressedSize > availableSize) {
		return false
	}
	// A file that is not compressed can't be larger than its data.
	if (compressionMethod === COMPRESSION_METHOD_STORED) {
		return uncompressedSize <= compressedSize
	}
	// A compressed file can't be larger than what its data could be decompressed into.
	return uncompressedSize <= compressedSize * MAX_DEFLATE_COMPRESSION_RATIO
}
