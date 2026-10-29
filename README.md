# read-excel-file

[![npm version](https://img.shields.io/npm/v/read-excel-file.svg?style=flat-square)](https://www.npmjs.com/package/read-excel-file)
[![npm downloads](https://img.shields.io/npm/dm/read-excel-file.svg?style=flat-square)](https://www.npmjs.com/package/read-excel-file)

Read `.xlsx` files in a browser or Node.js.

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

* If you were using the default exported function:
  * Renamed the default exported function to a named exported function `readSheet`.
    * Old: `import readExcelFile from "read-excel-file/browser"`
    * New: `import { readSheet } from "read-excel-file/browser"`
    * And same for other exports like `"read-excel-file/node"`, etc.
  * The default exported function now returns a different kind of result. Specifically, now it returns all available sheets — an array of objects: `[{ sheet: "Sheet 1", data: [['a1','b1','c1'],['a2','b2','c2']] }, ...]`.
  * The default exported function used to return sheet names when passed `getSheets: true` parameter. Now, instead of that, the default exported function just returns all available sheets, from which one could get the sheet names.

* If you were using `readSheetNames()` function:
  * Removed exported function `readSheetNames()`. Use the default exported function instead. The default exported function now returns all sheets.

* If you were using `parseExcelDate()` function:
  * Removed exported function `parseExcelDate()` because there seems to be no need to have it exported.

* If you were using `schema` parameter:
  * Removed `schema` parameter. Instead, use exported function `parseData(data, schema)` to map data to an array of objects.
    * Old: `import readXlsxFile from "read-excel-file"` and then `const { rows, errors } = await readXlsxFile(..., { schema })`
    * New: `import { readSheet, parseData } from "read-excel-file/browser"` and then `const result = parseData(await readSheet(...), schema)`
      * The `result` of the function is an array where each element represents a "data row" and has shape `{ object, errors }`.
        * Depending on whether there were any errors when parsing a given "data row", either `object` or `errors` property will be `undefined`.
        * The `errors` don't have a `row` property anymore because it could be derived from "data row" number.
          * In version `9.x`, the `row` property has been re-added, so consider migrating straight to `9.x`.
        * In version `9.x`, the returned result of `parseData()` has been changed back to `{ errors, objects }`, so consider migrating straight to `9.x`. In that case, if there're no errors, `errors` will be `undefined`; otherwise, `errors` will be a non-empty array and `objects` will be `undefined`.
        * In version `9.x`, the `schema` parameter was re-added to `readSheet()` function, so consider migrating straight to `9.x`.
  * Renamed some `schema`-related parameters:
    * `schemaPropertyValueForMissingColumn` → `propertyValueWhenColumnIsMissing`
    * `schemaPropertyValueForMissingValue` → `propertyValueWhenCellIsEmpty`
    * `schemaPropertyShouldSkipRequiredValidationForMissingColumn` → (removed)
    * `getEmptyObjectValue` → `transformEmptyObject`
      * The leading `.` character is now removed from the `path` parameter.
    * `getEmptyArrayValue` → `transformEmptyArray`
      * The leading `.` character is now removed from the `path` parameter.
  * Previously, when using a `schema` to parse comma-separated values, it used to ignore any commas that're surrounded by quotes, similar to how it's done in `.csv` files. Now it no longer does that.
  * Previously, when using a `schema` to parse comma-separated values, it used to allow empty-string elements. Now it no longer does that and such empty-string elements will now result in an error with properties: `{ error: "invalid", reason: "syntax" }`.
  * Previously, when using a `schema` to parse `type: Date` properties, it used to support both `Date` objects and numeric timestamps as the input data for the property value. In the latter case, it simply force-converted those numeric timestamps to corresponding `Date` objects. Now `parseData()` function no longer does that, and demands the input data for `type: Date` schema properties to only be `Date` objects, i.e. it shifts the responsibility to interpret date cell values correctly onto `readSheet()` and `readExcelFile()` functions. And I'd personally assume that in any real-world (i.e. non-contrived) scenario those functions would interpret date cell values correctly, so I personally don't consider this a "breaking change". Still, formally, it is a "breaking change" and therefore should be mentioned. So if, for some strange reason, those two functions happen to not recognize a date cell value correctly, `parseData()` function will return an error for such cell: `"not_a_date"`.
  * Previously, when using a `schema` to parse sheet data, and a given row of data was completely empty, it didn't run any `required` property validations. Now it no longer does that and it will run all `required` property validations regardless of whether it's a completely empty row of data or not.

* If you were using `transformData` parameter:
  * Removed `transformData` parameter because the `schema` parameter was extracted into a separate function called `parseData()`. Now, if required, a developer could transform the `data` manually and then pass it to `parseData()` function.

* If you were using `isColumnOriented` parameter:
  * Removed `isColumnOriented` parameter because it seemed to be of no use.

* If you were using `ignoreEmptyRows` parameter:
  * Removed `ignoreEmptyRows` parameter. Passing `ignoreEmptyRows: true` parameter no longer makes it skip empty rows in the middle of a sheet. Now it's always the default behavior, as it used to be: only empty rows at the end of a sheet are ignored.

* If you were using TypeScript:
  * Renamed some of the exported types:
    * `Type` → `ParseDataCustomType`
    * `Error` or `SchemaParseCellValueError` → `ParseDataError`
    * `CellValueRequiredError` → `ParseDataValueRequiredError`
    * `ParsedObjectsResult` → `ParseDataResult`
</details>

<details>
<summary>Migrating from <code>8.x</code> to <code>9.x</code></summary>

######

* If you were using `parseData()` function:
  * Rewrote the code of the `parseData()` function and renamed it to `parseSheetData()`.
  * The result of `parseSheetData()` function is now `{ errors, objects }`. If there're no errors, `errors` will be `undefined`. Otherwise, `errors` will be a non-empty array and `objects` will be `undefined`.
    * Previously the result of `parseSheetData()` function was `[{ errors, object }, ...]`, i.e. the `errors` were split between each particular data row. Now the `errors` are combined for all data rows. The rationale is that it's simpler to handle the result of the function this way.
    * Re-added `row: number` property to the `error` object. It's the number of the data row that caused the error, starting from `1`.
    * Added `columnIndex: number` property to the `error` object.
  * Renamed some of the exported TypeScript types:
    * `ParseDataCustomType` → `ParseSheetDataCustomType`
    * `ParseDataCustomTypeErrorMessage` → `ParseSheetDataCustomTypeErrorMessage`
    * `ParseDataCustomTypeErrorReason` → `ParseSheetDataCustomTypeErrorReason`
    * `ParseDataError` → `ParseSheetDataError`
    * `ParseDataValueRequiredError` → `ParseSheetDataValueRequiredError`
    * `ParseDataResult` → `ParseSheetDataResult`
  * In a `schema`, a nested object could be declared as: `{ required: true/false, schema: { ... } }`. This is still true but the `required` flag is now only allowed to be either `undefined` or `false`, so `true` value is not allowed. The reason is quite simple. If a nested object as a whole is marked as `required: true`, and then it happens to be empty, a `"required"` error should be returned for it. But that error would also have to include a `column` title, and a nested object simply can't be pinned down to a single column in a sheet because it is by definition spread over multiple columns. So instead of marking a nested object as a whole with `required: true`, mark the specific required properties of it.
  * Re-added `schema` parameter to `readSheet()` function.
    * `const { objects, errors } = readSheet(data, { schema })`
</details>

## Install

```js
npm install read-excel-file
```

Alternatively, it could be included on a web page [directly](#cdn) via a `<script/>` tag.

## How to Use

Suppose there's an `.xlsx` file:

| Name       | Date of Birth | Married | Kids |
| ---------- | ------------- | ------- | ---- |
| John Smith | 1/1/1995      | TRUE    | 3    |
| Kate Brown | 3/1/2010      | FALSE   | 0    |

That file could be represented as an array of rows, each row being an array of cells — they call it a "2D array":

```js
[
  ['Name', 'Date of Birth', 'Married', 'Kids'],
  ['John Smith', 1995-01-01T00:00:00.000Z, true, 3],
  ['Kate Brown', 2010-03-01T00:00:00.000Z, false, 0]
]
```

Or it could be represented as an array of JSON objects:

```js
[
  {
    name: 'John Smith',
    dateOfBirth: 1995-01-01T00:00:00.000Z,
    married: true,
    kids: 3
  },
  {
    name: 'Kate Brown',
    dateOfBirth: 2010-03-01T00:00:00.000Z,
    married: false,
    kids: 0
  }
]
```

So we could read it both ways.

First, we'll look at the first approach, then the second.

## Read as 2D Array

Let's say you prefer reading an `.xlsx` file as a 2D array.

Here's how to do it using `readSheet()` function:

```js
import { readSheet } from 'read-excel-file/node'

await readSheet(file) ===
[
  ['Name', 'Date of Birth', 'Married', 'Kids'],
  ['John Smith', 1995-01-01T00:00:00.000Z, true, 3],
  ['Kate Brown', 2010-03-01T00:00:00.000Z, false, 0]
]
```

\* We `import` the function from `read-excel-file/node` because we plan to run it in Node.js. See [all supported environments](#import).

The result is an array of rows. Each row is an array of values — `string`, `number`, `boolean` or `Date`.

<!-- It's same as the default exported function shown above with the only difference that it returns just `data` instead of `[{ name: 'Sheet1', data }]`, so it's just a bit simpler to use. It has an optional second argument — `sheet` — which could be a sheet number (starting from `1`) or a sheet name. By default, it reads the first sheet. -->

If an `.xlsx` file has multiple sheets, then you could pass a second argument — `sheet` — which could be a sheet number (starting from `1`) or a sheet name. By default, it always reads the first sheet.

If an `.xlsx` file has multiple sheets and you need to read all of them, use the default exported function instead of `readSheet()`.

<details>
<summary>Example: Reading all sheets.</summary>

######

```js
import readExcelFile from 'read-excel-file/node'

await readExcelFile(file) ===
[{
  sheet: 'Sheet1',
  data: [
    ['Name', ...],
    ['John Smith', ...],
    ['Kate Brown', ...]
  ]
}, {
  sheet: 'Sheet2',
  data: ...
}]
```
</details>

<!--
The result is a non-empty array of "sheets". Each "sheet" is an object with properties:
* `sheet` — Sheet name.
  * Example: `"Sheet1"`
* `data` — Sheet data. An array of rows. Each row is an array of values — `string`, `number`, `boolean` or `Date`.
  * Example: `[ ['Name','Age'], ['John Smith',30], ['Kate Brown',15] ]`
-->

## Read as Objects

Reading an `.xlsx` file as a 2D array is perfectly fine for a machine or an AI agent but not really  convenient for a human. Humans are more comfortable accessing the data in the form of JSON objects with named properties rather than just "raw" 2D arrays.

So let's say that a sheet that you'd like to read has a simple "table" structure:
* The first row is a "header" row (column titles)
* The other rows are "data" rows (values for those columns)

Like this:

| Name       | Date of Birth | Married | Kids |
| ---------- | ------------- | ------- | ---- |
| John Smith | 1/1/1995      | TRUE    | 3    |
| Kate Brown | 3/1/2010      | FALSE   | 0    |

Then you just define a "schema" for the desired JSON object, i.e. you outline the shape of the desired object, telling it to pull each property from a specific column. Like this:

```js
const schema = {
  name: { column: 'Name' },
  dateOfBirth: { column: 'Date of Birth' },
  married: { column: 'Married' },
  kids: { column: 'Kids' }
}
```

And then pass that `schema` to the <!-- [aforementioned](#read-as-2d-array) --> `readSheet()` function, making it return the data as JSON objects:

```js
const { objects } = await readSheet(file, { schema })
```

```js
objects === [
  {
    name: 'John Smith',
    dateOfBirth: 1995-01-01T00:00:00.000Z,
    married: true,
    kids: 3
  },
  {
    name: 'Kate Brown',
    dateOfBirth: 2010-03-01T00:00:00.000Z,
    married: false,
    kids: 0
  }
]
```

There're also a few more "advanced" features to `schema` such as: support for nested objects, required property validation, value type validation, etc. [Read more](#schema) if you're interested.

## Import

This package provides a separate `import` path for each different environment, as described below.

### `read-excel-file/browser`

Reads an `.xlsx` file in a browser from a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File), a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) or an [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).

Example 1: Read from a selected file.

```html
<input type="file" id="input" />
```

```js
import { readSheet } from 'read-excel-file/browser'

const input = document.getElementById('input')

input.addEventListener('change', () => {
  const data = await readSheet(event.target.files[0])
})
```

Example 2: Read from a URL.

```js
import { readSheet } from 'read-excel-file/browser'

const response = await fetch('https://example.com/spreadsheet.xlsx')
const blob = await response.blob()
const data = await readSheet(blob)
```

<!--
<details>
<summary>Example 3: Using <code>read-excel-file</code> in a Web Worker</summary>

######

`read-excel-file` already uses [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) internally when reading `.xlsx` file contents. This is in order to avoid freezing the UI when reading large files. So using an additional Web Worker on top of that isn't really necessary. But for those who still prefer to manually run `read-excel-file` in their own Web Worker, there's `read-excel-file/web-worker` import path which is same as `read-excel-file/browser` except that it doesn't spawn any Web Workers.
</details>
-->

### `read-excel-file/node`

Reads an `.xlsx` file in Node.js from a file path, a [`Stream`](https://nodejs.org/api/stream.html), a [`Buffer`](https://nodejs.org/api/buffer.html) or a [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob).

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

### `read-excel-file/universal`

Reads an `.xlsx` file in any supported environment, such as a browser or Node.js, but comes with a limitation: it can only read from a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) or an [`ArrayBuffer`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), which could be a bit less convenient for general use.

```js
import { readSheet } from 'read-excel-file/universal'

const data = await readSheet(blob)
```

<!-- ## Worker -->

<!-- XML parser currently doesn't use "workers" and hence it "blocks" the main thread. -->

<!-- Previous inaccurate statement: All exports of `read-excel-file` already use a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) under the hood when reading `.xlsx` file contents. This is in order to avoid freezing the UI when reading large files. So using an additional Web Worker on top of that isn't really necessary. Still, for those who require it, this example shows how a user chooses a file and the web application reads it in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) using `read-excel-file/web-worker` import path. -->

<!--
When reading extremely large `.xlsx` files — say, starting from a [few megabytes](#performance) in size — there's a slight inconvenience of freezing the application while parsing the `.xlsx` file contents.

If your app is designed to deal with such huge files on a regular basis, and the user interface must always stay responsive, then I'd suggest reading `.xlsx` files in a separate [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) using `read-excel-file/web-worker` export.

<details>
<summary>Example: Read a file using <code>read-excel-file/web-worker</code> in a Web Worker in a browser.</summary>

######

```js
const worker = new Worker(new URL('worker.js', import.meta.url))

worker.onmessage = (event) => {
  // File has been read.
  console.log('Sheet data', event.data)
}

worker.onerror = (event) => {
  // Handle errors here.
  console.error(event.error)
}

// "Choose file" button.
const input = document.getElementById('input')

// When user chooses a file, send it to the Web Worker.
input.addEventListener('change', async () => {
  const file = await event.target.files[0].arrayBuffer()
  // Send the `.xlsx` file to the worker.
  // (advanced) One could also pass `transferList` argument here.
  worker.postMessage(file)
})
```

##### `./worker.js`

```js
import { readSheet } from 'read-excel-file/web-worker'

onmessage = async (event) => {
  postMessage(await readSheet(event.data))
}
```
</details>
-->

<!--
######

In Node.js, a very similar API called [Worker Threads](https://nodejs.org/api/worker_threads.html) could be used to prevent "blocking" of the main thread while reading a huge file.

<details>
<summary>Example: Read a file using <code>read-excel-file/node</code> in a Worker Thread in Node.js.</summary>

######

```js
import { Worker } from 'node:worker_threads'

const worker = new Worker(new URL('worker.js', import.meta.url))

worker.on('message', (sheetData) => {
  // File has been read.
  console.log('Sheet data', sheetData)
})

worker.on('error', (error) => {
  // Handle errors here.
  console.error(error)
})

// The server receives an `.xlsx` file.
const file = fs.readFileSync('./spreadsheet.xlsx')

// Send the `.xlsx` file to the worker.
// (advanced) One could also pass `transferList` argument here.
worker.postMessage(file)
```

##### `./worker.js`

```js
import { parentPort } from 'node:worker_threads'

import { readSheet } from 'read-excel-file/node'

parentPort.on('message', async (file) => {
  parentPort.postMessage(await readSheet(file))
})
```
</details>
-->

## Strings

By default, text cell values will be trimmed. To prevent that, pass `trim: false` option.

```js
readExcelFile(file, { trim: false })
```

## Dates

`.xlsx` file format has no type for dates. It simply stores dates as regular numbers, and then assigns a date-specific formatting template to those numbers. So telling a number from a date is not always a trivial task, but so far it seems to work correctly.

<!-- So any `.xlsx` file reader, including this one, has to simply guess if it's a number or a date by analyzing the template. So far, this package seems to guess correctly. -->

<!-- Back in late 2006, when `.xlsx` file format first debuted with Microsoft Office 2007, it had no dedicated "date" type (not until late 2008), so the "date" type was rushed out as just a number with a date-specific formatting style. I guess that it simply copied the way its predecessor — the `.xls` file format — encoded dates. -->

<!-- Now, 20 years later, we're in 2026 and everyone still uses the numeric date format. And the software still has to perform the guesswork to tell if it's a number or a date. -->

<!--
`.xlsx` file format originally had no dedicated "date" type, so dates are in almost all cases stored simply as numbers, equal to the count of days since `01/01/1900` (with a few [quirks](https://www.reddit.com/r/AskStatistics/comments/7uk40z/excel_calculates_dates_wrong_so_please_be_careful/)). To correctly interpret such numbers as dates, each date cell in an `.xlsx` file specifies a certain ["format"](https://xlsxwriter.readthedocs.io/format.html#format-set-num-format) — for example, `"d mmm yyyy"` — that instructs a spreadsheet viewer application to interpret the numeric value in the cell as a date rather than a number, and display it using the specified format.

Being no different from a generic spreadsheet viewer application, this package follows the same practice: it attempts to guess whether a given cell value is a date or a number by looking at the cell's "format" — if the "format" is one of the known [standard date formats](https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.numberingformat?view=openxml-2.8.1) then the cell value is interpreted as a date rather than a number. So usually there's no need to configure anything and it usually "just works" out-of-the-box.

Although there's still a possibility for an `.xlsx` file to specify a totally-custom non-standard date format. In such case, a developer could pass a `dateFormat` parameter to tell this package to parse cells having that specific "format" as date ones rather than numeric ones: `readExcelFile(file, { dateFormat: 'mm/dd/yyyy' })`.
-->

## Numbers

When reading an `.xlsx` file, any numeric values are parsed from a string to a javascript `number`. And that works for everyone, except when you work in science or finance or banking where numbers absolutely need to be 100% precise, in which case this section is for you, otherwise don't even bother reading it.

<details>
<summary>Why javascript numbers aren't 100% precise</summary>

######

"So aren't javascript numbers already 100% precise?", you ask. Here're some rather contrived examples when they aren't:

* `1.0000000000000001` will be rounded to `1`
* `88259496234518.57` will be rounded to `88259496234518.56`
* `99999999999999999999` will be rounded to `100000000000000000000`

You see, javascript numbers inherently come with a limited [floating-point precision](https://www.youtube.com/watch?v=2gIxbTn7GSc), which is apparently not enough in the examples shown above.

So what can one do then? For values that you know absolutely need to be 100% precise, use a custom implementation of "decimal" data type such as [`decimal.js`](https://www.npmjs.com/package/decimal.js). Specifically, pass a custom `parseNumber(string)` function as an option when reading an `.xlsx` file, and it will parse any number from string exactly the way you tell it.

Example 1: Parse any numbers as "decimals", i.e. exactly as they are written in the `.xlsx` file.

```js
import Decimal from 'decimal.js'

readExcelFile(file, {
  parseNumber: (string) => new Decimal(string)
})
```

Example 2: Don't parse any numbers and just leave them as strings.

```js
import Decimal from 'decimal.js'

readExcelFile(file, {
  parseNumber: (string) => string
})
```
</details>

## Formulas

When reading cells that use formulas to calculate their value, it doesn't really evaluate the formula. Instead, it "cheats" by returning the value that is already pre-computed by the spreadsheet editor application. And because this pre-computed value always exists, it just works.

Although I could hypothetically imagine a situation when a file is created not by a spreadsheet editor application, but rather by some hand-made script that doesn't respect this convention and doesn't bother pre-computing formulas, which is totally allowed by the specification, in which case it will simply read such cells as empty ones.

Finally, if a formula can't be evaluated due to an error, such as invalid syntax, or division by zero, or trying to add text to a number, or referenced row or column not found, etc, then such error will be ignored and the cell will be read as empty.

## Errors

### `InvalidInputError`

Sometimes people confuse `.xlsx` files with legacy binary `.xls` ones. The difference might be tricky to spot, so this package explicitly throws an `InvalidInputError` in such (and some other) cases.

* `name` — `"InvalidInputError"`
* `code` — One of:
  * `"INPUT_TYPE_NOT_SUPPORTED"` — The input argument is not of a supported type.
  * `"XLS_FILE_NOT_SUPPORTED"` — The input is a legacy binary `.xls` file (OLE2 Compound File Binary format), which is not supported. Such files should be re-saved in `.xlsx` format in order to be readable by this package.
  * `"FILE_NOT_SUPPORTED"` — The input is neither `.xlsx` nor `.xls` file.
  * `"INVALID_ZIP"` — The input seems to be an `.xlsx` file, and an `.xlsx` file must be a valid ZIP archive, which it isn't.
  * `"NO_DATA"` — The input is empty.

### `InvalidSpreadsheetError`

Will be thrown if there's something wrong with the `.xlsx` file contents while attempting to parse it.

* `name` — `"InvalidSpreadsheetError"`

### `SheetNotFoundError`

Will be thrown if a requested sheet doesn't exist.

* `name` — `"SheetNotFoundError"`
* `sheet` — Sheet name or sheet number
* `sheets` — Available sheet names

## Schema

### Mapping

In its most basic form, a `schema` just maps column titles to property names.

For example, to read a file `dogs.xlsx`:

| Name | Breed           | Gender | Owner Name | Owner Phone  | Owner Address    |
| ---- | --------------- | ------ | ---------- | ------------ | ---------------- |
| Rex  | German Shepherd | M      | John Smith | +12133734253 | East 26th Street |
| Luna | Siberian Husky  | F      | Kate Brown | +19177568000 | West 42nd Street |

One could use the following `schema`:

```js
const schema = {
  name: { column: 'Name' },
  breed: { column: 'Breed' },
  gender: { column: 'Gender' },
  // the owner's info will be put in a nested object, with its own schema
  owner: {
    schema: {
      name: { column: 'Owner Name' },
      phone: { column: 'Owner Phone' },
      address: { column: 'Owner Address' }
    }
  }
}
```

Just pass it to `readSheet()` function:

```js
const { objects } = await readSheet('dogs.xlsx', { schema })
```

And it will return the following `objects`:

```js
objects === [

  // objects[0]:
  {
    name: 'Rex',
    breed: 'German Shepherd',
    gender: 'M',

    owner: {
      name: 'John Smith',
      phone: '+12133734253',
      address: 'East 26th Street'
    }
  },

  // objects[1]:
  {
    name: 'Luna',
    breed: 'Siberian Husky',
    gender: 'F',

    owner: {
      name: 'Kate Brown',
      phone: '+19177568000',
      address: 'West 42nd Street'
    }
  }

]
```

For a given column, the mapping algorithm is:

* If a cell is not empty, cell value becomes the propery value.

* If a cell is empty, the property is set to `null`.
  * This can be overridden by passing `propertyValueWhenCellIsEmpty` option, which is `null` by default.

* If the column is missing, the property is set to `undefined`.
  * This can be overridden by passing `propertyValueWhenColumnIsMissing` option, which is `undefined` by default.

For any object:

* If all properties of such object are `undefined` or `null` then the object itself will be set to `null`.
  * This can be overridden by passing `transformEmptyObject(object, { path? })` function as an option, which by default always returns `null`.
  * This rule applies both to the top-level object, and any of its nested objects.

### Validation

Aside from just mapping, there're also "advanced" features of `schema` such as data validation.

In that case, `readSheet()` returns an object of shape `{ objects, errors }`:
* If there were any errors, `objects` will be `undefined` and `errors` will be a list of errors.
* If there were no errors, `errors` will be `undefined` and `objects` will be a list of objects.

For example, suppose that we'd like to validate that all cell values have the correct type, and all required cells are filled in. All these validation rules will be specified in the `schema`:

```js
const schema = {
  name: {
    column: 'Name',
    type: String, // must be a string
    required: true // is required
  },
  gender: {
    column: 'Gender',
    oneOf: ['M', 'F'] // must be "M" or "F"
  },
  dateOfBirth: {
    column: 'Date of Birth',
    type: Date // must be a date
  }
}
```

The following properties are supported:

* `column` — Column title.
* `type` — (optional) The expected type of the value.
  * Basic types:
    * `String`
    * `Number`
    * `Boolean`
    * `Date`
  * "Utility" types that're exported from this package:
    * `Integer`
    * `Email`
    * `URL`
  * Custom type:
    * A function that takes a cell value and returns any kind of a parsed value.
    * Returning `undefined` will have same effect as returning `null`.
    * It should throw an error if it finds the value invalid.
* `oneOf` — (optional) A list of possible values.
* `validate(value)` — (optional) A function that will be called on the parsed value, when the value is present. It should throw if it finds the value invalid.
* `required` — (optional) Is the value required? Could be one of:
  * `true` — The column must exist and the cell value must not be empty.
  * `false` — The column can be missing and the cell value can be empty.
  * `(object) => boolean` — Could be required or not, depending on the other properties of the object. Must be resolved at runtime.
  <!-- * To skip `required` validation for a column that is missing from a spreadsheet, one could pass `shouldSkipRequiredValidationWhenColumnIsMissing` option. It should be a function: `(columnTitle, { object }) => boolean`. By default it always returns `false` meaning that when `columnTitle` is missing from the spreadsheet, it will not skip performing the `required` validation for it. -->
<!-- * `validate(value)` — (optional) Validates the value. Is only called for non-empty cells. If the value is invalid, this function should throw an error. -->

If it finds any errors when validating the data, the `errors` property returned from the function will be a non-empty array, with each `error` having properties:

* `error` (string) — Error code. Possible values (for a non-custom type): `"required"`, `"invalid"`.
  * If the column uses a custom `type`, then the `error` will be same as the `message` of the error that was thrown by the `type`.
  * If the column uses a custom `validate` function, then the `error` will be same as the `message` of the error that was thrown by the `validate` function.
* `reason` (string) — An optional secondary error code that provides some more details about the error. I.e. "`error.error` happened specifically because of `error.reason`". Currently, it could only be returned from non-custom `type`s.
  * Example: `{ error: "invalid", reason: "not_a_number" }` for a `type: Number` property means that "the cell value is _invalid_ **because** it's _not a number_".
* `row` (number) — Data row number, starting from `1`.
  * `row: 1` means "first row of data", etc.
  * The header row is ignored.
* `column` (string) — Column title.
* `columnIndex` (number) — Column index.
  * `columnIndex: 0` means "first column", etc.
* `value` — Cell value.
* `type` — The `type` of the property, as defined in the `schema`.

<details>
<summary>TypeScript example</summary>

#####

```ts
import type {
  Schema,
  CellValue,
  ParseSheetDataError,
  ParseSheetDataCustomType,
  ParseSheetDataCustomTypeErrorMessage
} from 'read-excel-file/node'

type ColumnTitle = 'COLUMN TITLE 1' | 'COLUMN TITLE 2'

type CustomTypeValue = string

function CustomType(value: CellValue): CustomTypeValue {
  if (typeof value !== 'string') {
    throw new Error('not_a_string')
  }
  return '~' + value + '~'
}

type CustomTypeErrorMessage<Type extends ParseSheetDataCustomType<unknown>> =
  Type extends typeof CustomType
    ? 'not_a_string'
    : never

// type CustomTypeErrorReason<
//   Type extends ParseSheetDataCustomType<unknown>,
//   ErrorMessage extends ParseSheetDataCustomTypeErrorMessage<Type>
// > =
//   Type extends typeof CustomType
//     ? (ErrorMessage extends 'not_a_string' ? undefined : never)
//     : never

type PossibleError = ParseSheetDataError<
  ColumnTitle,
  typeof CustomType,
  CustomTypeErrorMessage<typeof CustomType>
  // CustomTypeErrorReason<typeof CustomType, CustomTypeErrorMessage<typeof CustomType>>
>

interface Object {
  property1: CustomTypeValue;
  property2?: string;
}

const schema: Schema<Object, ColumnTitle> = {
  property1: {
    column: 'COLUMN TITLE 1',
    type: CustomType,
    required: true
  },
  property2: {
    column: 'COLUMN TITLE 2',
    type: String
  }
}

const { objects, errors } = parseSheetData<Object, ColumnTitle, PossibleError>([
  ['COLUMN TITLE 1', 'COLUMN TITLE 2'],
  ['Value 1', 'Value 2']
], schema)

if (errors) {
  for (const error of errors) {
    console.error('Error in data row', error.row, 'column', error.column, ':', error.error, error.reason || '')
  }
} else {
  console.log('Objects', objects)
}
```
</details>

### Validation of Nested Objects

A nested object can be marked as `required: false`. This will allow it to be absent from the sheet, even if some of its properties are defined as `required: true`.

For example, a `schema` could define an optional `secondOwner` nested object using `required: false` flag. If there's no second owner info, that's ok. But if there is, then the second owner's name must be specified, which is expressed by adding `required: true` flag on that property. This will guard against the cases when, for example, the second owner's `phone` is filled in their `name` is left blank — in such case it will throw an error.

```js
const schema = {
  name: { column: 'Name', type: String, required: true },
  breed: { column: 'Breed', type: String },

  owner: {
    schema: {
      name: { column: 'Owner Name', type: String, required: true },
      phone: { column: 'Owner Phone', type: String }
    }
  },

  secondOwner: {
    required: false,
    schema: {
      name: { column: 'Second Owner Name', type: String, required: true },
      phone: { column: 'Second Owner Phone', type: String }
    }
  }
}
```

While a nested object can be defined as `required: false`, it can't be defined as `required: true` because it wouldn't really make sense — just mark the relevant properties of the nested object as `required: true` and that will make the nested object itself required as well.

### Parsing Comma-Separated Values

If some column includes comma-separated values — such as `"a, b, c"` — then you could specify the `type` of the column as an array, and it will first split the value into substrings, and then parse each substring using the specified type.

For example, if a property is defined as `{ type: [String] }` and the cell value is `"a, b, c"` then the property value will become `["a", "b", "c"]`.

Tips:

* If a cell is empty, or if every element of the parsed array is `null` or `undefined`, then the property value itself will be set to `null`.
  * This can be overridden by passing `transformEmptyArray(array, { path })` function as an option. By default, it returns `null`.
* The separator could be specified by passing `arrayValueSeparator` option. By default, it's `","`.
* The separated parts will be trimmed.

### Advanced Validation

This package adheres to the [Unix-way](https://en.wikipedia.org/wiki/Unix_philosophy) philosophy in that it intentionally focuses on a single task — reading an `.xlsx` file — and doesn't wander too far. That's why it only includes the basic validation features, leaving the rest to specialized packages — such as [zod](https://npmjs.com/package/zod) — without leaning toward any particular one.

For example, one could first use `read-excel-file` with a `schema` to read the contents of an `.xlsx` file into an array of JSON objects, and then pass those JSON objects to something like `zod` for data validation. Decoupling validation logic from the task of reading an `.xlsx` file not only unties your hands in using advanced validation features but also opens new possibilities, such as reusing the validation logic on the server side for non-`.xlsx` input.

And in order to map those validation errors back to the spreadsheet's rows and columns, one could use the exported function called `getColumnTitleForProperty(path, schema)` which transforms a property `path` into a column title, such as: `path: ["owner", "name"]` → `column: "Owner Name"`. A column title could then be transformed to column index by looking it up in the `columns` array that is returned from `readSheet()` function.

<!--
  // Tell it to read empty cells as `undefined` rather than `null`.
  // This synergizes better with `zod` because now optional properties can be
  // defined as just `.optional()` rather than `.optional().nullable()`.
  // Or, you could skip these settings, but then you'd have to define any optional
  // `zod` properties as `.optional().nullable()`, which is just a bit more verbose.
  propertyValueWhenCellIsEmpty: undefined,
  transformEmptyObject: () => undefined,
  transformEmptyArray: () => undefined
-->

<details>
<summary>Example: using <code>read-excel-file</code> with <code>zod</code></summary>

######

```js
import { readSheet, getColumnTitleForProperty } from 'read-excel-file'
import * as z from 'zod'

// `read-excel-file` mapping schema
const schema = {
  name: { column: 'NAME' },
  age: { column: 'AGE' }
}

// `zod` schema, which repeats `read-excel-file` mapping schema
const Person = z.object({
  name: z.string(),
  age: z.number().optional().nullable()
})

// Read the contents of an `.xlsx` file into an array of JSON objects
const { objects, errors, columns } = await readSheet('persons.xlsx', { schema })

// If there were any errors while reading JSON objects from the `.xlsx` file
if (errors) {
  // Report just the first error (for simplicity)
  const { error: code, row, column, columnTitle } = errors[0]
  reportError(code, row, column, columnTitle)
}

// Reports an error
function reportError(code, row, column, columnTitle) {
  throw new Error(`Row ${row}. Column ${column}. Column Title "${columnTitle}". Code: "${code}"`)
}

// Validate the JSON objects using `zod` schema
let row = 2 // skips the header row
for (const object of objects) {
  try {
    Person.parse(object)
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convert `zod` error to `read-excel-file` error.
      // Report just the first error (for simplicity)
      const { code, path } = error.issues[0]
      const columnTitle = getColumnTitleForProperty(path, schema)
      if (columnTitle) {
        const column = columns[columnTitle] + 1 // column number
        reportError(code, row, column, columnTitle)
      }
    }
    // For any other errors
    throw error
  }
  row++
}
```
</details>

### Standalone API

For convenience, this package exports the `schema` transformation feature as a separate function called `parseSheetData(sheetData, schema)`.

```js
import { readSheet, parseSheetData } from 'read-excel-file/node'

const schema = { ... }
const sheetData = await readSheet(file)
const { objects, errors } = parseSheetData(sheetData, schema)
if (errors) {
  console.error(errors)
} else {
  console.log(objects)
}
```

## Performance

Here're the results of reading [sample `.xlsx` files](https://examplefile.com/document/xlsx) of different size:

|File Size| Browser  | Node.js  |
|---------|----------|----------|
|   1 MB  | 0.1 sec. | 0.1 sec. |
|  10 MB  | 0.5 sec. | 0.5 sec. |
|  50 MB  | 2.5 sec. | 2.5 sec. |

To run the benchmark in Node.js, clone the repository, download any sample `.xlsx` files to `./test/benchmark` folder, run `npm install` and then `npm run test:benchmark:node`.

To run the benchmark in a web browser, open the demo page, open the console and choose an `.xlsx` file.

<details>
<summary>Performance tips</summary>

######

Reading an `.xlsx` file is performed in 3 steps:

* Step 1. Unzip an `.xlsx` file into a tree of `.xml` files.
* Step 2. Parse sheet data from those `.xml` files.
* Step 3. If `schema` option was passed, use it to transform sheet data rows into JSON objects.

When running in Node.js, the unzip step is outsourced to [`unzipper-esm`](https://www.npmjs.com/package/unzipper-esm) and is "asynchronous" — it uses Node.js "native" `zlib` module which unzips data in a separate thread.

When running in a web browser, the unzip step is outsourced to [fflate](https://npmjs.com/package/fflate) which does it "asynchronously" only for `.xlsx` files larger than `512 KB` (the threshold is [hardcoded](https://github.com/101arrowz/fflate/blob/dcb3714a6c25db3a2748641019c5277413d09714/src/index.ts#L3797-L3804) in `fflate` code).

The XML parsing step is written using [saxen](https://www.npmjs.com/package/saxen) which is a [SAX parser](https://en.wikipedia.org/wiki/Simple_API_for_XML). This step "synchronous".

The last step of transforming sheet data rows to JSON objects is also "synchronous".
</details>

## Browser Support

An `.xlsx` file is just a `.zip` archive with an `.xslx` file extension. This package uses [`fflate`](https://www.npmjs.com/package/fflate) for `.zip` decompression. See `fflate`'s [browser support](https://www.npmjs.com/package/fflate#browser-support) for further details.

## CDN

To include this library directly via a `<script/>` tag on a page, one can use any npm CDN service, e.g. [unpkg.com](https://unpkg.com) or [jsdelivr.com](https://jsdelivr.com)

```html
<script src="https://unpkg.com/read-excel-file@[version]/bundle/read-excel-file.min.js"></script>

<script>
  var input = document.getElementById('input')
  input.addEventListener('change', function() {
    readXlsxFile(event.target.files[0]).then(function(rows) {
      // `rows` is an array of rows
      // each row being an array of cells.
    })
  })
</script>
```

<!--
## Possible Enhancements

### Streaming Decompression

Currently, it reads and unpacks an `.xlsx` file archive "all at once". But it could also do this in a "streaming" fashion. The existing `unzipFromStream.js` function uses [`unzipper-esm`](https://www.npmjs.com/package/unzipper-esm) package and could easily be refactored to return not just the entire `.xlsx` archive contents but instead an `objectMode: true` readable stream of `file` entries, each `file` entry itself being a readable stream of decompressed data. And, considering that the `sheet.xml` parser is already written in a "streaming" fashion, it could synergize well with such "sreaming" decompression. But how much beneficial could it be? I guess, not much. The reason is that `.xlsx` files aren't that huge, and fitting an `.xlsx` file in memory isn't that big of a deal, considering that the parsed data from that `.xlsx` file would occupy an order of magnitude more RAM. So the effect of such change would be minimal, if not negligible.

Still, if someone decides to flex their intellectual muscle and toy with implementing "streaming" decompression, an `.xlsx` file would have to be read in 3 passes: first read the file paths from `xl/_rels/workbook.xml.rels`, then read "shared strings" and "styles", then read the individual sheet data files. But again, if the file input is a readable stream, it could only be read once, after which it closes. So this type of a "chicken and an egg" dilemma introduced by `.xlsx` file structure specification really makes it cumbersome to parse an `.xlsx` file in a "streaming" fashion rather than "all at once". Specifically, the input argument would have to be passed in the form of a "create readable stream" function rather than just a "readable stream" in order for "streaming" mode to be enabled.

Reading the `.xml` files is implemented in mixed fashion: `sharedStrings.xml` and `sheet{id}.xml` are read in a "streaming" fashion (because those're the largest ones) while other `.xml` files are read in non-"streaming" fashion (for better code readability).

Finally, one could go even further with the "streaming" approach and output not just `Sheet[]` array but an `objectMode: true` stream of `Sheet` objects, the `data` property of each `Sheet` being not just `SheetData = Row[]` but an `objectMode: true` stream of `Row`s.
-->

## Dependencies

* [`fflate`](https://www.npmjs.com/package/fflate) — Unzips `.zip` archives in web browsers.
* [`unzipper-esm`](https://www.npmjs.com/package/unzipper-esm) — Unzips `.zip` archives in Node.js using `stream` API.
* [`saxen`](https://www.npmjs.com/package/saxen) — Parses XML in a streaming fashion.

## Contributors

* [Stian Jensen](https://github.com/stianjensen) — Use `fflate` unzipper on server side ([1](https://github.com/catamphetamine/read-excel-file/pull/122), [2](https://github.com/catamphetamine/read-excel-file/pull/123))
* [Etienne Prothon](https://github.com/EtienneProthon) — Reject non `.xlsx` files, including the legacy binary `.xls` files ([1](https://gitlab.com/catamphetamine/read-excel-file/-/merge_requests/11)). Fix parsing of "encoded" characters ([1](https://gitlab.com/catamphetamine/read-excel-file/-/merge_requests/10)).

## GitHub

On March 9th, 2020, GitHub, Inc. silently [banned](https://medium.com/@catamphetamine/how-github-blocked-me-and-all-my-libraries-c32c61f061d3) my account (erasing all my repos, issues and comments, even in my employer's private repos) without any notice or explanation. Because of that, all source codes had to be promptly moved to GitLab. The [GitHub repo](https://github.com/catamphetamine/read-excel-file) is now only used as a backup (you can star the repo there too), and the primary repo is now the [GitLab one](https://gitlab.com/catamphetamine/read-excel-file). Issues can be reported in any repo.

## License

[MIT](LICENSE)
