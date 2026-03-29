import NumberType from './types/Number.js'
import StringType from './types/String.js'
import BooleanType from './types/Boolean.js'
import DateType from './types/Date.js'

/**
 * Converts spreadsheet-alike data structure into an array of JSON objects.
 *
 * Parameters:
 *
 * * `data` — An array of rows, each row being an array of cells. The first row should be the list of column headers and the rest of the rows should be the data.
 * * `schema` — A "to JSON" convertion schema (see above).
 * * `options` — (optional) Schema conversion parameters of `read-excel-file`:
 *   * `propertyValueWhenColumnIsMissing` — By default, when some of the `schema` columns are missing in the input `data`, those properties are set to `undefined` in the output objects. Pass `propertyValueWhenColumnIsMissing: null` to set such "missing column" properties to `null` in the output objects.
 *   * `propertyValueWhenCellIsEmpty` — By default, when it encounters a `null` value in a cell in input `data`, it sets it to `undefined` in the output object. Pass `propertyValueWhenCellIsEmpty: null` to make it set such values as `null`s in output objects.
 *   // * `shouldSkipRequiredValidationWhenColumnIsMissing: (column: string, { object }) => boolean` — By default, it does apply `required` validation to `schema` properties for which columns are missing in the input `data`. One could pass a custom `shouldSkipRequiredValidationWhenColumnIsMissing(column, { object })` to disable `required` validation for missing columns in some or all cases.
 *   * `transformEmptyObject(object, { path? })` — By default, it returns `null` for "empty" objects. One could override that value using `transformEmptyObject(object, { path })` parameter. The value applies to both top-level object and any nested sub-objects in case of a nested schema, hence the additional (optional) `path?: string` parameter.
 *   * `transformEmptyArray(array, { path })` — By default, it returns `null` for an "empty" array value. One could override that value using `transformEmptyArray(array, { path })` parameter.
 *   * `arrayValueSeparator` — By default, it splits array-type cell values by a comma character.
 *
 * When parsing a property value, in case of an error, the value of that property is gonna be `undefined`.
 *
 * @param {SheetData} data - An array of rows, each row being an array of cells.
 * @param {object} schema
 * @param {object} [options]
 * @param {any} [options.propertyValueWhenColumnIsMissing] — By default, when some of the `schema` columns are missing in the input `data`, those properties are set to `undefined` in the output objects. Pass `propertyValueWhenColumnIsMissing: null` to set such "missing column" properties to `null` in the output objects.
 * @param {any} [options.propertyValueWhenCellIsEmpty] — By default, when it encounters a `null` value in a cell in input `data`, it leaves the value as is. Pass a custom `propertyValueWhenCellIsEmpty` to make it set such values to that value.
 * // @param {boolean} [options.shouldSkipRequiredValidationWhenColumnIsMissing(column: string, { object })] — By default, it does apply `required` validation to `schema` properties for which columns are missing in the input `data`. One could pass a custom `shouldSkipRequiredValidationWhenColumnIsMissing(column, { object })` to disable `required` validation for missing columns in some or all cases.
 * @param {function} [options.transformEmptyObject(object, { path })] — By default, it returns `null` for an "empty" resulting object. One could override that value using `transformEmptyObject(object, { path })` parameter. The value applies to both top-level object and any nested sub-objects in case of a nested schema, hence the additional `path?: string` parameter.
 * @param {function} [options.transformEmptyArray(array, { path })] — By default, it returns `null` for an "empty" array value. One could override that value using `transformEmptyArray(array, { path })` parameter.
 * @param {string} [options.arrayValueSeparator] — When specified, string values will be split by this separator to get the array.
 * @return {object[]} — An array of objects of shape `{ object, errors }`. Either `object` or `errors` is going to be `undefined`.
 */
export default function parseData(data, schema, optionsCustom) {
  validateSchema(schema)
  const options = applyDefaultOptions(optionsCustom)
  const [columns, ...dataRows] = data
  return dataRows.map((dataRow) => {
    return parseDataRow(dataRow, schema, undefined, columns, options)
  })
}

