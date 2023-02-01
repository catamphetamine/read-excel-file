import InvalidError from './InvalidError.js'

export default function BooleanType(value) {
	if (typeof value === 'boolean') {
    return value
  }
  throw new InvalidError('not_a_boolean')
}