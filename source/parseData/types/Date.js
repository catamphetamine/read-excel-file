import InvalidError from '../InvalidError.js'

export default function DateType(value) {
	// XLSX has no specific format for dates.
  // Sometimes a date can be heuristically detected.
  // https://github.com/catamphetamine/read-excel-file/issues/3#issuecomment-395770777
  if (value instanceof Date) {
    if (isNaN(value.valueOf())) {
      throw new InvalidError('out_of_bounds')
    }
    return value
  }
  throw new InvalidError('not_a_date')
}