function parseDataRow(row, schema, path, columns, options) {
  const object = {}
  let errors = []

  let isEmptyObject = true

  const pendingRequiredValidations = []

  // For each property of the object.
  for (const key of Object.keys(schema)) {
    const {
      errors: propertyErrors,
      pendingRequiredValidation,
      value
    } = parseProperty(key, row, path, schema, columns, options)

    if (propertyErrors) {
      errors = errors.concat(propertyErrors)
    } else {
      object[key] = value
      // Will perform `required` validation later, when all properties have been parsed.
      if (pendingRequiredValidation) {
        pendingRequiredValidations.push(pendingRequiredValidation)
      }
      // Potentially unmark the object as "empty".
      if (isEmptyObject && !isEmptyValue(value)) {
        isEmptyObject = false
      }
    }
  }

  // Perform basic `required` validations (i.e. when `required` property is a boolean).
  for (const { required, schemaEntry, value } of pendingRequiredValidations) {
    if (required === true) {
      errors.push(createError({
        error: 'required',
        schemaEntry,
        value
      }))
    }
  }

  // If there were any errors, return them.
  if (errors.length > 0) {
    return { errors }
  }

  // Perform "complex" `required` validations (i.e. when `required` property is a function).
  // These "complex" `required` validations should only be performed when all properties
  // of an object have been parsed correctly because these validations rely on the values
  // of other properties.
  for (const { required, schemaEntry, value } of pendingRequiredValidations) {
    if (typeof required !== 'boolean' && required(object)) {
      errors.push(createError({
        error: 'required',
        schemaEntry,
        value
      }))
    }
  }

  // If there were any "complex" `required` errors, return them.
  if (errors.length > 0) {
    return { errors }
  }

  // Return `null` for an "empty" mapped object.
  if (isEmptyObject) {
    return {
      object: options.transformEmptyObject(object, { path })
    }
  }

  return { object }
}

function parseProperty(key, row, path, schema, columns, options) {
  const schemaEntry = schema[key]

  const columnIndex = schemaEntry.column ? columns.indexOf(schemaEntry.column) : undefined
  const isMissingColumn = columnIndex < 0

  // The path of this property inside the top-level object.
  const propertyPath = `${path ? path + '.' : ''}${key}`

  const {
    errors,
    value
  } = schemaEntry.schema
    ? parseNestedObject(row, schemaEntry.schema, propertyPath, columns, options)
    : (
      isMissingColumn
        ? { value: options.propertyValueWhenColumnIsMissing }
        : parseDataCellValue(row[columnIndex], schemaEntry, propertyPath, options)
    )

  if (errors) {
    return { errors }
  }

  // Should apply `required` validation if the value is "empty".
  let pendingRequiredValidation
  if (schemaEntry.required && isEmptyValue(value)) {
    // // Can optionally skip `required` validation for certain missing columns.
    // const skipRequiredValidation = isMissingColumn && options.shouldSkipRequiredValidationWhenColumnIsMissing(schemaEntry.column, { object: ... })
    // if (!skipRequiredValidation) { ... }

    // Will perform `required` validation in the end,
    // when all properties of the object have been parsed.
    // This is because `required` could also be a function of `object`.
    pendingRequiredValidation = {
      required: schemaEntry.required,
      schemaEntry,
      value
    }
  }

  return { value, pendingRequiredValidation }
}

function parseNestedObject(row, schema, propertyPath, columns, options) {
  const {
    object,
    errors
  } = parseDataRow(row, schema, propertyPath, columns, options)
  return {
    value: object,
    errors
  }
}

function parseDataCellValue(cellValue, schemaEntry, propertyPath, options) {
  const {
    value: propertyValue,
    error: errorMessage,
    reason
  } = parseDataCellValue_(cellValue, schemaEntry, propertyPath, options)

  if (errorMessage) {
    const error = createError({
      schemaEntry,
      value: cellValue,
      error: errorMessage,
      reason
    })
    return { errors: [error] }
  } else {
    return { value: propertyValue }
  }
}

/**
 * Converts a cell value value to a javascript typed value.
 * @param  {any} value
 * @param  {object} schemaEntry
 * @param  {string} propertyPath
 * @param  {object} options
 * @return {{ value?: any, error?: string, reason?: string }}
 */
