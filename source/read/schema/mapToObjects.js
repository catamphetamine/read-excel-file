import NumberType from '../../types/Number.js'
import StringType from '../../types/String.js'
import BooleanType from '../../types/Boolean.js'
import DateType from '../../types/Date.js'

const DEFAULT_OPTIONS = {
  schemaPropertyValueForMissingColumn: undefined,
  schemaPropertyValueForMissingValue: null,
  schemaPropertyShouldSkipRequiredValidationForMissingColumn: () => false,
  // `getEmptyObjectValue(object, { path })` applies to both the top-level object
  // and any of its sub-objects.
  getEmptyObjectValue: () => null,
  getEmptyArrayValue: () => null,
  isColumnOriented: false,
  ignoreEmptyRows: true,
  arrayValueSeparator: ','
}

/**
 * Converts spreadsheet-alike data structure into an array of objects.
 *
 * Parameters:
 *
 * * `data` — An array of rows, each row being an array of cells. The first row should be the list of column headers and the rest of the rows should be the data.
 * * `schema` — A "to JSON" convertion schema (see above).
 * * `options` — (optional) Schema conversion parameters of `read-excel-file`:
 *   * `schemaPropertyValueForMissingColumn` — By default, when some of the `schema` columns are missing in the input `data`, those properties are set to `undefined` in the output objects. Pass `schemaPropertyValueForMissingColumn: null` to set such "missing column" properties to `null` in the output objects.
 *   * `schemaPropertyValueForNullCellValue` — By default, when it encounters a `null` value in a cell in input `data`, it sets it to `undefined` in the output object. Pass `schemaPropertyValueForNullCellValue: null` to make it set such values as `null`s in output objects.
 *   * `schemaPropertyValueForUndefinedCellValue` — By default, when it encounters an `undefined` value in a cell in input `data`, it it sets it to `undefined` in the output object. Pass `schemaPropertyValueForUndefinedCellValue: null` to make it set such values as `null`s in output objects.
 *   * `schemaPropertyShouldSkipRequiredValidationForMissingColumn: (column: string, { object }) => boolean` — By default, it does apply `required` validation to `schema` properties for which columns are missing in the input `data`. One could pass a custom `schemaPropertyShouldSkipRequiredValidationForMissingColumn(column, { object })` to disable `required` validation for missing columns in some or all cases.
 *   * `getEmptyObjectValue(object, { path? })` — By default, it returns `null` for "empty" objects. One could override that value using `getEmptyObjectValue(object, { path })` parameter. The value applies to both top-level object and any nested sub-objects in case of a nested schema, hence the additional (optional) `path?: string` parameter.
 *   * `getEmptyArrayValue(array, { path })` — By default, it returns `null` for an "empty" array value. One could override that value using `getEmptyArrayValue(array, { path })` parameter.
 *
 * When parsing a property value, in case of an error, the value of that property is gonna be `undefined`.
 *
 * @param {any[][]} data - An array of rows, each row being an array of cells.
 * @param {object} schema
 * @param {object} [options]
 * @param {null} [options.schemaPropertyValueForMissingColumn] — By default, when some of the `schema` columns are missing in the input `data`, those properties are set to `undefined` in the output objects. Pass `schemaPropertyValueForMissingColumn: null` to set such "missing column" properties to `null` in the output objects.
 * @param {null} [options.schemaPropertyValueForMissingValue] — By default, when it encounters a `null` value in a cell in input `data`, it leaves the value as is. Pass a custom `schemaPropertyValueForMissingValue` to make it set such values to that value.
 * @param {object} [options.properties] — An optional object with optional property `epoch1904: true/false`. It is used when parsing dates.
 * @param {boolean} [options.schemaPropertyShouldSkipRequiredValidationForMissingColumn(column: string, { object })] — By default, it does apply `required` validation to `schema` properties for which columns are missing in the input `data`. One could pass a custom `schemaPropertyShouldSkipRequiredValidationForMissingColumn(column, { object })` to disable `required` validation for missing columns in some or all cases.
 * @param {function} [options.getEmptyObjectValue(object, { path })] — By default, it returns `null` for an "empty" resulting object. One could override that value using `getEmptyObjectValue(object, { path })` parameter. The value applies to both top-level object and any nested sub-objects in case of a nested schema, hence the additional `path?: string` parameter.
 * @param {function} [getEmptyArrayValue(array, { path })] — By default, it returns `null` for an "empty" array value. One could override that value using `getEmptyArrayValue(array, { path })` parameter.
 * @param {boolean} [options.isColumnOriented] — By default, the headers are assumed to be the first row in the `data`. Pass `isColumnOriented: true` if the headers are the first column in the `data`. i.e. if `data` is "transposed".
 * @param {string} [options.arrayValueSeparator] — When specified, string values will be split by this separator to get the array.
 * @param {object} [options.rowIndexSourceMap] — Custom row indexes of `data` rows. If present, will overwrite the indexes of `data` rows with the indexes from this `rowIndexSourceMap`.
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
    ignoreEmptyRows,
    rowIndexSourceMap: rowIndexSourceMapOriginal,
    ...schemaTransformOptions
  } = options

  // `rowIndexSourceMap` could be mutated by `ignoreEmptyRows: true` option.
  // Create a copy of it so that the original `rowIndexSourceMap` is not affected by those changes.
  let rowIndexSourceMap = rowIndexSourceMapOriginal && rowIndexSourceMapOriginal.slice()

  validateSchema(schema)

  if (isColumnOriented) {
    data = transpose(data)
  }

	if (ignoreEmptyRows) {
		data = data.filter((row, i) => {
      const isEmptyRow = row.every(cell => cell === null)
      if (isEmptyRow) {
        // Adjust `rowIndexSourceMap` now that the row has been removed.
        if (rowIndexSourceMap) {
          // Remove the `rowIndexSourceMap` entry that corresponds to the removed row.
          rowIndexSourceMap.splice(i, 1)
        }
        return false;
      }
      return true;
    })
	}

  const columns = data[0]

  const results = []
  const errors = []

  for (let i = 1; i < data.length; i++) {
    const result = read(schema, data[i], i, undefined, columns, errors, schemaTransformOptions)
    results.push(result)
  }

  // Set the correct `row` number in `errors` if a custom `rowIndexSourceMap` is supplied.
  if (rowIndexSourceMap) {
    for (const error of errors) {
      // Convert the `row` index in `data` to the
      // actual `row` index in the spreadsheet.
      // `- 1` converts row number to row index.
      // `+ 1` converts row index to row number.
      error.row = rowIndexSourceMap[error.row - 1] + 1
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
    schemaEntry,
    value,
    error: errorMessage,
    reason
  }) => {
    const error = {
      error: errorMessage,
      row: rowIndex + 1,
      column: schemaEntry.column,
      value
    }
    if (reason) {
      error.reason = reason
    }
    // * Regular values specify a `type?` property, which is included in the `error` object.
    // * Nested objects specify a `schema` property, which is not included in the `error` object.
    if (schemaEntry.type) {
      error.type = schemaEntry.type
    }
    return error
  }

  const pendingRequiredChecks = []

  // For each schema entry.
  for (const key of Object.keys(schema)) {
    const schemaEntry = schema[key]

    // `schemaEntry.prop` property is now deprecated and shouldn't be used.
    // Instead, it now uses `key` as the key in the `object`.
    // And column name is now read not from `key` but from `schemaEntry.column` property.
    const propertyName = key
    const columnTitle = schemaEntry.column

    // The path of this property inside the resulting object.
    const propertyPath = `${path || ''}.${propertyName}`

    // Read the cell value for the schema entry.
    let cellValue
    const columnIndex = columns.indexOf(columnTitle)
    const isMissingColumn = columnIndex < 0
    if (!isMissingColumn) {
      cellValue = row[columnIndex]
    }

    let value
    let error
    let reason

    // Get property `value` from cell value.
    if (schemaEntry.schema) {
      value = read(schemaEntry.schema, row, rowIndex, propertyPath, columns, errors, options)
    } else {
      if (isMissingColumn) {
        if ('schemaPropertyValueForMissingColumn' in options) {
          value = options.schemaPropertyValueForMissingColumn
        }
      }
      else if (cellValue === undefined) {
        // This isn't supposed to be possible. Cell values are always `null` when cells are empty.
        // Employ some sensible fallback behavior here.
        if ('schemaPropertyValueForMissingValue' in options) {
          value = options.schemaPropertyValueForMissingValue
        }
      }
      else if (cellValue === null) {
        if ('schemaPropertyValueForMissingValue' in options) {
          value = options.schemaPropertyValueForMissingValue
        }
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
        pendingRequiredChecks.push({ schemaEntry, value, isMissingColumn })
      }
    }

    if (error) {
      // If there was an error then the property value in the `object` will be `undefined`,
      // i.e it won't add the property value to the mapped object.
      errors.push(createError({
        schemaEntry,
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
      // Skip setting `undefined` values because they're already `undefined`
      // due to not having previously been set.
      if (value !== undefined) {
        object[propertyName] = value
      }
    }
  }

  // Return `null` for an "empty" mapped object.
  if (isEmptyObject) {
    return options.getEmptyObjectValue(object, { path })
  }

  // Perform any `required` validations.
  for (const { schemaEntry, value, isMissingColumn } of pendingRequiredChecks) {
    // Can optionally skip `required` validation for missing columns.
    const skipRequiredValidation = isMissingColumn && options.schemaPropertyShouldSkipRequiredValidationForMissingColumn(schemaEntry.column, { object })
    if (!skipRequiredValidation) {
      const { required } = schemaEntry
      const isRequired = typeof required === 'boolean' ? required : required(object)
      if (isRequired) {
        errors.push(createError({
          schemaEntry,
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
    throw new Error('`schemaEntry.parse` property was renamed to `schemaEntry.type`')
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
    // throw new Error('Invalid schema entry: no `type` specified:\n\n' + JSON.stringify(schemaEntry, null, 2))
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
    const schemaEntry = schema[key]
    // Validate that the `schema` is not using a deprecated `type: nestedSchema` format.
    if (typeof schemaEntry.type === 'object' && !Array.isArray(schemaEntry.type)) {
      throw new Error('When defining a nested schema, use a `schema` property instead of a `type` property')
    }
    // Validate that every property has a source `column` title specified for it.
    if (!schemaEntry.schema) {
      if (!schemaEntry.column) {
        throw new Error(`"column" not defined for schema entry "${key}".`)
      }
    }
  }
}

function isEmptyValue(value) {
  return value === undefined || value === null
}