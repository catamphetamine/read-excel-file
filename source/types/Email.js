export default function Email() {}

const regexp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

export function isEmail(value) {
	return regexp.test(value)
}