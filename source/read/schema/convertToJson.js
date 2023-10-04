import NumberType from '../../types/Number.js'
import StringType from '../../types/String.js'
import BooleanType from '../../types/Boolean.js'
import DateType from '../../types/Date.js'

const DEFAULT_OPTIONS = {
  isColumnOriented: false
}

/**
 * Convert 2D array to nested objects.
 * If row oriented data, row 0 is dotted key names.
 * Column oriented data is transposed.
 * @param {any[][]} data - An array of rows, each row being an array of cells.
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

  const {
    isColumnOriented,
    rowMap,
    ignoreEmptyRows
  } = options

  validateSchema(schema)

  if (isColumnOriented) {
    data = transpose(data)
  }

  const columns = data[0]

  const results = []
  const errors = []

  for (let i = 1; i < data.length; i++) {
    const result = read(schema, data[i], i, columns, errors, options)
    if (result !== null || ignoreEmptyRows === false) {
      results.push(result)
    }
  }

  // Correct error rows.
  if (rowMap) {
    for (const error of errors) {
      // Convert the `row` index in `data` to the
      // actual `row` index in the spreadsheet.
      // `- 1` converts row number to row index.
      // `+ 1` converts row index to row number.
      error.row = rowMap[error.row - 1] + 1
    }
  }

  return {
    rows: results,
    errors
  }
}

function read(schema, row, rowIndex, columns, errors, options) {
  const object = {}
  let isEmptyObject = true

  const createError = ({
    column,
    value,
    error: errorMessage,
    reason
  }) => {
    const error = {
      error: errorMessage,
      row: rowIndex + 1,
      column,
      value
    }
    if (reason) {
      error.reason = reason
    }
    if (schema[column].type) {
      error.type = schema[column].type
    }
    return error
  }

  const pendingRequiredChecks = []

  for (const key of Object.keys(schema)) {
    const schemaEntry = schema[key]
    const isNestedSchema = typeof schemaEntry.type === 'object' && !Array.isArray(schemaEntry.type)

    let rawValue = row[columns.indexOf(key)]
    if (rawValue === undefined) {
      rawValue = null
    }

    let value
    let error
    let reason

    if (isNestedSchema) {
      value = read(schemaEntry.type, row, rowIndex, columns, errors, options)
    } else {
      if (rawValue === null) {
        value = null
      }
      else if (Array.isArray(schemaEntry.type)) {
        let notEmpty = false
        const array = parseArray(rawValue).map((_value) => {
          const result = parseValue(_value, schemaEntry, options)
          if (result.error) {
            value = _value
            error = result.error
            reason = result.reason
          }
          if (result.value !== null) {
            notEmpty = true
          }
          return result.value
        })
        if (!error) {
          value = notEmpty ? array : null
        }
      } else {
        const result = parseValue(rawValue, schemaEntry, options)
        error = result.error
        reason = result.reason
        value = error ? rawValue : result.value
      }
    }

    if (!error && value === null) {
      if (typeof schemaEntry.required === 'function') {
        pendingRequiredChecks.push({ column: key })
      } else if (schemaEntry.required === true) {
        error = 'required'
      }
    }

    if (error) {
      errors.push(createError({
        column: key,
        value,
        error,
        reason
      }))
    } else {
      if (isEmptyObject && value !== null) {
        isEmptyObject = false
      }
      if (value !== null || options.includeNullValues) {
        object[schemaEntry.prop] = value
      }
    }
  }

  if (isEmptyObject) {
    return null
  }

  for (const { column } of pendingRequiredChecks) {
    const required = schema[column].required(object)
    if (required) {
      errors.push(createError({
        column,
        value: null,
        error: 'required'
      }))
    }
  }

  return object
}

/**
 * Converts textual value to a javascript typed value.
 * @param  {any} value
 * @param  {object} schemaEntry
 * @return {{ value: any, error: string }}
 */
export function parseValue(value, schemaEntry, options) {
  if (value === null) {
    return { value: null }
  }
  let result
  if (schemaEntry.parse) {
    result = parseCustomValue(value, schemaEntry.parse)
  } else if (schemaEntry.type) {
    result = parseValueOfType(
      value,
      // Supports parsing array types.
      // See `parseArray()` function for more details.
      // Example `type`: String[]
      // Input: 'Barack Obama, "String, with, colons", Donald Trump'
      // Output: ['Barack Obama', 'String, with, colons', 'Donald Trump']
      Array.isArray(schemaEntry.type) ? schemaEntry.type[0] : schemaEntry.type,
      options
    )
  } else {
    result = { value: value }
    // throw new Error('Invalid schema entry: no .type and no .parse():\n\n' + JSON.stringify(schemaEntry, null, 2))
  }
  // If errored then return the error.
  if (result.error) {
    return result
  }
  if (result.value !== null) {
    if (schemaEntry.oneOf && schemaEntry.oneOf.indexOf(result.value) < 0) {
      return { error: 'invalid', reason: 'unknown' }
    }
    if (schemaEntry.validate) {
      try {
        schemaEntry.validate(result.value)
      } catch (error) {
        return { error: error.message }
      }
    }
  }
  return result
}

/**
 * Converts textual value to a custom value using supplied `.parse()`.
 * @param  {any} value
 * @param  {function} parse
 * @return {{ value: any, error: string }}
 */
function parseCustomValue(value, parse) {
  try {
    value = parse(value)
    if (value === undefined) {
      return { value: null }
    }
    return { value }
  } catch (error) {
    const result = { error: error.message }
    if (error.reason) {
      result.reason = error.reason;
    }
    return result
  }
}

/**
 * Converts textual value to a javascript typed value.
 * @param  {any} value
 * @param  {} type
 * @return {{ value: (string|number|Date|boolean), error: string, reason?: string }}
 */
function parseValueOfType(value, type, options) {
  switch (type) {
    case String:
      return parseCustomValue(value, StringType)

    case Number:
      return parseCustomValue(value, NumberType)

    case Date:
      return parseCustomValue(value, (value) => DateType(value, { properties: options.properties }))

    case Boolean:
      return parseCustomValue(value, BooleanType)

    default:
      if (typeof type === 'function') {
        return parseCustomValue(value, type)
      }
      throw new Error(`Unsupported schema type: ${type && type.name || type}`)
  }
}

export function getBlock(string, endCharacter, startIndex) {
  let i = 0
  let substring = ''
  let character
  while (startIndex + i < string.length) {
    const character = string[startIndex + i]
    if (character === endCharacter) {
      return [substring, i]
    }
    else if (character === '"') {
      const block = getBlock(string, '"', startIndex + i + 1)
      substring += block[0]
      i += '"'.length + block[1] + '"'.length
    }
    else {
      substring += character
      i++
    }
  }
  return [substring, i]
}

/**
 * Parses a string of comma-separated substrings into an array of substrings.
 * (the `export` is just for tests)
 * @param  {string} string — A string of comma-separated substrings.
 * @return {string[]} An array of substrings.
 */
export function parseArray(string) {
  const blocks = []
  let index = 0
  while (index < string.length) {
    const [substring, length] = getBlock(string, ',', index)
    index += length + ','.length
    blocks.push(substring.trim())
  }
  return blocks
}

// Transpose a 2D array.
// https://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
const transpose = array => array[0].map((_, i) => array.map(row => row[i]))

function validateSchema(schema) {
  for (const key of Object.keys(schema)) {
    const entry = schema[key]
    if (!entry.prop) {
      throw new Error(`"prop" not defined for schema entry "${key}".`)
    }
  }
}