# `read-excel-file`

Read `.xlsx` files in a browser or in Node.js.

It also supports parsing spreadsheet rows into JSON objects using a [schema](#schema).

[Demo](https://catamphetamine.gitlab.io/read-excel-file/)

Also check out [`write-excel-file`](https://www.npmjs.com/package/write-excel-file) for writing `.xlsx` files.

<details>
<summary>Migrating from <code>6.x</code> to <code>7.x</code></summary>

######

* Renamed the default export `"read-excel-file"` to `"read-excel-file/browser"`, and it uses [Web Workers](https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Using_web_workers) now.
  * Old: `import readExcelFile from "read-excel-file"`
  * New: `import readExcelFile from "read-excel-file/browser"`
* The minimum required Node.js version is 18.
</details>

<details>
<summary>Migrating from <code>7.x</code> to <code>8.x</code></summary>

######

* Renamed the default exported function to a named exported function `readSheet`.
  * Old: `import readExcelFile from "read-excel-file/browser"`
  * New: `import { readSheet } from "read-excel-file/browser"`
  * And same for other exports like `"read-excel-file/node"`, etc.
* The default exported function now returns all sheets in a form of an array of objects: `[{ sheet: "Sheet 1", data: [['a1','b1','c1'],['a2','b2','c2']] }, ...]`.
* Removed `getSheets: true` parameter. The default exported function now returns all sheets.
* Removed exported `readSheetNames()` function. The default exported function now returns all sheets.
* Removed `schema` parameter. Instead, use exported function `parseData(data, schema)` to map data to an array of objects.
  * Old: `import readXlsxFile from "read-excel-file"` and then `const { rows, errors } = await readXlsxFile(..., { schema })`
  * New: `import { readSheet, parseData } from "read-excel-file/browser"` and then `const result = parseData(await readSheet(...), schema)`
    * The `result` of the function is an array where each element represents a "data row" and has shape `{ object, errors }`.
      * Depending on whether there were any errors when parsing a given "data row", either `object` or `errors` property will be `undefined`.
      * The `errors` don't have a `row` property anymore because it could be derived from "data row" number.
* Removed `transformData` parameter because `schema` parameter was removed. A developer could transform the `data` themself and then pass it to `parseData()` function.
* Removed `isColumnOriented` parameter.
* Removed `ignoreEmptyRows` parameter. Empty rows somewhere in the middle are not ignored now.
* Renamed some options that're used when parsing using a `schema`:
	* `schemaPropertyValueForMissingColumn` → `propertyValueWhenColumnIsMissing`
	* `schemaPropertyValueForMissingValue` → `propertyValueWhenCellIsEmpty`
	* `schemaPropertyShouldSkipRequiredValidationForMissingColumn` → (removed)
	* `getEmptyObjectValue` → `transformEmptyObject`
    * The leading `.` character is now removed from the `path` parameter.
	* `getEmptyArrayValue` → `transformEmptyArray`
    * The leading `.` character is now removed from the `path` parameter.
* Previously, when parsing comma-separated values, it used to ignore any commas that're surrounded by quotes, similar to how it's done in `.csv` files. Now it no longer does that.
* Previously, when parsing using a schema, it used to force-convert all `type: Date` schema properties from any numeric cell value to a `Date` with a given timestamp. Now it demands the cell values for all such `type: Date` schema properties to already be correctly recognized as `Date`s when they're returned from `readSheet()` or `readExcelFile()` function. And I'd personally assume that in any sane (non-contrived) real-world usage scenario that would be the case, so it doesn't really seem like a "breaking change". And if, for some strange reason, that happens not to be the case, `parseData()` function will throw an error: `not_a_date`.
* Previously, when parsing using a schema, it used to skip `required` validation for completely-empty rows. It no longer does that.
* Removed exported function `parseExcelDate()` because there seems to be no need to have it exported.
* (TypeScript) Renamed exported types:
  * `Type` → `ParseDataValueType`
  * `Error` or `SchemaParseCellValueError` → `ParseDataError`
  * `CellValueRequiredError` → `ParseDataValueRequiredError`
  * `ParsedObjectsResult` → `ParseDataResult`
</details>

## Performance

Here're the results of reading [sample `.xlsx` files](https://examplefile.com/document/xlsx) of different size:

|File Size| Browser |  Node.js  |
|---------|---------|-----------|
|   1 MB  | 0.2 sec.| 0.25 sec. |
|  10 MB  | 1.5 sec.|    2 sec. |
|  50 MB  | 8.5 sec.|   14 sec. |

## Install

```js
npm install read-excel-file --save
```

Alternatively, one could include it on a web page [directly](#cdn) via a `<script/>` tag.

## Use

The default exported function — let's call it `readExcelFile()` — reads an `.xslx` file and returns a `Promise` that resolves to an array of "sheets". At least one "sheet" always exists. Each "sheet" is an object with properties:
* `sheet` — Sheet name.
  * Example: `"Sheet1"`
* `data` — Sheet data. An array of rows. Each row is an array of values — `string`, `number`, `boolean` or `Date`.
  * Example: `[ ['John Smith',35,true,...], ['Kate Brown',28,false,...], ... ]`

```js
await readExcelFile(file)

// Returns
[{
  sheet: 'Sheet1',
  data: [
    ['John Smith',35,true,...],
    ['Kate Brown',28,false,...],
    ...
  ]
}, {
  sheet: 'Sheet2',
  data: ...
}]
```

In simple cases when there're no multiple sheets in an `.xlsx` file, or if only one sheet in an `.xlsx` file is of any interest, use a named exported function `readSheet()`. It's same as the default exported function shown above with the only difference that it returns just `data` instead of `[{ name: 'Sheet1', data }]`, so it's just a bit simpler to use. It has an optional second argument — `sheet` — which could be a sheet number (starting from `1`) or a sheet name. By default, it reads the first sheet.

```js
await readSheet(file)

// Returns
[
  ['John Smith',35,true,...],
  ['Kate Brown',28,false,...],
  ...
]
```

As for where to `import` those two functions from, the package provides a separate `import` path for each different environment, as described below.

### Browser

It can read a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File), a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) or an [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).

Example: User chooses a file and the web application reads it.

```html
<input type="file" id="input" />
```

```js
import { readSheet } from 'read-excel-file/browser'

const input = document.getElementById('input')

input.addEventListener('change', () => {
  const data = await readSheet(input.files[0])
})
```

Note: Internet Explorer 11 is an old browser that doesn't support [`Promise`](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise), and hence requires a [polyfill](https://www.npmjs.com/package/promise-polyfill).

<details>
<summary>Example 2: Reading from a URL</summary>

######

```js
const response = await fetch('https://example.com/spreadsheet.xlsx')
const block = await response.blob()
const data = await readSheet(blob)
```
</details>

<details>
<summary>Example 3: Using <code>read-excel-file</code> in a Web Worker</summary>

######

All exports of `read-excel-file` already use a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) under the hood when reading `.xlsx` file contents. This is in order to avoid freezing the UI when reading large files. So using an additional Web Worker on top of that isn't really necessary. Still, for those who require it, this example shows how a user chooses a file and the web application reads it in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).

```js
// Step 1: Initialize Web Worker.

const worker = new Worker('web-worker.js')

worker.onmessage = function(event) {
  // `event.data` is a `File`.
  console.log(event.data)
}

worker.onerror = function(event) {
  console.error(event.message)
}

// Step 2: User chooses a file and the application sends it to the Web Worker.

const input = document.getElementById('input')

input.addEventListener('change', () => {
  worker.postMessage(input.files[0])
})
```

##### `web-worker.js`

```js
import { readSheet } from 'read-excel-file/web-worker'

onmessage = async function(event) {
  const sheetData = await readSheet(event.data)
  postMessage(sheetData)
}
```
</details>

### Node.js

It can read a file path, a [`Stream`](https://nodejs.org/api/stream.html), a [`Buffer`](https://nodejs.org/api/buffer.html) or a [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob).

Example 1: Read from a file path.

```js
import { readSheet } from 'read-excel-file/node'

const data = await readSheet('/path/to/file')
```

Example 2: Read from a [`Stream`](https://nodejs.org/api/stream.html)

```js
import { readSheet } from 'read-excel-file/node'

const data = await readSheet(fs.createReadStream('/path/to/file'))
```

### Universal

This one works both in a web browser and Node.js. It can only read from a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) or an [`ArrayBuffer`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), which could be a bit less convenient for general use.

```js
import { readSheet } from 'read-excel-file/universal'

const data = await readSheet(blob)
```

## Strings

By default, it automatically trims all string values. To disable this behavior, pass `trim: false` option.

```js
readExcelFile(file, { trim: false })
```

## Dates

`.xlsx` file format originally had no dedicated "date" type, so dates are in almost all cases stored simply as numbers, equal to the count of days since `01/01/1900` (with a few [quirks](https://www.reddit.com/r/AskStatistics/comments/7uk40z/excel_calculates_dates_wrong_so_please_be_careful/)). To correctly interpret such numbers as dates, each date cell in an `.xlsx` file specifies a certain ["format"](https://xlsxwriter.readthedocs.io/format.html#format-set-num-format) — for example, `"d mmm yyyy"` — that instructs a spreadsheet viewer application to interpret the numeric value in the cell as a date rather than a number, and display it using the specified format.

Being no different from a generic spreadsheet viewer application, this package follows the same practice: it attempts to guess whether a given cell value is a date or a number by looking at the cell's "format" — if the "format" is one of the known [standard date formats](https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.numberingformat?view=openxml-2.8.1) then the cell value is interpreted as a date rather than a number. So usually there's no need to configure anything and it usually "just works" out-of-the-box.

Although there's still a possibility for an `.xlsx` file to specify a totally-custom non-standard date format. In such case, a developer could pass a `dateFormat` parameter to tell this package to parse cells having that specific "format" as date ones rather than numeric ones: `readExcelFile(file, { dateFormat: 'mm/dd/yyyy' })`.

## Numbers

When reading an `.xlsx` file, any numeric values are parsed from a string to a javascript `number`. But there's an inherent issue with javascript `number`s in general — their [floating-point precision](https://www.youtube.com/watch?v=2gIxbTn7GSc) is sometimes less than ideal. For example, `0.1 + 0.2 != 0.3`. Yet, applications in areas such as finance or banking usually require 100% floating-point precision, which is usually worked around by using a custom implementation of a "decimal" data type such as [`decimal.js`](https://www.npmjs.com/package/decimal.js).

This package supports passing a custom `parseNumber(string)` function as an option when reading an `.xlsx` file. By default, it parses a `string` to a javascript `number`, but one could pass any custom implementation.

Example: Use "decimal" data type to perform further calculations on fractional numbers with 100% precision.

```js
import Decimal from 'decimal.js'

readExcelFile(file, {
  parseNumber: (string) => new Decimal(string)
})
```

## Formulas

This package doesn't support reading cells that use formulas to calculate the value: `SUM`, `AVERAGE`, etc.

## Schema

Oftentimes, the task is not just to read the "raw" spreadsheet data but also to convert each row of that data to a JSON object having a certain structure. Because it's such a common task, this package exports a named function `parseData(data, schema)` which does exactly that. It parses sheet data into an array of JSON objects according to a pre-defined `schema` which describes how should a row of data be converted to a JSON object.

```js
import { readSheet, parseData } from "read-excel-file/browser"

const data = await readSheet(file)
const schema = { ... }
for (const { object, errors } of parseData(data, schema)) {
  if (errors) {
    console.error(errors)
  } else {
    console.log(object)
  }
}
```

The `parseData()` function returns an array where each element represents a "data row" and has shape `{ object, errors }`. Depending on whether there were any errors when parsing a given "data row", either `object` or `errors` property will be `undefined`.

The sheet data that is being parsed should adhere to a simple structure: the first row should be a header row with just column titles, and each following row should specify the values for those columns.

The `schema` argument should describe the structure of the resulting JSON objects. An example of a `schema` is provided at the end of this section.

Specifically, a `schema` should be an object having the same keys as a resulting JSON object, with values being nested objects having the following properties:

* `column` — The title of the column to read the value from.
  * If the column is missing from the spreadsheet, the property value will be `undefined`.
    * This can be overridden by passing `propertyValueWhenColumnIsMissing` option. Is `undefined` by default.
  * If the column is present in the spreadsheet but is empty, the property value will be `null`.
    * This can be overridden by passing `propertyValueWhenCellIsEmpty` option. Is `null` by default.
* `required` — (optional) Is the value required?
  * Could be one of:
    * `required: boolean`
      * `true` — The column must not be missing from the spreadsheet and the cell value must not be empty.
      * `false` — The column can be missing from the spreadsheet, or the cell value can be empty.
    * `required: (object) => boolean` — A function returning `true` or `false` depending on the other properties of the object.
  <!-- * To skip `required` validation for a column that is missing from a spreadsheet, one could pass `shouldSkipRequiredValidationWhenColumnIsMissing` option. It should be a function: `(columnTitle, { object }) => boolean`. By default it always returns `false` meaning that when `columnTitle` is missing from the spreadsheet, it will not skip performing the `required` validation for it. -->
* `validate(value)` — (optional) Validates the value. Is only called for non-empty cells. If the value is invalid, this function should throw an error.
* `schema` — (optional) If the value is going to be a nested object, `schema` should describe that nested object.
  * If when parsing such nested object, all of its property values happen to be empty — `undefined` or `null` — then the nested object will be itself set to `null`.
    * This can be overridden by passing `transformEmptyObject(object, { path? })` function as an option. By default, it returns `null`.
    * This applies both to nested objects and to the top-level object itself.
* `type` — (optional) If the value is not going to be a nested object, `type` should describe the type of the value. It will determine how the cell value will be converted to a property value. If no `type` is specified then the property value will be same as the cell value.
  * Valid `type`s:
    * Standard types:
      * `String`
      * `Number`
      * `Boolean`
      * `Date`
    * One of the "utility" types that're exported from this package:
      * `Integer`
      * `Email`
      * `URL`
    * Custom type:
      * A function that receives a cell value and returns any kind of a parsed value. Returning `undefined` will have same effect as returning `null`. If the value is invalid, it should throw an error.
  * If the cell value is comprised of comma-separated values (example: `"a, b, c"`) and if it should be parsed as an array of such values, then the property `type` could be specified as an array — `type: [elementType]` — where `elementType` could be any valid `type` described above. For example, if a property is defined as `{ type: [String] }` and the cell value is `"a, b, c"` then the property value will be parsed as `["a", "b", "c"]`.
    * If the cell is empty, or if every element of the parsed array is `null` or `undefined`, then the property value itself will be set to `null`.
      * This can be overridden by passing `transformEmptyArray(array, { path })` function as an option. By default, it returns `null`.
    * The separator could be specified by passing `arrayValueSeparator` option. By default, it's `","`.
    * The separated parts of a cell value will be trimmed.

If there're any errors during the conversion process, the `errors` property returned from the function will be a non-empty array (by default, it's an empty array). Each `error` object has properties:

* `error: string` — The error code. Examples: `"required"`, `"invalid"`.
  * If a custom `validate()` function is defined and it throws a `new Error(message)` then the `error` property will be the same as the `message` argument.
  * If a custom `type()` function is defined and it throws a `new Error(message)` then the `error` property will be the same as the `message` argument.
* `reason?: string` — An optional secondary error code providing more details about the error. I.e. "`error.error` happened specifically because of `error.reason`". Currently, it could only be returned for the standard `type`s.
  * Example: `{ error: "invalid", reason: "not_a_number" }` for a `type: Number` property means that "the cell value is _invalid_ **because** it's _not a number_".
* `row: number` — The row number, starting from `1`.
  * `row: 1` means "first row of data", etc.
  * Don't mind the header row.
* `column: string` — The column title.
* `value?: any` — The cell value.
* `type?: any` — The `type` of the property, as defined by the `schema`.

Example:

```js
// An example .xlsx document:
// -----------------------------------------------------------------------------------------
// | START DATE | NUMBER OF STUDENTS | IS FREE | COURSE TITLE |    CONTACT     |  STATUS   |
// -----------------------------------------------------------------------------------------
// | 03/24/2018 |         10         |   true  |  Chemistry   | (123) 456-7890 | SCHEDULED |
// -----------------------------------------------------------------------------------------

const schema = {
  date: {
    column: 'START DATE',
    type: Date
  },
  numberOfStudents: {
    column: 'NUMBER OF STUDENTS',
    type: Number,
    required: true
  },
  // Nested object example.
  course: {
    schema: {
      isFree: {
        column: 'IS FREE',
        type: Boolean
      },
      title: {
        column: 'COURSE TITLE',
        type: String
      }
    }
    // required: true/false
  },
  contact: {
    column: 'CONTACT',
    required: true,
    // A custom `type` transformation function can be specified.
    // It will transform the cell value if it's not empty.
    type: (value) => {
      const number = parsePhoneNumber(value)
      if (!number) {
        throw new Error('invalid')
      }
      return number
    }
  },
  status: {
    column: 'STATUS',
    type: String,
    oneOf: [
      'SCHEDULED',
      'STARTED',
      'FINISHED'
    ]
  }
}

const data = await readSheet(file)

const { rows, errors } = parseData(data, schema)

// `errors` list items have shape: `{ row, column, error, reason?, value?, type? }`.
errors.length === 0

rows === [{
  date: new Date(2018, 3 - 1, 24),
  numberOfStudents: 10,
  course: {
    isFree: true,
    title: 'Chemistry'
  },
  contact: '+11234567890',
  status: 'SCHEDULED'
}]
```

<!-- #### Schema: Tips and Features -->

<!-- If no `type` is specified then the cell value is returned "as is": as a string, number, date or boolean. -->

<!-- There are also some additional exported `type`s available: -->

<details>
<summary>An example of a <strong>custom <code>type</code></strong></summary>

#####

Here's an example of a basic custom `type`. It calls a custom `parseValue()` function to parse a cell value, and produces an `"invalid"` error if the value couldn't be parsed. If a cell is empty, it will not be parsed.

```js
{
  property: {
    column: 'COLUMN TITLE',
    type: (value) => {
      try {
        return parseValue(value)
      } catch (error) {
        console.error(error)
        throw new Error('invalid')
      }
    }
  }
}
```
</details>

<!-- A schema entry for a column may also define an optional `validate(value)` function for validating the parsed value: in that case, it must `throw` an `Error` if the `value` is invalid. The `validate(value)` function is only called when `value` is not empty (not `null` / `undefined`). -->

<details>
<summary>An example of a <strong>React component to output <code>errors</code></strong></summary>

#####

```js
function ErrorsList({ errors }) {
  return (
    <ul>
      {errors.map((error, i) => (
        <li key={i}>
          <ErrorItem error={error}>
        </li>
      ))}
    </ul>
  )
}

function ErrorItem({ error: errorDetails }) {
  const { type, value, error, reason, row, column } = errorDetails

  // Error summary.
  return (
    <div>
      <code>"{error}"</code>
      {reason && ' '}
      {reason && <code>("{reason}")</code>}
      {' for value '}
      <code>{stringifyValue(value)}</code>
      {' in column '}
      <code>"{column}"</code>
      {' in row '}
      <code>{row}</code>
      {' of spreadsheet'}
    </div>
  )
}

function stringifyValue(value) {
  // Wrap strings in quotes.
  if (typeof value === 'string') {
    return '"' + value + '"'
  }
  return String(value)
}
```
</details>

## Browser Support

An `.xlsx` file is just a `.zip` archive with an `.xslx` file extension. This package uses [`fflate`](https://www.npmjs.com/package/fflate) for `.zip` decompression. See `fflate`'s [browser support](https://www.npmjs.com/package/fflate#browser-support) for further details.

## CDN

To include this library directly via a `<script/>` tag on a page, one can use any npm CDN service, e.g. [unpkg.com](https://unpkg.com) or [jsdelivr.com](https://jsdelivr.com)

```html
<script src="https://unpkg.com/read-excel-file@5.x/bundle/read-excel-file.min.js"></script>

<script>
  var input = document.getElementById('input')
  input.addEventListener('change', function() {
    readXlsxFile(input.files[0]).then(function(rows) {
      // `rows` is an array of rows
      // each row being an array of cells.
    })
  })
</script>
```

## GitHub

On March 9th, 2020, GitHub, Inc. silently [banned](https://medium.com/@catamphetamine/how-github-blocked-me-and-all-my-libraries-c32c61f061d3) my account (erasing all my repos, issues and comments, even in my employer's private repos) without any notice or explanation. Because of that, all source codes had to be promptly moved to GitLab. The [GitHub repo](https://github.com/catamphetamine/read-excel-file) is now only used as a backup (you can star the repo there too), and the primary repo is now the [GitLab one](https://gitlab.com/catamphetamine/read-excel-file). Issues can be reported in any repo.

## License

[MIT](LICENSE)
