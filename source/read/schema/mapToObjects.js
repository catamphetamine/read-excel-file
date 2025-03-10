import NumberType from '../../types/Number.js'
import StringType from '../../types/String.js'
import BooleanType from '../../types/Boolean.js'
import DateType from '../../types/Date.js'

const DEFAULT_OPTIONS = {
  schemaPropertyValueForMissingColumn: undefined,
  schemaPropertyValueForUndefinedCellValue: undefined,
  schemaPropertyValueForNullCellValue: null,
  schemaPropertyShouldSkipRequiredValidationForMissingColumn: () => false,
  // `getEmptyObjectValue(object, { path })` applies to both the top-level object
  // and any of its sub-objects.
  getEmptyObjectValue: () => null,
  getEmptyArrayValue: () => null,
  isColumnOriented: false,
  arrayValueSeparator: ','
}

/**
 * (this function is exported from `read-excel-file/map`)
 * Converts spreadsheet-alike data structure into an array of objects.
 * The first row should be the list of column headers.
 * @param {any[][]} data - An array of rows, each row being an array of cells.
 * @param {object} schema
 * @param {object} [options]
 * @param {null} [options.schemaPropertyValueForMissingColumn] — By default, when some of the `schema` columns are missing in the input `data`, those properties are set to `undefined` in the output objects. Pass `schemaPropertyValueForMissingColumn: null` to set such "missing column" properties to `null` in the output objects.
 * @param {null} [options.schemaPropertyValueForNullCellValue] — By default, when it encounters a `null` value in a cell in input `data`, it sets it to `undefined` in the output object. Pass `schemaPropertyValueForNullCellValue: null` to make it set such values as `null`s in output objects.
 * @param {null} [options.schemaPropertyValueForUndefinedCellValue] — By default, when it encounters an `undefined` value in a cell in input `data`, it it sets it to `undefined` in the output object. Pass `schemaPropertyValueForUndefinedCellValue: null` to make it set such values as `null`s in output objects.
 * @param {boolean} [options.schemaPropertyShouldSkipRequiredValidationForMissingColumn(column: string, { object })] — By default, it does apply `required` validation to `schema` properties for which columns are missing in the input `data`. One could pass a custom `schemaPropertyShouldSkipRequiredValidationForMissingColumn(column, { object })` to disable `required` validation for missing columns in some or all cases.
 * @param {function} [options.getEmptyObjectValue(object, { path })] — By default, it returns `null` for an "empty" resulting object. One could override that value using `getEmptyObjectValue(object, { path })` parameter. The value applies to both top-level object and any nested sub-objects in case of a nested schema, hence the additional `path?: string` parameter.
 * @param {function} [getEmptyArrayValue(array, { path })] — By default, it returns `null` for an "empty" array value. One could override that value using `getEmptyArrayValue(array, { path })` parameter.
 * @param {boolean} [options.isColumnOriented] — By default, the headers are assumed to be the first row in the `data`. Pass `isColumnOriented: true` if the headers are the first column in the `data`. i.e. if `data` is "transposed".
 * @param {object} [options.rowIndexMap] — Custom row index mapping `data` rows. If present, will overwrite the indexes of `data` rows with the indexes from this `rowIndexMap`.
 * @return {object[]}
 */
export default function mapToObjects(data, schema, options) {
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
    rowIndexMap
  } = options

  validateSchema(schema)

  if (isColumnOriented) {
    data = transpose(data)
  }

  const columns = data[0]

  const results = []
  const errors = []

  for (let i = 1; i < data.length; i++) {
    const result = read(schema, data[i], i, undefined, columns, errors, options)
    results.push(result)
  }

  // Set the correct `row` number in `errors` if a custom `rowIndexMap` is supplied.
  if (rowIndexMap) {
    for (const error of errors) {
      // Convert the `row` index in `data` to the
      // actual `row` index in the spreadsheet.
      // `- 1` converts row number to row index.
      // `+ 1` converts row index to row number.
      error.row = rowIndexMap[error.row - 1] + 1
    }
  }

  return {
    rows: results,
    errors
  }
}

