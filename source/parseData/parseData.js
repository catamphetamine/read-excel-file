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
 *   * `separatorCharacter` — By default, it splits array-type cell values by a comma character.
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
 * @param {string} [options.separatorCharacter] — When specified, string values will be split by this separator to get the array.
 * @return {object} — An object of shape `{ objects, errors }`. Either `objects` or `errors` is going to be `undefined`.
 */
export default function parseData(data, schema, optionsCustom) {
  const objects = []
  let errors = []

  const parsedRows = parseDataWithPerRowErrors(data, schema, optionsCustom)
  let parsedRowIndex = 0
  for (const { object, errors: rowErrors } of parsedRows) {
    if (rowErrors) {
      errors = errors.concat(rowErrors.map(rowError => ({ ...rowError, row: parsedRowIndex + 1 })))
    } else {
      objects.push(object)
    }
  }

  if (errors.length > 0) {
    return { errors }
  }

  return { objects }
}

// This one is only used in tests.
export function parseDataWithPerRowErrors(data, schema, optionsCustom) {
  validateSchema(schema)

  const options = applyDefaultOptions(optionsCustom)

  const [columns, ...dataRows] = data

  return dataRows.map(row => parseDataRow(row, schema, columns, options))
}

function parseDataRow(dataRow, schema, columns, options) {
  // Create a `schemaEntry` for the top-level object.
  const schemaEntry = {
    schema
  }

  // Parse the values in the given data row into an object.
  const {
    value,
    isEmptyValue,
    errors,
    children
  } = parseProperty(dataRow, schemaEntry, undefined, columns, options)

  // Simulate a "dummy" parent object for the top-level object.
  // It will be used when running `required` validations.
  const dummyParentObject = {
    // The "dummy" parent object has a "dummy" value.
    // This value is irrelevant because it won't be read anywhere.
    value: PARSED_OBJECT_TREE_START,
    // The "dummy" parent object is empty if the parsed row is empty.
    isEmptyValue,
    // The "dummy" object has the same errors as the parsed row.
    errors,
    // The parsed object by default is not required to have any data
    // so the "dummy" object is not required.
    isRequired: undefined
  }

  // Run any `required` validations.
  //
  // `required` validations should be run after the entire data row has been parsed,
  // i.e. when the entire object structure has been parsed.
  // The reason is that a `required` validation could be either a simple boolean or a "complex" function.
  // In the latter case, the result of a `required()` function may depend on any other property of the object,
  // hence the actual `required` flag value could only be obtained after the entire data row has been parsed.
  //
  // For example, consider a top-level object:
  //
  // {
  //   firstName: string,
  //   lastName: string,
  //   pet?: { name: string }
  // }
  //
  // A corresponding schema would be:
  //
  // {
  //   firstName: {
  //     required: true
  //   },
  //   lastName: {
  //     required: true
  //   },
  //   pet: {
  //     required: false,
  //     schema: {
  //       name: {
  //         required: true
  //       }
  //     }
  //   }
  // }
  //
  // I.e. when a `pet` exists, it must have a `name`.
  //
  // In such case, the `required: true` check of the `pet`'s `name` property
  // should not be performed if the `pet` is not present, because the `pet` nested object
  // is marked as `required: false`, meaning that `pet` data is not required to be present.
  //
  const requiredErrors = runPendingRequiredValidations(
    schemaEntry,
    value,
    isEmptyValue,
    errors,
    children,
    // Simulate a "dummy" parent object for the top-level object.
    dummyParentObject.isRequired,
    dummyParentObject.value,
    dummyParentObject.isEmptyValue,
    dummyParentObject.errors
  )

  // If there were any errors, whether caused by `required`
  // or occured while parsing the values, return those errors.
  if (errors || requiredErrors) {
    return {
      errors: (errors || []).concat(requiredErrors || [])
    }
  }

  // Return the parsed object.
  return {
    object: transformValue(value, isEmptyValue, undefined, options)
  }
}

