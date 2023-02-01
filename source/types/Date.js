import parseDate from '../read/parseDate.js'
import InvalidError from './InvalidError.js'

export default function DateType(value, { properties }) {
	// XLSX has no specific format for dates.
  // Sometimes a date can be heuristically detected.
  // https://github.com/catamphetamine/read-excel-file/issues/3#issuecomment-395770777
  if (value instanceof Date) {
    if (isNaN(value.valueOf())) {
      throw new InvalidError('out_of_bounds')
    }
    return value
  }
  if (typeof value === 'number') {
    if (isNaN(value)) {
      throw new InvalidError('invalid_number')
    }
    if (!isFinite(value)) {
      throw new InvalidError('out_of_bounds')
    }
    const date = parseDate(value, properties)
    if (isNaN(date.valueOf())) {
      throw new InvalidError('out_of_bounds')
    }
    return date
  }
  throw new InvalidError('not_a_date')
}