import parseDate from './parseDate'

// Create a list of json objects; 1 object per excel sheet row
//
// Assume: Excel spreadsheet is a rectangle of data, where the first row is
// object keys and remaining rows are object values and the desired json
// is a list of objects. Alternatively, data may be column oriented with
// col 0 containing key names.
//
// Dotted notation: Key row (0) containing firstName, lastName, address.street,
// address.city, address.state, address.zip would produce, per row, a doc with
// first and last names and an embedded doc named address, with the address.
//
// Arrays: may be indexed (phones[0].number) or flat (aliases[]). Indexed
// arrays imply a list of objects. Flat arrays imply a semicolon delimited list.

/**
 * Classifies a key.
 * If the key ends with a number in square brackets then it's an array element.
 * If the key ends with a "[]" then it's an array.
 * Otherwise it's a generic property.
 * @param  {string} key
 * @return An array of shape `[isArrayOrArrayElement, property, arrayElementIndex]`.
 */
function parseKey(key) {
  // If the key ends with a number in square brackets
  // then it's an array element.
  // `phones[2]` -> [true, 'phones', 2].
  const index = key.match(/\[(\d+)\]$/)
  if (index) {
    return [true, key.split('[')[0], Number(index[1])]
  }
  // If the key ends with a "[]"
  // then it's an array.
  // `phones[]` -> [true, 'phones', undefined].
  if (key.slice(-2) === '[]') {
    return [true, key.slice(0, -2), undefined]
  }
  // It's a generic property.
  // `phone` -> [false, 'phone', undefined].
  return [false, key, undefined]
}

/**
 * Converts textual value to a javascript typed value.
 * @param  {string} value
 * @param  {object} schemaEntry
 * @return {[value: (string|number|boolean), error: string]}
 */
function convertValue(value, schemaEntry) {
  if (value === null) {
    if (schemaEntry.required) {
      return [null, 'required']
    }
    return [null]
  }
  switch (schemaEntry.type) {
    case String:
      return value
    case Number:
      // The global isFinite() function determines
      // whether the passed value is a finite number.
      // If  needed, the parameter is first converted to a number.
      if (isFinite(value)) {
        return [parseInt(value)]
      }
      return [null, 'invalid']
    case Date:
      const date = parseDate(value, schemaEntry.template)
      if (!date) {
        return [null, 'invalid']
      }
      return [date]
    case Boolean:
      if (value.toLowerCase() === 'true') {
        return [true]
      }
      if (value.toLowerCase() === 'false') {
        return [false]
      }
      return [null, 'invalid']
    default:
      try {
        return [schemaEntry.parse(value)]
      } catch (error) {
        return [null, error.message]
      }
  }
}

// Assign a value to a dotted property key - set values on sub-objects
function set(obj, path, value, options, schemaEntry) {
  // On first call, a `path` is a string.
  // Recursed calls, a `path` is an array.
  if (typeof path === 'string') {
    path = path.split('.')
  }

  // Array element accessors look like phones[0].type or aliases[]
  const [isArrayOrArrayElement, property, arrayElementIndex] = parseKey(path.shift())

  // If this is an array or object.
  // (has some child keys let to set)
  if (path.length > 0) {
    if (isArrayOrArrayElement) {
      if (!obj[property]) {
        obj[property] = []
      }
      let i = obj[property].length - (arrayElementIndex + 1)
      while (i > 0) {
        obj[property].push({})
        i--
      }
      return set(obj[property][arrayElementIndex], path, value, options)
    } else {
      if (!obj[property]) {
        obj[property] = {}
      }
      return set(obj[property], path, value, options)
    }
  }

  if (isArrayOrArrayElement && arrayElementIndex) {
    console.error(`WARNING: Unexpected key path terminal containing an indexed list for <${property}>`)
    console.error("WARNING: Indexed arrays indicate a list of objects and should not be the last element in a key path")
    console.error("WARNING: The last element of a key path should be a key name or flat array. E.g. alias, aliases[]")
  }

  let error
  if (isArrayOrArrayElement && !arrayElementIndex) {
    value = value.split(';').map((value) => {
      const result = convertValue(value, schemaEntry)
      if (result[1]) {
        error = result[1]
      }
      return result[0]
    })
  } else {
    const result = convertValue(value, schemaEntry)
    value = result[0]
    error = result[1]
  }
  obj[property] = value
  return error
}

// Transpose a 2D array.
// https://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
const transpose = array => array[0].map((_, i) => array.map(row => row[i]));

const DEFAULT_OPTIONS = {
  isColumnOriented: false
}

/**
 * Convert 2D array to nested objects.
 * If row oriented data, row 0 is dotted key names.
 * Column oriented data is transposed.
 * @param {string[][]} data - An array of rows, each row being an array of cells.
 * @param {object} schema
 * @return {object[]}
 */
export default function(data, schema, options) {
  if (options) {
    options = {
      ...DEFAULT_OPTIONS,
      ...options
    }
  } else {
    options = DEFAULT_OPTIONS
  }

  if (options.isColumnOriented) {
    data = transpose(data)
  }

  const keys = data[0]
  const rows = data.slice(1)

  const result = []
  const errors = []
  for (const row of rows) {
    const item = {}
    for (let i = 0; i < row.length; i++) {
      const error = set(
        item,
        schema[keys[i]].prop || keys[i],
        row[i],
        options,
        schema[keys[i]]
      )
      if (error) {
        errors.push({
          error,
          column: keys[i],
          value: row[i]
        })
      }
    }
    result.push(item)
  }
  return {
    rows: result,
    errors
  }
}