import InvalidError from './InvalidError.js'

export default function NumberType(value) {
  // An XLSX file editing software might not always correctly
  // detect numeric values in string-type cells. Users won't bother
  // manually selecting a cell type, so the editing software has to guess
  // based on the user's input. One can assume that such auto-detection
  // might not always work.
  //
  // So, if a cell is supposed to be a numeric one, convert a string value to a number.
  //
  if (typeof value === 'string') {
    const stringifiedValue = value
    value = Number(value)
    if (String(value) !== stringifiedValue) {
      throw new InvalidError('not_a_number')
    }
  }
  if (typeof value !== 'number') {
    throw new InvalidError('not_a_number')
  }
  if (isNaN(value)) {
    throw new InvalidError('invalid_number')
  }
  // At this point, `value` can only be a number.
  //
  // The global `isFinite()` function filters out:
  // * NaN
  // * -Infinity
  // * Infinity
  //
  // All other values pass (including non-numbers).
  //
  if (!isFinite(value)) {
    throw new InvalidError('out_of_bounds')
  }
  return value
}