# `read-excel-file`

Read `*.xlsx` files of moderate size in a web browser or on a server.

It also supports parsing spreadsheet rows into JSON objects using a [schema](#schema).

[Demo](https://catamphetamine.gitlab.io/read-excel-file/)

Also check out [`write-excel-file`](https://www.npmjs.com/package/write-excel-file) for writing `*.xlsx` files.

## Install

```js
npm install read-excel-file --save
```

Alternatively, one could [include it on a web page directly via a `<script/>` tag](#cdn).

## Use

### Browser

Example 1: User chooses a file and the web application reads it.

```html
<input type="file" id="input" />
```

```js
import readXlsxFile from 'read-excel-file'

const input = document.getElementById('input')

input.addEventListener('change', () => {
  readXlsxFile(input.files[0]).then((rows) => {
    // `rows` is an array of "rows".
    // Each "row" is an array of "cells".
    // Each "cell" is a value: string, number, Date, boolean.
  })
})
```

Example 2: Application fetches a file from a URL and reads it.

```js
fetch('https://example.com/spreadsheet.xlsx')
  .then(response => response.blob())
  .then(blob => readXlsxFile(blob))
  .then((rows) => {
    // `rows` is an array of "rows".
    // Each "row" is an array of "cells".
    // Each "cell" is a value: string, number, Date, boolean.
  })
```

In summary, it can read data from a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File), a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) or an [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).

Note: Internet Explorer 11 is an old browser that doesn't support [`Promise`](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise) and would require a [polyfill](https://www.npmjs.com/package/promise-polyfill) to work.

### Node.js

Example 1: Read data from a file at file path.

```js
// Import from '/node' subpackage.
const readXlsxFile = require('read-excel-file/node')

// Read data from a file by file path.
readXlsxFile('/path/to/file').then((rows) => {
  // `rows` is an array of "rows".
  // Each "row" is an array of "cells".
  // Each "cell" is a value: string, number, Date, boolean.
})
```

Example 2: Read data from a [`Stream`](https://nodejs.org/api/stream.html)

```js
// Read data from a `Stream`.
readXlsxFile(fs.createReadStream('/path/to/file')).then((rows) => {
  // `rows` is an array of "rows".
  // Each "row" is an array of "cells".
  // Each "cell" is a value: string, number, Date, boolean.
})
```

Example 3: Read data from a [`Buffer`](https://nodejs.org/api/buffer.html).

```js
// Read data from a `Buffer`.
readXlsxFile(Buffer.from(fs.readFileSync('/path/to/file'))).then((rows) => {
  // `rows` is an array of "rows".
  // Each "row" is an array of "cells".
  // Each "cell" is a value: string, number, Date, boolean.
})
```

In summary, it can read data from a file path, a [`Stream`](https://nodejs.org/api/stream.html) or a [`Buffer`](https://nodejs.org/api/buffer.html).

### Web Worker

Example 1: User chooses a file and the web application reads it in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) to avoid freezing the UI on large files.

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
// Import from '/web-worker' subpackage.
import readXlsxFile from 'read-excel-file/web-worker'

onmessage = function(event) {
  readXlsxFile(event.data).then((rows) => {
    // `rows` is an array of "rows".
    // Each "row" is an array of "cells".
    // Each "cell" is a value: string, number, Date, boolean.
    postMessage(rows)
  })
}
```

## Multiple Sheets

By default, it only reads the first "sheet" in the file. If you have multiple sheets in your file then pass either a sheet number (starting from `1`) or a sheet name in the `options` argument.

Example 1: Reads the second sheet.

```js
readXlsxFile(file, { sheet: 2 }).then((data) => {
  ...
})
```

Example 2: Reads the sheet called "Sheet1".

```js
readXlsxFile(file, { sheet: 'Sheet1' }).then((data) => {
  ...
})
```

To get the names of all available sheets, use `readSheetNames()` function:

```js
// Depending on where your code runs, import it from
// 'read-excel-file' or 'read-exel-file/node' or 'read-excel-file/web-worker'.
import { readSheetNames } from 'read-excel-file'

readSheetNames(file).then((sheetNames) => {
  // sheetNames === ['Sheet1', 'Sheet2']
})
```

## Dates

`*.xlsx` file format originally had no dedicated "date" type, so dates are in almost all cases stored simply as numbers, equal to the count of days since `01/01/1900`. To correctly interpret such numbers as dates, each date cell has a special ["format"](https://xlsxwriter.readthedocs.io/format.html#format-set-num-format) (example: `"d mmm yyyy"`) that instructs the spreadsheet viewer application to format the number in the cell as a date in a given format.

When using `readXlsxFile()` with a [`schema`](#schema) parameter, all columns having `type: Date` are automatically parsed as dates.

When using `readXlsxFile()` without a `schema` parameter, it attempts to guess whether the cell value is a date or a number by looking at the cell's "format" — if the "format" is one of the [standard date formats](https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.numberingformat?view=openxml-2.8.1) then the cell value is interpreted as a date. So usually there's no need to configure anything and it usually works out-of-the-box.

Sometimes though, an `*.xlsx` file might use a non-standard date format like `"mm/dd/yyyy"`. To read such files correctly, pass a `dateFormat` parameter to tell it to parse cells having such "format" as date cells.

```js
readXlsxFile(file, { dateFormat: 'mm/dd/yyyy' })
```

## Numbers

In `*.xlsx` files, numbers are stored as strings. `read-excel-file` manually parses such numeric cell values from strings to numbers. But there's an inherent issue with javascript numbers in general: their [floating-point precision](https://www.youtube.com/watch?v=2gIxbTn7GSc) might not be enough for applications that require 100% precision. An example would be finance and banking. To support such demanding use-cases, this library supports passing a custom `parseNumber(string)` function as an option.

Example: Use "decimals" to represent numbers with 100% precision in banking applications.

```js
import Decimal from 'decimal.js'

readXlsxFile(file, {
  parseNumber: (string) => new Decimal(string)
})
```

## Strings

By default, it automatically trims all string cell values. To disable this feature, pass `trim: false` option.

```js
readXlsxFile(file, { trim: false })
```

## Formulas

Dynamically calculated cells using formulas (`SUM`, etc) are not supported.

## Performance

There have been some reports about performance issues when reading extremely large `*.xlsx` spreadsheets using this library. It's true that this library's main point have been usability and convenience, and not performance when handling huge datasets. For example, the time of parsing a file with 100,000 rows could be up to 10 seconds. If your application has to quickly read huge datasets, perhaps consider using something like [`xlsx`](https://github.com/catamphetamine/read-excel-file/issues/38#issuecomment-544286628) package instead. There're no comparative benchmarks between the two packages, so we don't know how much the difference would be. If you'll be making any benchmarks, share those in the "Issues" so that we could include them in this readme.

## Schema

To read spreadsheet data and then convert each row to a JSON object, pass a `schema` option to `readXlsxFile()`. When doing so, instead of returning an array of rows of cells, it will return an object of shape `{ rows, errors }` where `rows` is gonna be an array of JSON objects created from the spreadsheet rows according to the `schema`, and `errors` is gonna be an array of any errors encountered during the conversion.

The spreadsheet should adhere to a certain structure: first goes a header row with only column titles, rest are the data rows.

The `schema` should describe every property of the JSON object:

* what is the property name
* what column to read the value from
* how to validate the value
* how to parse the value

A key of a `schema` entry represents the name of the property. The value of the `schema` entry describes the rest:

* `column` — The title of the column to read the value from.
  * If the column is missing from the spreadsheet, the property value will be `undefined`.
    * This can be overridden by passing `schemaPropertyValueForMissingColumn` option. Is `undefined` by default.
  * If the column is present in the spreadsheet but is empty, the property value will be `null`.
    * This can be overridden by passing `schemaPropertyValueForMissingValue` option. Is `null` by default.
* `required` — (optional) Is the value required?
  * Could be one of:
    * `required: boolean`
      * `true` — The column must not be missing from the spreadsheet and the cell value must not be empty.
      * `false` — The column can be missing from the spreadsheet and the cell value can be empty.
    * `required: (object) => boolean` — A function returning `true` or `false` depending on the other properties of the object.
  * It could be configured to skip `required` validation for missing columns by passing `schemaPropertyShouldSkipRequiredValidationForMissingColumn` function as an option. By default it's `(column, { object }) => false` meaning that when `column` is missing from the spreadsheet, it will not skip `required` validation for it.
* `validate(value)` — (optional) Validates the value. Is only called for non-empty cells. If the value is invalid, this function should throw an error.
* `schema` — (optional) If the value is an object, `schema` should describe its properties.
  * If all of its property values happen to be empty (`undefined` or `null`), the object itself will be `null` too.
    * This can be overridden by passing `getEmptyObjectValue(object, { path? })` function as an option. By default, it returns `null`.
* `type` — (optional) If the value is not an object, `type` should describe the type of the value. It defines how the cell value will be converted to the property value. If no `type` is specified then the cell value is returned "as is": as a string, number, date or boolean.
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
      * A function that receives a cell value and returns a parsed value. If the value is invalid, it should throw an error.
  * If the cell value consists of comma-separated values (example: `"a, b, c"`) then `type` could be specified as `[type]` for any of the valid `type`s described above.
    * Example: `{ type: [String] }` or `{ type: [(value) => parseValue(value)] }`
    * If the cell value is empty, or if every element of the array is `null` or `undefined`, then the array property value is gonna be `null` by default.
      * This can be overridden by passing `getEmptyArrayValue(array, { path })` function as an option. By default, it returns `null`.

If there're any errors during the conversion of spreadsheet data to JSON objects, the `errors` property returned from the function will be a non-empty array. Each `error` object has properties:

* `error: string` — The error code. Examples: `"required"`, `"invalid"`.
  * If a custom `validate()` function is defined and it throws a `new Error(message)` then the `error` property will be the same as the `message` value.
  * If a custom `type()` function is defined and it throws a `new Error(message)` then the `error` property will be the same as the `message` value.
* `reason?: string` — An optional secondary error code providing more details about the error: "`error.error` because `error.reason`". Currently, it's only returned for standard `type`s.
  * Example: `{ error: "invalid", reason: "not_a_number" }` for `type: Number` means that "the cell value is _invalid_ **because** it's _not a number_".
* `row: number` — The row number in the original file. `1` means the first row, etc.
* `column: string` — The column title.
* `value?: any` — The cell value.
* `type?: any` — The `type` of the property, as defined in the `schema`.

Below is an example of using a `schema`.

```js
// An example *.xlsx document:
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

readXlsxFile(file, { schema }).then(({ rows, errors }) => {
  // `errors` list items have shape: `{ row, column, error, reason?, value?, type? }`.
  errors.length === 0

  rows === [{
    date: new Date(2018, 2, 24),
    numberOfStudents: 10,
    course: {
      isFree: true,
      title: 'Chemistry'
    },
    contact: '+11234567890',
    status: 'SCHEDULED'
  }]
})
```

#### Schema: Tips and Features

<!-- If no `type` is specified then the cell value is returned "as is": as a string, number, date or boolean. -->

<!-- There are also some additional exported `type`s available: -->

<details>
<summary>How to transform cell value using a <strong>custom <code>type</code></strong> function.</summary>

#####

Here's an example of a custom `type` parsing function. It will only be called for a non-empty cell and will transform the cell value.

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

<!--
<details>
<summary>How to <strong>not skip empty rows</strong>.</summary>

#####

By default, it skips any empty rows. To disable that behavior, pass `ignoreEmptyRows: false` option.

```js
readXlsxFile(file, {
  schema,
  ignoreEmptyRows: false
})
```
</details>
-->

<details>
<summary>A <strong>React component for displaying errors</strong> that occured during schema parsing/validation.</summary>

#####

```js
import { parseExcelDate } from 'read-excel-file'

function ParseExcelFileErrors({ errors }) {
  return (
    <ul>
      {errors.map((error, i) => (
        <li key={i}>
          <ParseExcelFileError error={error}>
        </li>
      ))}
    </ul>
  )
}

function ParseExcelFileError({ error: errorDetails }) {
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

## Fix Spreadsheet Before Parsing With Schema

Sometimes, a spreadsheet doesn't have the required structure to parse it with `schema`. For example, header row might be missing, or there could be some purely presentational / empty / "garbage" rows that should be removed before parsing. To fix that, pass a `transformData(data)` function as an option. It will modify spreadsheet content before it is parsed with `schema`.

```js
readXlsxFile(file, {
  schema,
  transformData(data) {
    // Example 1: Add a missing header row.
    return [['ID', 'NAME', ...]].concat(data)
    // Example 2: Remove empty rows.
    return data.filter(row => row.some(cell => cell !== null))
  }
})
```
</details>

## CDN

To include this library directly via a `<script/>` tag on a page, one can use any npm CDN service, e.g. [unpkg.com](https://unpkg.com) or [jsdelivr.net](https://jsdelivr.net)

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
