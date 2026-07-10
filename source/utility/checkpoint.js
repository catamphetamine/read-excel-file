// This code is used to profile reading `.xlsx` files.
// It shows how much time each stage executes for.
// To enable the logs with the timing, set a global variable
// called `READ_EXCEL_FILE_CHECKPOINTS` in Node.js or web browser.

// This global variable is only exported to be added in the dependencies of a worker function.
// See `worker-f` package for more info.
export let latestCheckpointTimestamp

export default function checkpoint(name) {
	const now = Date.now()

	// See if the global flag for "should output log" is set to `true`.
	const shouldOutputLog = typeof global !== 'undefined'
		? Boolean(global.READ_EXCEL_FILE_CHECKPOINTS)
		: (
			typeof window !== 'undefined'
				? Boolean(window.READ_EXCEL_FILE_CHECKPOINTS)
				: false
		)

	if (shouldOutputLog) {
		if (latestCheckpointTimestamp) {
			console.log('  -', now - latestCheckpointTimestamp, 'ms')
		}
		console.log('*', name)
	}

	latestCheckpointTimestamp = now
}

export function resetCheckpoint() {
	latestCheckpointTimestamp = undefined
}