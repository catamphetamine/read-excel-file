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

const input = document.getElementById('input')

input.addEventListener('change', () => {
  readXlsxFile(input.files[0]).then((rows) => {
    // `rows` is an array of rows
    // each row being an array of cells.
  })
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
  ...
})
```

## JSON

To convert table rows to JSON objects, pass a `schema` option to `readXlsxFile()`. It will return `{ rows, errors }` object instead of just `rows`.

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
  // `errors` list items have shape: `{ row, column, error, value }`.
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

If no `type` is specified then the cell value is returned "as is": as a string, number, date or boolean.

There are also some additional exported `type`s available:

* `Integer` for parsing integer `Number`s.
* `URL` for parsing URLs.
* `Email` for parsing email addresses.

A custom `type` can be defined as a simple function:

```js
// This function will only be called for a non-empty cell.
type: (value) => {
  try {
    return parseValue(value)
  } catch (error) {
    console.error(error)
    throw new Error('invalid')
  }
}
```

A schema entry for a column may also define an optional `validate(value)` function for validating the parsed value: in that case, it must `throw` an `Error` if the `value` is invalid. The `validate(value)` function is only called when `value` is not empty (not `null` / `undefined`).

<details>
<summary>Fixing spreadsheet structure for <code>schema</code> parsing.</summary>

#####

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

<details>
<summary>
The schema conversion function can also be imported standalone, if anyone wants it.
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
<summary>A React component for displaying schema parsing/validation errors.</summary>

#####

```js
import { parseExcelDate } from 'read-excel-file'

function ParseExcelError({ children: error }) {
  // Get a human-readable value.
  let value = error.value
  if (error.type === Date) {
    value = parseExcelDate(value).toString()
  }
  // Render error summary.
  return (
    <div>
      <code>"{error.error}"</code>
      {' for value '}
      <code>"{value}"</code>
      {' in column '}
      <code>"{error.column}"</code>
      {error.type && ' of type '}
      {error.type && <code>"{error.type.name}"</code>}
      {' in row '}
      <code>"{error.row}"</code>
    </div>
  )
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

To get the list of all sheets, pass `getSheets: true` option:

```js
readXlsxFile(file, { getSheets: true }).then((sheets) => {
  // sheets === [{ name: 'Sheet1' }, { name: 'Sheet2' }]
})
```

## Dates

XLSX format originally had no dedicated "date" type, so dates are in almost all cases stored simply as numbers (the count of days since `01/01/1900`) along with a ["format"](https://xlsxwriter.readthedocs.io/format.html#format-set-num-format) description (like `"d mmm yyyy"`) that instructs the spreadsheet viewer software to format the date in the cell using that certain format.

When using `readXlsx()` with a `schema` parameter, all schema columns having type `Date` are automatically parsed as dates. When using `readXlsx()` without a `schema` parameter, this library attempts to guess whether a cell contains a date or just a number by examining the cell's "format" — if the "format" is one of the [built-in date formats](https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.numberingformat?view=openxml-2.8.1) then such cells' values are automatically parsed as dates. In other cases, when date cells use a non-built-in format (like `"mm/dd/yyyy"`), one can pass an explicit `dateFormat` parameter to instruct the library to parse numeric cells having such "format" as dates:

```js
readXlsxFile(file, { dateFormat: 'mm/dd/yyyy' })
```

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

## References

Uses [`xmldom`](https://github.com/jindw/xmldom) for parsing XML.

## GitHub

On March 9th, 2020, GitHub, Inc. silently [banned](https://medium.com/@catamphetamine/how-github-blocked-me-and-all-my-libraries-c32c61f061d3) my account (erasing all my repos, issues and comments, even in my employer's private repos) without any notice or explanation. Because of that, all source codes had to be promptly moved to GitLab. The [GitHub repo](https://github.com/catamphetamine/read-excel-file) is now only used as a backup (you can star the repo there too), and the primary repo is now the [GitLab one](https://gitlab.com/catamphetamine/read-excel-file). Issues can be reported in any repo.

## License

[MIT](LICENSE)