function parseDataCellValue_(cellValue, schemaEntry, propertyPath, options) {
  if (cellValue === undefined) {
    // This isn't supposed to be possible when reading spreadsheet data:
    // cell values are always read as `null` when those cells are empty.
    // It's currently impossible for `read-excel-file` to return `undefined` cell value.
    // Here it uses some "sensible default" fallback by treating `undefined` as "column missing".
    return {
      value: options.propertyValueWhenColumnIsMissing
    }
  }

  if (cellValue === null) {
    return {
      value: options.propertyValueWhenCellIsEmpty
    }
  }

  if (Array.isArray(schemaEntry.type)) {
    const errors = []
    const reasons = []
    const values = parseSeparatedSubstrings(cellValue, options.arrayValueSeparator).map((substring) => {
      // If any substring was already detected to be invalid
      // don't attempt to parse any other substrings.
      if (errors.length > 0) {
        return
      }
      const { value, error, reason } = parseValue(substring, schemaEntry, options)
      if (error) {
        errors.push(error)
        reasons.push(reason)
        return
      }
      return value
    })
    if (errors.length > 0) {
      return {
        error: errors[0],
        reason: reasons[0]
      }
    }
    const isEmpty = values.every(isEmptyValue)
    if (isEmpty) {
      return {
        value: options.transformEmptyArray(values, { path: propertyPath })
      }
    }
    return {
      value: values
    }
  }

  return parseValue(cellValue, schemaEntry, options)
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
  if (schemaEntry.type) {
    result = parseValueOfType(
      value,
      // Supports parsing array types.
      // See `parseSeparatedSubstrings()` function for more details.
      // Example `type`: String[]
      // Input: 'Barack Obama, "String, with, colons", Donald Trump'
      // Output: ['Barack Obama', 'String, with, colons', 'Donald Trump']
      Array.isArray(schemaEntry.type) ? schemaEntry.type[0] : schemaEntry.type,
      options
    )
  } else {
    // The default `type` is `String`.
    result = { value: value }
    // throw new Error('Invalid schema entry: no `type` specified:\n\n' + JSON.stringify(schemaEntry, null, 2))
  }

  // If errored then return the error.
  if (result.error) {
    return result
  }

  // Validate the value.
  if (result.value !== null) {
    // Perform `oneOf` validation.
    if (schemaEntry.oneOf && schemaEntry.oneOf.indexOf(result.value) < 0) {
      return { error: 'invalid', reason: 'unknown' }
    }
    // Perform `validate()` validation.
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
 * Converts cell value to a javascript typed value.
 * @param  {(string|number|boolean|Date)} value
 * @param  {function} type
 * @return {object} Either `{ value: (string|number|Date|boolean) }` or `{ error: string, reason?: string }`
 */
function parseValueOfType(value, type) {
  switch (type) {
    case String:
      return parseValueUsingTypeParser(value, StringType)

    case Number:
      return parseValueUsingTypeParser(value, NumberType)

    case Date:
      return parseValueUsingTypeParser(value, DateType)

    case Boolean:
      return parseValueUsingTypeParser(value, BooleanType)

    default:
      // Validate `type`
      if (typeof type !== 'function') {
        throw new Error(`Unsupported schema \`type\`: ${type && type.name || type}`)
      }
      return parseValueUsingTypeParser(value, type)
  }
}

/**
 * Converts textual value to a custom value using supplied `type`.
 * @param  {any} value
 * @param  {function} type
 * @return {{ value: any, error: string }}
 */
function parseValueUsingTypeParser(value, type) {
  try {
    const parsedValue = type(value)
    // Returning `undefined` from a `type` parser is treated as returning `null`.
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

export function getNextSubstring(string, endCharacter, startIndex) {
  let i = 0
  let substring = ''
  while (startIndex + i < string.length) {
    const character = string[startIndex + i]
    if (character === endCharacter) {
      return [substring, i]
    }
    // Previously, it used to treat `"` character similar to how it's treated in `.csv` files:
    // any commas inside quotes are ignored. But then I thought that it could introduce more
    // issues than it was originally intending to fix, and it also didn't provide an "escape" mechanism.
    // Overall, a decision was made to simplify the whole thing and drop the concept of quotes as special characters.
    //
    // else if (character === '"') {
    //   const quotedSubstring = getNextSubstring(string, '"', startIndex + i + 1)
    //   substring += quotedSubstring[0]
    //   i += '"'.length + quotedSubstring[1] + '"'.length
    // }
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
export function parseSeparatedSubstrings(string, arrayValueSeparator) {
  const elements = []
  let index = 0
  while (index < string.length) {
    const [substring, length] = getNextSubstring(string, arrayValueSeparator, index)
    index += length + arrayValueSeparator.length
    elements.push(substring.trim())
  }
  return elements
}

function createError({
  schemaEntry,
  value,
  error: errorMessage,
  reason
}) {
  const error = {
    error: errorMessage,
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

const DEFAULT_OPTIONS = {
  propertyValueWhenColumnIsMissing: undefined,
  propertyValueWhenCellIsEmpty: null,
  // shouldSkipRequiredValidationWhenColumnIsMissing: () => false,
  // `transformEmptyObject(object, { path })` applies to both the top-level object
  // and any of its nested objects.
  transformEmptyObject: () => null,
  transformEmptyArray: () => null,
  arrayValueSeparator: ','
}

function applyDefaultOptions(options) {
  if (options) {
    return {
      ...DEFAULT_OPTIONS,
      ...options
    }
  } else {
    return DEFAULT_OPTIONS
  }
}