function parseObject(row, schema, path, columns, options) {
  const object = {}
  let isEmptyObject = true

  let errors = []

  const children = []

  // For each property of the object.
  for (const key of Object.keys(schema)) {
    const child = parseProperty(row, schema[key], getPropertyPath(key, path), columns, options)

    if (child.errors) {
      errors = errors.concat(child.errors)
    } else {
      object[key] = transformValue(child.value, child.isEmptyValue, getPropertyPath(key, path), options)
      // Potentially unmark the object as "empty".
      if (isEmptyObject && !child.isEmptyValue) {
        isEmptyObject = false
      }
    }

    children.push({
      ...child,
      // `schemaEntry` will be used when running `required` validation of this property (later),
      schemaEntry: schema[key]
    })
  }

  // If there were any errors, return them.
  if (errors.length > 0) {
    return {
      // Return the errors.
      errors,
      // Return the `children` because `required` validations still have to be run (later).
      children
    }
  }

  return {
    value: object,
    isEmptyValue: isEmptyObject,
    // Return the `children` because `required` validations still have to be run (later).
    children
  }
}

function parseProperty(row, schemaEntry, path, columns, options) {
  const columnIndex = schemaEntry.column ? columns.indexOf(schemaEntry.column) : undefined
  const isMissingColumn = schemaEntry.column ? columnIndex < 0 : undefined

  const {
    value,
    isEmptyValue,
    errors,
    children
  } = schemaEntry.column
    ? (
      isMissingColumn
        ? { value: options.propertyValueWhenColumnIsMissing, isEmptyValue: true }
        : parseCellValueWithPossibleErrors(row[columnIndex], schemaEntry, options)
    )
    : parseObject(
      row,
      schemaEntry.schema,
      path,
      columns,
      options
    )

  // If there were any errors, return them.
  if (errors) {
    return {
      // Return the errors.
      errors,
      // Return the `children` because `required` validations still have to be run (later).
      children
    }
  }

  return {
    value,
    isEmptyValue,
    // Return the `children` because `required` validations still have to be run (later).
    children
  }
}

function parseCellValueWithPossibleErrors(cellValue, schemaEntry, options) {
  const {
    value,
    isEmptyValue,
    error: errorMessage,
    reason: errorReason
  } = parseCellValue(cellValue, schemaEntry, options)

  if (errorMessage) {
    const error = createError({
      error: errorMessage,
      reason: errorReason,
      column: schemaEntry.column,
      valueType: schemaEntry.type,
      value: cellValue
    })
    return {
      errors: [error]
    }
  }

  return {
    value,
    isEmptyValue
  }
}

/**
 * Converts a cell value value to a javascript typed value.
 * @param  {any} cellValue
 * @param  {object} schemaEntry
 * @param  {string} propertyPath
 * @param  {object} options
 * @return {{ value?: any, isEmptyValue: boolean } | { error: string, reason?: string }}
 */
function parseCellValue(cellValue, schemaEntry, options) {
  if (cellValue === undefined) {
    // This isn't supposed to be possible when reading spreadsheet data:
    // cell values are always read as `null` when those cells are empty.
    // It's currently impossible for `read-excel-file` to return `undefined` cell value.
    // Here it uses some "sensible default" fallback by treating `undefined` as "column missing".
    return {
      value: options.propertyValueWhenColumnIsMissing,
      isEmptyValue: true
    }
  }

  if (cellValue === null) {
    return {
      value: options.propertyValueWhenCellIsEmpty,
      isEmptyValue: true
    }
  }

  // Parse comma-separated cell value.
  if (Array.isArray(schemaEntry.type)) {
    return parseArrayValue(cellValue, schemaEntry, options)
  }

  return parseValue(cellValue, schemaEntry, options)
}

/**
 * Converts textual value to a javascript typed array value.
 * @param  {any} value
 * @param  {object} schemaEntry
 * @param  {object} options
 * @return {{ value?: any, isEmptyValue: boolean } | { error: string, reason?: string }}
 */
function parseArrayValue(value, schemaEntry, options) {
  // If the cell value is not a string — i.e. a number, a boolean, a Date —
  // then throw an error.
  if (typeof value !== 'string') {
    return {
      error: 'not_a_string'
    }
  }

  let isEmptyArray = true

  const errors = []
  const reasons = []

  const values = parseSeparatedSubstrings(value, options.separatorCharacter).map((substring) => {
    // If any substring was already detected to be invalid
    // don't attempt to parse any other substrings.
    if (errors.length > 0) {
      return
    }

    // If an empty substring was extracted, it means that there was an out-of-place separator.
    if (!substring) {
      errors.push('invalid')
      reasons.push('syntax')
      return
    }

    const {
      value,
      isEmptyValue,
      error,
      reason
    } = parseValue(substring, schemaEntry, options)

    if (error) {
      errors.push(error)
      reasons.push(reason)
      return
    }

    if (isEmptyArray && !isEmptyValue) {
      isEmptyArray = false
    }

    return value
  })

  if (errors.length > 0) {
    return {
      error: errors[0],
      reason: reasons[0]
    }
  }

  return {
    value: values,
    isEmptyValue: isEmptyArray
  }
}

