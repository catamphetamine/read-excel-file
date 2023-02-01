import InvalidError from './InvalidError.js'
import NumberType from './Number.js'

export default function Integer(value) {
	value = NumberType(value)
  if (!isInteger(value)) {
    throw new InvalidError('not_an_integer')
  }
  return value
}

export function isInteger(x) {
	// https://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
	return (x | 0) === x
}