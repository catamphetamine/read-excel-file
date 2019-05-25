# `read-excel-file`

Read `*.xlsx` files in a browser or Node.js. Parse to JSON with a strict schema.

[Demo](https://catamphetamine.github.io/read-excel-file/)

## Install

```js
npm install read-excel-file --save
```

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

XLSX format has no dedicated "date" type so dates are stored internally as simply numbers along with a "format" (e.g. `"MM/DD/YY"`). When using `readXlsx()` with `schema` parameter all dates get parsed correctly in any case. But if using `readXlsx()` without `schema` parameter (to get "raw" data) then this library attempts to guess whether a cell value is a date or not by examining the cell "format" (e.g. `"MM/DD/YY"`), so in most cases dates are detected and parsed automatically. For exotic cases one can pass an explicit `dateFormat` parameter (e.g. `"MM/DD/YY"`) to instruct the library to parse numbers with such "format" as dates.

## JSON

To convert rows to JSON pass `schema` option to `readXlsxFile()`. It will return `{ rows, errors }` object instead of just `rows`.

```js
// An example *.xlsx document:
// -----------------------------------------------------------------------------
// | START DATE | NUMBER OF STUDENTS | IS FREE | COURSE TITLE |    CONTACT     |
// -----------------------------------------------------------------------------
// | 03/24/2018 |         123        |   true  |  Chemistry   | (123) 456-7890 |
// -----------------------------------------------------------------------------

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
    parse(value) {
      const number = parsePhoneNumber(value)
      if (!number) {
        throw new Error('invalid')
      }
      return number
    }
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
  }]
})
```

There are also some additional exported `type`s:

* `"Integer"` for parsing integer `Number`s.
* `"URL"` for parsing URLs.
* `"Email"` for parsing email addresses.

A schema entry for a column can also have a `validate(value)` function for validating the parsed value. It must `throw` an `Error` if the value is invalid.

A React component for displaying error info could look like this:

```js
import { parseExcelDate } from 'read-excel-file'

function ParseExcelError({ children: error }) {
  // Human-readable value.
  let value = error.value
  if (error.type === Date) {
    value = parseExcelDate(value).toString()
  }
  // Error summary.
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

## Browser compatibility

Node.js `*.xlxs` parser uses `xpath` and `xmldom` packages for XML parsing. The same packages could be used in a browser because [all modern browsers](https://caniuse.com/#search=domparser) (except IE 11) have native `DOMParser` built-in which could is used instead (meaning smaller footprint and better performance) but since Internet Explorer 11 support is still required the browser version doesn't use the native `DOMParser` and instead uses `xpath` and `xmldom` packages for XML parsing just like the Node.js version.

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

## References

For XML parsing [`xmldom`](https://github.com/jindw/xmldom) and [`xpath`](https://github.com/goto100/xpath) are used.

## License

[MIT](LICENSE)

