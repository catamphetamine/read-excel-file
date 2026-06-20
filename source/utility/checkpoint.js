// This code is used to profile reading `.xlsx` files.
// It shows how much time each stage executes for.
// To enable the logs with the timing, set a global variable
// called `READ_EXCEL_FILE_CHECKPOINTS` in Node.js or web browser.

let latestTimestamp

export default function checkpoint(name) {
	const now = Date.now()
	if (shouldOutputLog()) {
		if (latestTimestamp) {
			console.log('  -', now - latestTimestamp, 'ms')
		}
		console.log('*', name)
	}
	latestTimestamp = now
}

export function resetCheckpoint() {
	latestTimestamp = undefined
}

function shouldOutputLog() {
	if (typeof global !== 'undefined') {
		return Boolean(global.READ_EXCEL_FILE_CHECKPOINTS)
	} else if (typeof window !== 'undefined') {
		return Boolean(window.READ_EXCEL_FILE_CHECKPOINTS)
	}
}