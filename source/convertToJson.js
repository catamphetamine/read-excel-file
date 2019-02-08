import parseDate from './parseDate'
import Integer, { isInteger } from './types/Integer'
import URL, { isURL } from './types/URL'
import Email, { isEmail } from './types/Email'

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

  const {
    isColumnOriented,
    rowMap
  } = options

  validateSchema(schema)

  if (isColumnOriented) {
    data = transpose(data)
  }

  const columns = data[0]

  const results = []
  const errors = []

  for (let i = 1; i < data.length; i++) {
    const result = read(schema, data[i], i - 1, columns, errors, options)
    if (result) {
      results.push(result)
    }
  }

  // Correct error rows.
  if (rowMap) {
    for (const error of errors) {
      error.row = rowMap[error.row] + 1
    }
  }

  return {
    rows: results,
    errors
  }
}

function read(schema, row, rowIndex, columns, errors, options) {
  const object = {}
  for (const key of Object.keys(schema)) {
    const schemaEntry = schema[key]
    const isNestedSchema = typeof schemaEntry.type === 'object' && !Array.isArray(schemaEntry.type)
    let rawValue = row[columns.indexOf(key)]
    if (rawValue === undefined) {
      rawValue = null
    }
    let value
    let error
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
        value = error ? rawValue : result.value
      }
    }
    if (!error && value === null && schemaEntry.required) {
      error = 'required'
    }
    if (error) {
      error = {
        error,
        row: rowIndex + 1,
        column: key,
        value
      }
      if (schemaEntry.type) {
        error.type = schemaEntry.type
      }
      errors.push(error)
    } else if (value !== null) {
      object[schemaEntry.prop] = value
    }
  }
  if (Object.keys(object).length > 0) {
    return object
  }
  return null
}

/**
 * Converts textual value to a javascript typed value.
 * @param  {string} value
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
    result = parseValueOfType(value, Array.isArray(schemaEntry.type) ? schemaEntry.type[0] : schemaEntry.type, options)
  } else {
    throw new Error('Invalid schema entry: no .type and no .parse():\n\n' + JSON.stringify(schemaEntry, null, 2))
  }
  // If errored then return the error.
  if (result.error) {
    return result
  }
  if (result.value !== null && schemaEntry.validate) {
    try {
      schemaEntry.validate(result.value)
    } catch (error) {
      return { error: error.message }
    }
  }
  return result
}

/**
 * Converts textual value to a custom value using supplied `.parse()`.
 * @param  {string} value
 * @param  {function} parse
 * @return {{ value: any, error: string }}
 */
function parseCustomValue(value, parse) {
  try {
    let parsed = parse(value)
    if (parsed === undefined) {
      return { value: null }
    }
    return { value: parsed }
  } catch (error) {
    return { error: error.message }
  }
}

/**
 * Converts textual value to a javascript typed value.
 * @param  {string} value
 * @param  {} type
 * @return {{ value: (string|number|Date|boolean), error: string }}
 */
function parseValueOfType(value, type, options) {
  switch (type) {
    case String:
      return { value }

    case Number:
    case 'Integer':
    case Integer:
      // The global isFinite() function determines
      // whether the passed value is a finite number.
      // If  needed, the parameter is first converted to a number.
      if (!isFinite(value)) {
        return { error: 'invalid' }
      }
      if (type === Integer && !isInteger(value)) {
        return { error: 'invalid' }
      }
      // Convert strings to numbers.
      // Just an additional feature.
      // Won't happen when called from `readXlsx()`.
      if (typeof value === 'string') {
        value = parseFloat(value)
      }
      return { value }

    case 'URL':
    case URL:
      if (!isURL(value)) {
        return { error: 'invalid' }
      }
      return { value }

    case 'Email':
    case Email:
      if (!isEmail(value)) {
        return { error: 'invalid' }
      }
      return { value }

    case Date:
      // XLSX has no specific format for dates.
      // Sometimes a date can be heuristically detected.
      // https://github.com/catamphetamine/read-excel-file/issues/3#issuecomment-395770777
      if (value instanceof Date) {
        return { value }
      }
      if (typeof value === 'number') {
        if (!isFinite(value)) {
          return { error: 'invalid' }
        }
        value = parseInt(value)
        const date = parseDate(value, options.properties)
        if (!date) {
          return { error: 'invalid' }
        }
        return { value: date }
      }
      return { error: 'invalid' }

    case Boolean:
      if (typeof value === 'boolean') {
        return { value }
      }
      return { error: 'invalid' }

    default:
      throw new Error(`Unknown schema type: ${type && type.name || type}`)
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