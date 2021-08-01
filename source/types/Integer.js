export default function Integer() {}

export function isInteger(x) {
	// https://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
	return (x | 0) === x
}