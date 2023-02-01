# `read-excel-file`

Read small to medium `*.xlsx` files in a browser or Node.js. Parse to JSON with a strict schema.

[Demo](https://catamphetamine.gitlab.io/read-excel-file/)

Also check out [`write-excel-file`](https://www.npmjs.com/package/write-excel-file) for writing simple `*.xlsx` files.

## Install

```js
npm install read-excel-file --save
```

If you're not using a bundler then use a [standalone version from a CDN](#cdn).

## Use

### Browser

```html
<input type="file" id="input" />
```

```js
import readXlsxFile from 'read-excel-file'

// File.
const input = document.getElementById('input')
input.addEventListener('change', () => {
  readXlsxFile(input.files[0]).then((rows) => {
    // `rows` is an array of rows
    // each row being an array of cells.
  })
})

// Blob.
fetch('https://example.com/spreadsheet.xlsx')
  .then(response => response.blob())
  .then(blob => readXlsxFile(blob))
  .then((rows) => {
    // `rows` is an array of rows
    // each row being an array of cells.
  })

// ArrayBuffer.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
//
// Could be obtained from:
// * File
// * Blob
// * Base64 string
//
readXlsxFile(arrayBuffer).then((rows) => {
  // `rows` is an array of rows
  // each row being an array of cells.
})
```

Note: Internet Explorer 11 requires a `Promise` polyfill. [Example](https://www.npmjs.com/package/promise-polyfill).

### Node.js

```js
const readXlsxFile = require('read-excel-file/node')

// File path.
readXlsxFile('/path/to/file').then((rows) => {
  // `rows` is an array of rows
  // each row being an array of cells.
})

// Readable Stream.
readXlsxFile(fs.createReadStream('/path/to/file')).then((rows) => {
  // `rows` is an array of rows
  // each row being an array of cells.
})

// Buffer.
readXlsxFile(Buffer.from(fs.readFileSync('/path/to/file'))).then((rows) => {
  // `rows` is an array of rows
  // each row being an array of cells.
})
```

### Web Worker

```js
const worker = new Worker('web-worker.js')

worker.onmessage = function(event) {
  // `event.data` is an array of rows
  // each row being an array of cells.
  console.log(event.data)
}

worker.onerror = function(event) {
  console.error(event.message)
}

const input = document.getElementById('input')

input.addEventListener('change', () => {
  worker.postMessage(input.files[0])
})
```

##### `web-worker.js`

```js
import readXlsxFile from 'read-excel-file/web-worker'

onmessage = function(event) {
  readXlsxFile(event.data).then((rows) => {
    // `rows` is an array of rows
    // each row being an array of cells.
    postMessage(rows)
  })
}
```

## JSON

To read spreadsheet data and then convert it to an array of JSON objects, pass a `schema` option when calling `readXlsxFile()`. In that case, instead of returning an array of rows of cells, it will return an object of shape `{ rows, errors }` where `rows` is gonna be an array of JSON objects created from the spreadsheet data according to the `schema`, and `errors` is gonna be an array of errors encountered while converting spreadsheet data to JSON objects.

Each property of a JSON object should be described by an "entry" in the `schema`. The key of the entry should be the column's title in the spreadsheet. The value of the entry should be an object with properties:

* `property` — The name of the object's property.
* `required` — (optional) Required properties can be marked as `required: true`.
* `validate(value)` — (optional) Cell value validation function. Is only called on non-empty cells. If the cell value is invalid, it should throw an error with the error message set to the error code.
* `type` — (optional) The type of the value. Defines how the cell value will be parsed. If no `type` is specified then the cell value is returned "as is": as a string, number, date or boolean. A `type` could be a:
  * Built-in type:
    * `String`
    * `Number`
    * `Boolean`
    * `Date`
  * "Utility" type exported from the library:
    * `Integer`
    * `Email`
    * `URL`
  * Custom type:
    * A function that receives a cell value and returns a parsed value. If the value is invalid, it should throw an error with the error message set to the error code.

Sidenote: When converting cell values to object properties, by default, it skips all `null` values (skips all empty cells). That's for simplicity. In some edge cases though, it may be required to keep all `null` values for all the empty cells. For example, that's the case when updating data in an SQL database from an XLSX spreadsheet using Sequelize ORM library that requires a property to explicitly be `null` in order to clear it during an `UPDATE` operation. To keep all `null` values, pass `includeNullValues: true` option when calling `readXlsxFile()`.

#### `errors`

If there were any errors while converting spreadsheet data to JSON objects, the `errors` property returned from the function will be a non-empty array. An element of the `errors` property contains properties:

* `error: string` — The error code. Examples: `"required"`, `"invalid"`.
  * If a custom `validate()` function is defined and it throws a `new Error(message)` then the `error` property will be the same as the `message` value.
  * If a custom `type()` function is defined and it throws a `new Error(message)` then the `error` property will be the same as the `message` value.
* `reason?: string` — An optional secondary error code providing more details about the error. Currently, it's only returned for "built-in" `type`s. Example: `{ error: "invalid", reason: "not_a_number" }` for `type: Number` means that "the cell value is _invalid_ because it's _not a number_".
* `row: number` — The row number in the original file. `1` means the first row, etc.
* `column: string` — The column title.
* `value?: any` — The cell value.
* `type?: any` — The schema `type` for this column.

#### An example of using a `schema`

```js
// An example *.xlsx document:
// -----------------------------------------------------------------------------------------
// | START DATE | NUMBER OF STUDENTS | IS FREE | COURSE TITLE |    CONTACT     |  STATUS   |
// -----------------------------------------------------------------------------------------
// | 03/24/2018 |         10         |   true  |  Chemistry   | (123) 456-7890 | SCHEDULED |
// -----------------------------------------------------------------------------------------

const schema = {
  'START DATE': {
    // JSON object property name.
    prop: 'date',
    type: Date
  },
  'NUMBER OF STUDENTS': {
    prop: 'numberOfStudents',
    type: Number,
    required: true
  },
  // Nested object example.
  // 'COURSE' here is not a real Excel file column name,
  // it can be any string — it's just for code readability.
  'COURSE': {
    // Nested object path: `row.course`
    prop: 'course',
    // Nested object schema:
    type: {
      'IS FREE': {
        prop: 'isFree',
        type: Boolean
      },
      'COURSE TITLE': {
        prop: 'title',
        type: String
      }
    }
  },
  'CONTACT': {
    prop: 'contact',
    required: true,
    // A custom `type` can be defined.
    // A `type` function only gets called for non-empty cells.
    type: (value) => {
      const number = parsePhoneNumber(value)
      if (!number) {
        throw new Error('invalid')
      }
      return number
    }
  },
  'STATUS': {
    prop: 'status',
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

#### Tips and Features

<!-- If no `type` is specified then the cell value is returned "as is": as a string, number, date or boolean. -->

<!-- There are also some additional exported `type`s available: -->

<details>
<summary><strong>Custom <code>type</code></strong> example.</summary>

#####

```js
{
  'COLUMN_TITLE': {
    // This function will only be called for a non-empty cell.
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
<summary><strong>Ignoring empty rows</strong>.</summary>

#####

By default, it ignores any empty rows. To disable that behavior, pass `ignoreEmptyRows: false` option.

```js
readXlsxFile(file, {
  schema,
  ignoreEmptyRows: false
})
```
</details>

<details>
<summary>How to fix spreadsheet data before <code>schema</code> parsing. For example, <strong>how to ignore irrelevant rows</strong>.</summary>

#####

Sometimes, a spreadsheet doesn't exactly have the structure required by this library's `schema` parsing feature: for example, it may be missing a header row, or contain some purely presentational / irrelevant / "garbage" rows that should be removed. To fix that, one could pass an optional `transformData(data)` function that would modify the spreadsheet contents as required.

```js
readXlsxFile(file, {
  schema,
  transformData(data) {
    // Add a missing header row.
    return [['ID', 'NAME', ...]].concat(data)
    // Remove irrelevant rows.
    return data.filter(row => row.filter(column => column !== null).length > 0)
  }
})
```
</details>

<details>
<summary>
The <strong>function for converting data to JSON objects using a schema</strong> is exported from this library too, if anyone wants it.
</summary>

#####

```js
import convertToJson from "read-excel-file/schema"

// `data` is an array of rows, each row being an array of cells.
// `schema` is a "to JSON" convertion schema (see above).
const { rows, errors } = convertToJson(data, schema)
```
</details>

<details>
<summary>A <strong>React component for displaying errors</strong> that occured during schema parsing/validation.</summary>

#####

```js
import { parseExcelDate } from 'read-excel-file'

function ParseExcelError({ children }) {
  const { type, value, error, reason, row, column } = children

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

## JSON (mapping)

Same as above, but simpler: without any parsing or validation.

Sometimes, a developer might want to use some other (more advanced) solution for schema parsing and validation (like [`yup`](https://github.com/jquense/yup)). If a developer passes a `map` option instead of a `schema` option to `readXlsxFile()`, then it would just map each data row to a JSON object without doing any parsing or validation. Cell values will remain "as is": as a string, number, date or boolean.

```js
// An example *.xlsx document:
// ------------------------------------------------------------
// | START DATE | NUMBER OF STUDENTS | IS FREE | COURSE TITLE |
// ------------------------------------------------------------
// | 03/24/2018 |         10         |   true  |  Chemistry   |
// ------------------------------------------------------------

const map = {
  'START DATE': 'date',
  'NUMBER OF STUDENTS': 'numberOfStudents',
  'COURSE': {
    'course': {
      'IS FREE': 'isFree',
      'COURSE TITLE': 'title'
    }
  }
}

readXlsxFile(file, { map }).then(({ rows }) => {
  rows === [{
    date: new Date(2018, 2, 24),
    numberOfStudents: 10,
    course: {
      isFree: true,
      title: 'Chemistry'
    }
  }]
})
```

## Multiple Sheets

By default, it reads the first sheet in the document. If you have multiple sheets in your spreadsheet then pass either a sheet number (starting from `1`) or a sheet name in the `options` argument.

```js
readXlsxFile(file, { sheet: 2 }).then((data) => {
  ...
})
```

```js
readXlsxFile(file, { sheet: 'Sheet1' }).then((data) => {
  ...
})
```

By default, `options.sheet` is `1`.

To get the names of all sheets, use `readSheetNames()` function:

```js
readSheetNames(file).then((sheetNames) => {
  // sheetNames === ['Sheet1', 'Sheet2']
})
```

## Dates

XLSX format originally had no dedicated "date" type, so dates are in almost all cases stored simply as numbers (the count of days since `01/01/1900`) along with a ["format"](https://xlsxwriter.readthedocs.io/format.html#format-set-num-format) description (like `"d mmm yyyy"`) that instructs the spreadsheet viewer software to format the date in the cell using that certain format.

When using `readXlsx()` with a `schema` parameter, all schema columns having type `Date` are automatically parsed as dates. When using `readXlsx()` without a `schema` parameter, this library attempts to guess whether a cell contains a date or just a number by examining the cell's "format" — if the "format" is one of the [built-in date formats](https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.numberingformat?view=openxml-2.8.1) then such cells' values are automatically parsed as dates. In other cases, when date cells use a non-built-in format (like `"mm/dd/yyyy"`), one can pass an explicit `dateFormat` parameter to instruct the library to parse numeric cells having such "format" as dates:

```js
readXlsxFile(file, { dateFormat: 'mm/dd/yyyy' })
```

## Trim

By default, it automatically trims all string values. To disable this feature, pass `trim: false` option.

```js
readXlsxFile(file, { trim: false })
```

## Transform

Sometimes, a spreadsheet doesn't exactly have the structure required by this library's `schema` parsing feature: for example, it may be missing a header row, or contain some purely presentational / empty / "garbage" rows that should be removed. To fix that, one could pass an optional `transformData(data)` function that would modify the spreadsheet contents as required.

```js
readXlsxFile(file, {
  schema,
  transformData(data) {
    // Add a missing header row.
    return [['ID', 'NAME', ...]].concat(data)
    // Remove empty rows.
    return data.filter(row => row.filter(column => column !== null).length > 0)
  }
})
```
</details>


## Limitations

### Performance

There have been some [reports](https://github.com/catamphetamine/read-excel-file/issues/38#issuecomment-544286628) about performance issues when reading very large `*.xlsx` spreadsheets using this library. It's true that this library's main point have been usability and convenience, and not performance when handling huge datasets. For example, the time of parsing a file with 2000 rows / 20 columns is about 3 seconds. So, for reading huge datasets, perhaps use something like [`xlsx`](https://github.com/catamphetamine/read-excel-file/issues/38#issuecomment-544286628) package instead. There're no comparative benchmarks between the two, so if you'll be making one, share it in the Issues.

### Formulas

Dynamically calculated cells using formulas (`SUM`, etc) are not supported.

## TypeScript

I'm not a TypeScript expert, so the community has to write the typings (and test those). See [example `index.d.ts`](https://github.com/catamphetamine/read-excel-file/issues/71#issuecomment-675140448).

## CDN

One can use any npm CDN service, e.g. [unpkg.com](https://unpkg.com) or [jsdelivr.net](https://jsdelivr.net)

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

## TypeScript

This library comes with TypeScript "typings". If you happen to find any bugs in those, create an issue.

## References

Uses [`xmldom`](https://github.com/jindw/xmldom) for parsing XML.

## GitHub

On March 9th, 2020, GitHub, Inc. silently [banned](https://medium.com/@catamphetamine/how-github-blocked-me-and-all-my-libraries-c32c61f061d3) my account (erasing all my repos, issues and comments, even in my employer's private repos) without any notice or explanation. Because of that, all source codes had to be promptly moved to GitLab. The [GitHub repo](https://github.com/catamphetamine/read-excel-file) is now only used as a backup (you can star the repo there too), and the primary repo is now the [GitLab one](https://gitlab.com/catamphetamine/read-excel-file). Issues can be reported in any repo.

## License

[MIT](LICENSE)

