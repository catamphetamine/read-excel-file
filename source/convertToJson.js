import parseDate from './parseDate'

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

  const columns = data[0]

  const results = []
  const errors = []

  for (let i = 1; i < data.length; i++) {
    const result = read(schema, data[i], i - 1, columns, errors)
    if (result) {
      results.push(result)
    }
  }

  return {
    rows: results,
    errors
  }
}

function read(schema, row, rowIndex, columns, errors) {
  const object = {}
  for (const key of Object.keys(schema)) {
    const schemaEntry = schema[key]
    const isNestedSchema = typeof schemaEntry.type === 'object' && !Array.isArray(schemaEntry.type)
    const rawValue = row[columns.indexOf(key)]
    let value = null
    let error
    if (isNestedSchema) {
      value = read(schemaEntry.type, row, rowIndex, columns, errors)
      if (value === null && schemaEntry.required) {
        error = 'required'
      }
    } else {
      if (Array.isArray(schemaEntry.type)) {
        const array = parseArray(rawValue).map((_value) => {
          const result = parseValue(_value, schemaEntry)
          if (result[1]) {
            value = _value
            error = result[1]
          }
          return result[0]
        })
        if (!error) {
          for (const element of array) {
            if (element !== null) {
              value = array
              break
            }
          }
        }
      } else {
        const result = parseValue(rawValue, schemaEntry)
        error = result[1]
        value = error ? rawValue : result[0]
      }
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
    } else if (!error && value !== null) {
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
 * @return {[value: (string|number|boolean), error: string]}
 */
export function parseValue(value, schemaEntry) {
  if (value === null) {
    if (schemaEntry.required) {
      return [null, 'required']
    }
    return [null]
  }
  switch (schemaEntry.type) {
    case String:
      return [value]
    case Number:
      // The global isFinite() function determines
      // whether the passed value is a finite number.
      // If  needed, the parameter is first converted to a number.
      if (isFinite(value)) {
        return [parseInt(value)]
      }
      return [null, 'invalid']
    case Date:
      if (!isFinite(value)) {
        return [null, 'invalid']
      }
      value = parseInt(value)
      const date = parseDate(value, schemaEntry.template, true, true)
      if (!date) {
        return [null, 'invalid']
      }
      return [date]
    case Boolean:
      if (value === '1') {
        return [true]
      }
      if (value === '0') {
        return [false]
      }
      return [null, 'invalid']
    default:
      if (!schemaEntry.parse) {
        throw new Error('Invalid schema entry: no .type and no .parse():\n\n' + JSON.stringify(schemaEntry, null, 2))
      }
      try {
        let parsed = schemaEntry.parse(value)
        if (parsed === undefined) {
          parsed = null
        }
        return [parsed]
      } catch (error) {
        return [null, error.message]
      }
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
    console.log('block', getBlock(string, ',', index))
    const [substring, length] = getBlock(string, ',', index)
    index += length + ','.length
    blocks.push(substring.trim())
  }
  return blocks
}

// Transpose a 2D array.
// https://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
const transpose = array => array[0].map((_, i) => array.map(row => row[i]))