/**
 * Converts textual value to a javascript typed value.
 * @param  {any} value
 * @param  {object} schemaEntry
 * @param  {object} options
 * @return {{ value?: any, isEmptyValue: boolean } | { error: string }}
 */
export function parseValue(value, schemaEntry, options) {
  // `null` values (i.e. empty cells) don't get parsed.
  if (value === null) {
    return {
      value: null,
      isEmptyValue: true
    }
  }

  // Parse the value according to the `type` that is specified in the schema entry.
  let result
  if (schemaEntry.type) {
    result = parseValueOfType(
      value,
      // Get the type of the value.
      //
      // Handle the case if it's a comma-separated value.
      // Example `type`: String[]
      // Example Input Value: 'Barack Obama, "String, with, colons", Donald Trump'
      // Example Parsed Value: ['Barack Obama', 'String, with, colons', 'Donald Trump']
      //
      Array.isArray(schemaEntry.type) ? schemaEntry.type[0] : schemaEntry.type,
      options
    )
  } else {
    // If the `type` is not specified for a given schema entry, the default one is `String`.
    result = { value }
    // throw new Error('Invalid schema entry: no `type` specified:\n\n' + JSON.stringify(schemaEntry, null, 2))
  }

  // If there was an error when parsing the value then return the error.
  if (result.error) {
    return result
  }

  // If the parsed value is empty, return it.
  if (value === null) {
    return {
      value: null,
      isEmptyValue: true
    }
  }

  // Value is not empty.
  // Validate it and return.

  // Perform `oneOf` validation.
  if (schemaEntry.oneOf) {
    const errorAndReason = validateOneOf(result.value, schemaEntry.oneOf)
    if (errorAndReason) {
      return errorAndReason
    }
  }

  // Perform `validate()` validation.
  if (schemaEntry.validate) {
    try {
      schemaEntry.validate(result.value)
    } catch (error) {
      return { error: error.message }
    }
  }

  // Return the value.
  return {
    value: result.value,
    isEmptyValue: isEmptyValue(result.value)
  }
}

function validateOneOf(value, oneOf) {
  if (oneOf.indexOf(value) < 0) {
    return { error: 'invalid', reason: 'unknown' }
  }
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
    // Built-in types such as `Number` or `Date` may also report
    // a specific `reason` of the error.
    if (error.reason) {
      result.reason = error.reason;
    }
    return result
  }
}

