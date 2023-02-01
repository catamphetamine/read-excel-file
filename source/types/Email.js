import InvalidError from './InvalidError.js'

export default function Email(value) {
  if (typeof value === 'string') {
    if (isEmail(value)) {
      return value
    }
    throw new InvalidError('not_an_email')
  }
  throw new InvalidError('not_a_string')
}

const regexp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

export function isEmail(value) {
	return regexp.test(value)
}