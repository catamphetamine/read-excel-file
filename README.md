# `read-xlsx-file`

Read `*.xlsx` files in a browser or Node.js.

## Install

```js
npm install read-excel-file --save
```

## Browser

Status: currently it's not working in a browser due to a [bug](https://github.com/goto100/xpath/issues/85) in [`xpath`] library.

```html
<input type="file" id="input" />
```

```js
import readXlsxFile from 'read-excel-file'

const input = document.getElementById('input')

input.addEventListener('change', () => {
  readXlsxFile(input.files[0]).then((data) => {
    // `data` is an array of rows
    // each row being an array of cells.
  })
})
```

## Node.js

```js
import readXlsxFile from 'read-excel-file/node'

// File path.
readXlsxFile('/path/to/file').then((data) => {
  // `data` is an array of rows
  // each row being an array of cells.
})

// Readable Stream.
readXlsxFile(fs.createReadStream('/path/to/file')).then((data) => {
  ...
})
```

## Advanced

By default it reads the first sheet in the document. If you have multiple sheets in your spreadsheet then pass the second argument (which is `'1'` by default):

```js
readXlsxFile(selectedFile, '2').then((data) => {
  ...
})
````

## References

This project is based on [`excel`](https://github.com/trevordixon/excel.js) by @trevordixon and [`excel-as-json`](https://github.com/stevetarver/excel-as-json/blob) by @stevetarver.

For XML parsing [`xmldom`](https://github.com/jindw/xmldom) and [`xpath`](https://github.com/goto100/xpath) are used.

## License

[MIT](LICENSE)