function read(schema, row, rowIndex, path, columns, errors, options) {
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

  // For each schema entry.
  for (const key of Object.keys(schema)) {
    const schemaEntry = schema[key]
    const isNestedSchema = typeof schemaEntry.type === 'object' && !Array.isArray(schemaEntry.type)

    // The path of this property inside the resulting object.
    const propertyPath = `${path || ''}.${schemaEntry.prop}`

    // Read the cell value for the schema entry.
    let cellValue
    const columnIndex = columns.indexOf(key)
    const isMissingColumn = columnIndex < 0
    if (!isMissingColumn) {
      cellValue = row[columnIndex]
    }

    let value
    let error
    let reason

    // Get property `value` from cell value.
    if (isNestedSchema) {
      value = read(schemaEntry.type, row, rowIndex, propertyPath, columns, errors, options)
    } else {
      if (isMissingColumn) {
        value = options.schemaPropertyValueForMissingColumn
      }
      else if (cellValue === undefined) {
        value = options.schemaPropertyValueForUndefinedCellValue
      }
      else if (cellValue === null) {
        value = options.schemaPropertyValueForNullCellValue
      }
      else if (Array.isArray(schemaEntry.type)) {
        const array = parseArray(cellValue, options.arrayValueSeparator).map((_value) => {
          if (error) {
            return
          }
          const result = parseValue(_value, schemaEntry, options)
          if (result.error) {
            // In case of an error, `value` won't be returned and will just be reported
            // as part of an `error` object, so it's fine assigning just an element of the array.
            value = _value
            error = result.error
            reason = result.reason
          }
          return result.value
        })
        if (!error) {
          const isEmpty = array.every(isEmptyValue)
          value = isEmpty ? options.getEmptyArrayValue(array, { path: propertyPath }) : array
        }
      } else {
        const result = parseValue(cellValue, schemaEntry, options)
        error = result.error
        reason = result.reason
        value = error ? cellValue : result.value
      }
    }

    // Apply `required` validation if the value is "empty".
    if (!error && isEmptyValue(value)) {
      if (schemaEntry.required) {
        // Will perform this `required()` validation in the end,
        // when all properties of the mapped object have been mapped.
        pendingRequiredChecks.push({ column: key, value, isMissingColumn })
      }
    }

    if (error) {
      // If there was an error then the property value in the `object` will be `undefined`,
      // i.e it won't add the property value to the mapped object.
      errors.push(createError({
        column: key,
        value,
        error,
        reason
      }))
    } else {
      // Possibly unmark the mapped object as "empty".
      if (isEmptyObject && !isEmptyValue(value)) {
        isEmptyObject = false
      }
      // Set the value in the mapped object.
      // Skip setting `undefined` values because they're already `undefined`.
      if (value !== undefined) {
        object[schemaEntry.prop] = value
      }
    }
  }

  // Return `null` for an "empty" mapped object.
  if (isEmptyObject) {
    return options.getEmptyObjectValue(object, { path })
  }

  // Perform any `required` validations.
  for (const { column, value, isMissingColumn } of pendingRequiredChecks) {
    // Can optionally skip `required` validation for missing columns.
    const skipRequiredValidation = isMissingColumn && options.schemaPropertyShouldSkipRequiredValidationForMissingColumn(column, { object })
    if (!skipRequiredValidation) {
      const { required } = schema[column]
      const isRequired = typeof required === 'boolean' ? required : required(object)
      if (isRequired) {
        errors.push(createError({
          column,
          value,
          error: 'required'
        }))
      }
    }
  }

  // Return the mapped object.
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
    const parsedValue = parse(value)
    if (parsedValue === undefined) {
      return { value: null }
    }
    return { value: parsedValue }
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
export function parseArray(string, arrayValueSeparator) {
  const blocks = []
  let index = 0
  while (index < string.length) {
    const [substring, length] = getBlock(string, arrayValueSeparator, index)
    index += length + arrayValueSeparator.length
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

function isEmptyValue(value) {
  return value === undefined || value === null
}