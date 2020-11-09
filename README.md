# `read-excel-file`

Read small to medium `*.xlsx` files in a browser or Node.js. Parse to JSON with a strict schema.

[Demo](https://catamphetamine.gitlab.io/read-excel-file/)

## Restrictions

There have been some [complaints](https://github.com/catamphetamine/read-excel-file/issues/38#issuecomment-544286628) about this library not being able to handle large `*.xlsx` spreadsheets. It's true that this library's main point have been usability and convenience, and not performance or the ability to handle huge datasets. For example, the time of parsing a 2000 rows / 20 columns file is about 3 seconds, and when parsing a 30k+ rows file, it may throw a `RangeError: Maximum call stack size exceeded`. So, for handling huge datasets, use something like [`xlsx`](https://github.com/catamphetamine/read-excel-file/issues/38#issuecomment-544286628) package instead. This library is suitable for handling small to medium `*.xlsx` files.

## GitHub

On March 9th, 2020, GitHub, Inc. silently [banned](https://medium.com/@catamphetamine/how-github-blocked-me-and-all-my-libraries-c32c61f061d3) my account (and all my libraries) without any notice. I opened a support ticked but they didn't answer. Because of that, I had to move all my libraries to [GitLab](https://gitlab.com/catamphetamine).

## Install

```js
npm install read-excel-file --save
```

If you're not using a bundler then use a [standalone version from a CDN](#cdn).

## Browser

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

## Node.js

```js
const readXlsxFile = require('read-excel-file/node');

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

## Dates

XLSX format has no dedicated "date" type so dates are stored internally as simply numbers along with a "format" (e.g. `"MM/DD/YY"`). When using `readXlsx()` with `schema` parameter all dates get parsed correctly in any case. But if using `readXlsx()` without `schema` parameter (to get "raw" data) then this library attempts to guess whether a cell value is a date or not by examining the cell "format" (e.g. `"MM/DD/YY"`), so in most cases dates are detected and parsed automatically. For exotic cases one can pass an explicit `dateFormat` parameter (e.g. `"MM/DD/YY"`) to instruct the library to parse numbers with such "format" as dates:

```js
readXlsxFile(file, { dateFormat: 'MM/DD/YY' })
```

## JSON

To convert rows to JSON pass `schema` option to `readXlsxFile()`. It will return `{ rows, errors }` object instead of just `rows`.

```js
// An example *.xlsx document:
// -----------------------------------------------------------------------------------------
// | START DATE | NUMBER OF STUDENTS | IS FREE | COURSE TITLE |    CONTACT     |  STATUS   |
// -----------------------------------------------------------------------------------------
// | 03/24/2018 |         123        |   true  |  Chemistry   | (123) 456-7890 | SCHEDULED |
// -----------------------------------------------------------------------------------------

const schema = {
  'START DATE': {
    prop: 'date',
    type: Date
    // Excel stores dates as integers.
    // E.g. '24/03/2018' === 43183.
    // Such dates are parsed to UTC+0 timezone with time 12:00 .
  },
  'NUMBER OF STUDENTS': {
    prop: 'numberOfStudents',
    type: Number,
    required: true
  },
  // 'COURSE' is not a real Excel file column name,
  // it can be any string — it's just for code readability.
  'COURSE': {
    prop: 'course',
    type: {
      'IS FREE': {
        prop: 'isFree',
        type: Boolean
        // Excel stored booleans as numbers:
        // `1` is `true` and `0` is `false`.
        // Such numbers are parsed to booleans.
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
  // `errors` have shape `{ row, column, error, value }`.
  errors.length === 0

  rows === [{
    date: new Date(2018, 2, 24),
    numberOfStudents: 123,
    course: {
      isFree: true,
      title: 'Chemistry'
    },
    contact: '+11234567890',
    status: 'SCHEDULED'
  }]
})
```

If no `type` is specified then the cell value is returned "as is".

There are also some additional exported `type`s:

* `Integer` for parsing integer `Number`s.
* `URL` for parsing URLs.
* `Email` for parsing email addresses.

A schema entry for a column may also define an optional `validate(value)` function for validating the parsed value: in that case, it must `throw` an `Error` if the `value` is invalid.

#### Map

Sometimes, a developer might want to use some other (more advanced) solution for schema parsing and validation (like [`yup`](https://github.com/jquense/yup)). If a developer passes a `map` instead of a `schema` to `readXlsxFile()`, then it would just map each data row to a JSON object without doing any parsing or validation.

```js
// An example *.xlsx document:
// -----------------------------------------------------------------------------------------
// | START DATE | NUMBER OF STUDENTS | IS FREE | COURSE TITLE |    CONTACT     |  STATUS   |
// -----------------------------------------------------------------------------------------
// | 03/24/2018 |         123        |   true  |  Chemistry   | (123) 456-7890 | SCHEDULED |
// -----------------------------------------------------------------------------------------

const map = {
  'START DATE': 'date',
  'NUMBER OF STUDENTS': 'numberOfStudents',
  'COURSE': {
    'course': {
      'IS FREE': 'isFree',
      'COURSE TITLE': 'title'
    }
  },
  'CONTACT': 'contact',
  'STATUS': 'status'
}

readXlsxFile(file, { map }).then(({ rows }) => {
  rows === [{
    date: new Date(2018, 2, 24),
    numberOfStudents: 123,
    course: {
      isFree: true,
      title: 'Chemistry'
    },
    contact: '(123) 456-7890',
    status: 'SCHEDULED'
  }]
})
```

#### Displaying schema errors

A React component for displaying schema parsing/validation errors could look like this:

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

#### Transforming rows/columns before schema is applied

When using a `schema` there's also an optional `transformData(data)` parameter which can be used for the cases when the spreadsheet rows/columns aren't in the correct format. For example, the heading row may be missing, or there may be some purely presentational or empty rows. Example:

```js
readXlsxFile(file, {
  schema,
  transformData(data) {
    // Adds header row to the data.
    return [['ID', 'NAME', ...]].concat(data)
    // Removes empty rows.
    return data.filter(row => row.filter(column => column !== null).length > 0)
  }
})
```

## TypeScript

See [testing `index.d.ts`](https://github.com/catamphetamine/read-excel-file/issues/71#issuecomment-675140448).

## Browser compatibility

Node.js `*.xlxs` parser uses `xpath` and `xmldom` packages for XML parsing. The same packages could be used in a browser because [all modern browsers](https://caniuse.com/#search=domparser) (except IE 11) have native `DOMParser` built-in which could is used instead (meaning smaller footprint and better performance) but since Internet Explorer 11 support is still required the browser version doesn't use the native `DOMParser` and instead uses `xpath` and `xmldom` packages for XML parsing just like the Node.js version.

## Gotchas

### Formulas

Dynamically calculated cells using formulas (`SUM`, etc) are not supported.

## Advanced

By default it reads the first sheet in the document. If you have multiple sheets in your spreadsheet then pass either `sheet: number` (sheet index, starting from `1`) or `sheet: string` (sheet name) as part of the `options` argument (`options.sheet` is `1` by default):

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

To get the list of sheets one can pass `getSheets: true` option:

```js
readXlsxFile(file, { getSheets: true }).then((sheets) => {
  // sheets === [{ name: 'Sheet1' }, { name: 'Sheet2' }]
})
```

## CDN

One can use any npm CDN service, e.g. [unpkg.com](https://unpkg.com) or [jsdelivr.net](https://jsdelivr.net)

```html
<script src="https://unpkg.com/read-excel-file@4.x/bundle/read-excel-file.min.js"></script>

<script>
  var input = document.getElementById('input')
  input.addEventListener('change', function() {
    readXlsxFile(input.files[0]).then(function() {
      // `rows` is an array of rows
      // each row being an array of cells.
    })
  })
</script>
```

## References

For XML parsing [`xmldom`](https://github.com/jindw/xmldom) and [`xpath`](https://github.com/goto100/xpath) are used.

## License

[MIT](LICENSE)