// Extracts a substring from a string.
export function getNextSubstring(string, separatorCharacter, startIndex) {
  let i = 0
  let substring = ''
  while (startIndex + i < string.length) {
    const character = string[startIndex + i]
    if (character === separatorCharacter) {
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
export function parseSeparatedSubstrings(string, separatorCharacter) {
  const elements = []
  let index = 0
  while (index < string.length) {
    const [substring, length] = getNextSubstring(string, separatorCharacter, index)
    index += length + separatorCharacter.length
    elements.push(substring.trim())
  }
  return elements
}

function transformValue(value, isEmptyValue, path, options) {
  if (isEmptyValue) {
    if (isObject(value)) {
      return options.transformEmptyObject(value, { path })
    } else if (Array.isArray(value)) {
      return options.transformEmptyArray(value, { path })
    }
  }
  return value
}

function getPropertyPath(propertyName, parentObjectPath) {
  return `${parentObjectPath ? parentObjectPath + '.' : ''}${propertyName}`
}

// Recursively runs `required` validations for the parsed data row tree.
function runPendingRequiredValidations(
  schemaEntry,
  value,
  isEmptyValue,
  errors,
  children,
  parentObjectIsRequired,
  parentObjectValue,
  parentObjectValueIsEmpty,
  parentObjectErrors
) {
  let requiredErrors = []

  // See if this property is required.
  const isRequired = isPropertyRequired(
    schemaEntry,
    parentObjectIsRequired,
    parentObjectValue,
    parentObjectValueIsEmpty,
    parentObjectErrors
  )

  // If this property is required and empty, create a "required" error.
  if (isRequired && isEmptyValue) {
    requiredErrors.push(createError({
      error: 'required',
      column: schemaEntry.column,
      valueType: schemaEntry.type,
      value
    }))
  }

  // Run `required` validations of the children.
  if (children) {
    for (const child of children) {
      const requiredErrorsOfChild = runPendingRequiredValidations(
        child.schemaEntry,
        child.value,
        child.isEmptyValue,
        child.errors,
        child.children,
        // The following properties describe the parent object of the `child`,
        // i.e. the current (iterated) object.
        isRequired,
        value,
        isEmptyValue,
        errors
      )
      if (requiredErrorsOfChild) {
        requiredErrors = requiredErrors.concat(requiredErrorsOfChild)
      }
    }
  }
  if (requiredErrors.length > 0) {
    return requiredErrors
  }
}

function isPropertyRequired(
  schemaEntry,
  parentObjectIsRequired,
  parentObjectValue,
  parentObjectValueIsEmpty,
  parentObjectErrors
) {
  // If the parent object is marked as `required: false` then it's allowed
  // to be absent entirely from the input data. If that's the case,
  // i.e. if the parent object is absent entirely from the input data,
  // then any descendant properties of such object are allowed to be absent too,
  // which means that they should also be considered being `required: false`.
  //
  // Also, if the parent object couldn't be parsed due to some non-`required` errors,
  // it can't be known whether it's actually empty or not. In case of such uncertainty,
  // the code shouldn't attempt to be overly smart and do things that might not be necessary,
  // so such parent object is just assumed to be empty in order to not falsly trigger
  // any `required` validations that otherwise wouldn't have been run.
  // In other words, skipping some `required` validations is better than
  // running `required` validations that shouldn't have been run.
  //
  if (parentObjectIsRequired === false && (parentObjectValueIsEmpty || parentObjectErrors)) {
    return false
  }

  return schemaEntry.required && (
    typeof schemaEntry.required === 'boolean'
      ? schemaEntry.required
      : (
        // If there were any non-`required` errors when parsing the parent object,
        // the `parentObject` will be `undefined`. In that case, "complex" `required()`
        // validations — the ones where `required` is a function — can't really be run
        // because those validations assume a fully and correctly parsed parent object
        // be passed as an argument, and the thing is that the `parentObject` is unknown.
        // As a result, only "basic" `required` validations could be run,
        // i.e. the ones where `required` is just a boolean, and "complex" `required`
        // validations, i.e. the ones where `required` is a functions, should be skipped,
        // because it's better to skip some `required` errors than to trigger falsy ones.
        parentObjectErrors ? false : schemaEntry.required(parentObjectValue)
      )
  )
}

function createError({
  column,
  valueType,
  value,
  error: errorMessage,
  reason
}) {
  const error = {
    error: errorMessage,
    column,
    value
  }
  if (reason) {
    error.reason = reason
  }
  // * Regular values specify a `type?` property, which is included in the `error` object.
  // * Nested objects specify a `schema` property, which is not included in the `error` object.
  if (valueType) {
    error.type = valueType
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

  // A nested object could have a `required` property but the only allowed value is `false`.
  // The reason why `true` value is not allowed is because in case of a "required" error
  // there's no single column title corresponding to such nested object, and column title
  // is required to create a "required" error.
  validateObjectSchemaRequiredProperty(schema, undefined)
}

function validateObjectSchemaRequiredProperty(schema, required) {
  if (required !== undefined && required !== false) {
    throw new Error(`In a schema, a nested object can have a \`required\` property but the only allowed value is \`undefined\` or \`false\`. Otherwise, a "required" error for a nested object would have to include a specific \`column\` title and a nested object doesn't have one. You've specified the following \`required\`: ${required}`)
  }
  // For each property of the described object.
  for (const key of Object.keys(schema)) {
    // If this property is itself an object.
    if (isObject(schema[key].schema)) {
      // Validate that a `column` property can't coexist with a `schema` property.
      if (schema[key].column) {
        throw new Error(`In a schema, \`column\` property is only allowed when describing a property value rather than a nested object. Key: ${key}. Schema:\n${JSON.stringify(schema[key], null, 2)}`)
      }
      // Recurse into the child object.
      validateObjectSchemaRequiredProperty(schema[key].schema, schema[key].required)
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
  separatorCharacter: ','
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

// This `value` marks the start of a tree structure that is parsed from a given data row.
const PARSED_OBJECT_TREE_START = {}

const objectConstructor = {}.constructor

function isObject(object) {
  return object !== undefined && object !== null && object.constructor === objectConstructor
}