import InvalidError from './InvalidError.js'

export default function StringType(value) {
  if (typeof value === 'string') {
    return value
  }
  // Excel tends to perform a forced automatic convertion of string-type values
  // to number-type ones when the user has input them. Otherwise, users wouldn't
  // be able to perform formula calculations on those cell values because users
  // won't bother manually choosing a "numeric" cell type for each cell, and
  // even if they did, choosing a "numeric" cell type every time wouldn't be an
  // acceptable "user experience".
  //
  // So, if a cell value is supposed to be a string and Excel has automatically
  // converted it to a number, perform a backwards conversion.
  //
  if (typeof value === 'number') {
    if (isNaN(value)) {
      throw new InvalidError('invalid_number')
    }
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
    return String(value)
  }
  throw new InvalidError('not_a_string')
}