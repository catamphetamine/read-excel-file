import parseXmlStream from './parseXmlStream.js'

import InvalidSpreadsheetError from '../xlsx/InvalidSpreadsheetError.js'

/**
 * Parses XML markup by calling the supplied callback functions.
 * @param {string} xml
 * @param {any} state — The initial `state`. This `state` will supposedly be modified by the callback functions as the XML is being parsed.
 * @param {function} [onOpenTag]
 * @param {function} [onCloseTag]
 * @param {function} [onText]
 * @param {function} [onProgress] — If defined, will be called every time it finishes parsing yet another chunk of XML.
 * @returns {Promise<void>} Returns a `Promise` that resolves to nothing. Inspect the passed `state` argument for changes.
 */
export default function parseXml(xml, state, onOpenTag, onCloseTag, onText, onProgress) {
	const parser = parseXmlStream(state, onOpenTag, onCloseTag, onText)

	if (onProgress) {
		parseXmlInChunks(parser, xml, onProgress)
	} else {
		// Parse XML "all at once"
		parser.write(xml)
		parser.end()
	}

	return parser.promise.then(
		result => result,
		(error) => {
			// If the error is not re-thrown here, the parser will simply keep parsing,
			// i.e. it doesn't halt after encountering an error and doesn't require manual resuming.
			// So it must re-throw the error here in order for the parser to stop.
			// Because the error is thrown inside a `new Promise()` constructor,
			// the promise will reject automatically.
			const spreadsheetError = new InvalidSpreadsheetError(error.message)
			spreadsheetError.stack = error.stack
			spreadsheetError.cause = error
			throw spreadsheetError
		}
	)

	// This function is placed here inside the wrapper function body
	// in order to not to hav `worker-f`
	/**
	 * Parses XML in chunks.
	 * @param {object} parser — An object returned from `parseXmlStream()` function.
	 * @param {string} xml
	 * @param {function} [onProgress] — Will be called after yet another chunk of XML has been parsed.
	 * @param {boolean} [nonBlocking] — If `true` is passed then it won't block the current thread while parsing. Otherwise, it will block the current thread until all the XML is parsed.
	 */
	function parseXmlInChunks(parser, xml, onProgress, nonBlocking) {
		const MAX_CHUNK_PROCESSING_TIME = 7 // 16 ms — 60 fps, 7 ms — 144 fps
		const INITIAL_CHUNK_SIZE = 64 * 1024 // 64 KB
		// Without a lower bound, consistently slow chunks (e.g. on a busy server CPU)
		// would keep halving the chunk size until it's less than one character,
		// at which point `xml.slice(0, chunkSize)` returns an empty string and parsing makes no progress.
		const MIN_CHUNK_SIZE = 16 * 1024 // 16 KB

		let chunksCount = 0
		let chunkSize = INITIAL_CHUNK_SIZE

		/**
		 * Parses next chunk of XML.
		 * @returns {boolean} Returns `true` if there're more chunks to write.
		 */
		const parseNextChunk = () => {
			chunksCount++
			const startedAt = Date.now()
			if (xml.length > chunkSize) {
				parser.write(xml.slice(0, chunkSize))
				if (onProgress) {
					onProgress(false)
				}
				xml = xml.slice(chunkSize)
				const chunkProcessingTime = Date.now() - startedAt
				if (chunkProcessingTime < MAX_CHUNK_PROCESSING_TIME * 0.5) {
					chunkSize *= 2
				} else if (chunkProcessingTime > MAX_CHUNK_PROCESSING_TIME) {
					chunkSize = Math.max(MIN_CHUNK_SIZE, chunkSize / 2)
				}
				return true
			} else {
				parser.write(xml)
				parser.end()
				if (onProgress) {
					onProgress(true)
				}
				return false
			}
		}

		/**
		 * Parses next chunk of XML and then repeats.
		 * In blocking mode, it iterates rather than calls itself recursively
		 * because a recursive call per chunk would exceed the maximum call stack size
		 * when a large XML file is split into many chunks.
		 */
		const loop = () => {
			while (parseNextChunk()) {
				if (nonBlocking) {
					if (typeof setImmediate !== 'undefined') {
						setImmediate(loop)
					} else {
						setTimeout(loop, 0)
					}
					return
				}
			}
			// Finished
			// console.log('* chunk size', chunkSize)
			// console.log('* chunks count', chunksCount)
		}

		loop()
	}
}