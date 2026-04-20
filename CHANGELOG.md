9.0.0 / 18.04.2026
==================

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

8.0.0 / 11.03.2026
==================

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

7.0.1 / 04.03.2026
==================

* [Fixed](https://github.com/catamphetamine/read-excel-file/issues/120) `CellValue` TypeScript type (it didn't include `null` value).

* (TypeScript minor breaking change) Renamed exported `Error` TypeScript interface to `SchemaParseCellValueError`, and removed `CellValue` generic from it.

7.0.0 / 23.02.2026
==================

* Refactored the code.
* (breaking change) The minimum required Node.js version is now >= 18.
  * Nothing really changed in that regard, it's just that the minimum required Node.js version wasn't specified previously, and I just randomly assumed that now it's gonna be >= 18.
* (breaking change) The default export has been removed in order to not confuse people.
* (breaking change) `/browser` export uses [Web Workers](https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Using_web_workers) now to avoid blocking the main thread. I dunno if Internet Explorer is supported now.
* Added new exports: `/browser` and `/universal`.
	* `/universal` works both in a web browser and Node.js. Only accepts a [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob) as an input.
  * `/browser` works in a web browser. It replaced what used to be the default export.
* `/node` export now accepts a [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob) as an input.

6.0.0 / 12.09.2025
==================

* (breaking change) Removed `ignoreEmptyRows: true` option.

* (breaking change) Removed `read-excel-file/schema` subpackage. Removed `read-excel-file/map` subpackage.

* (breaking change) Changed `schema` parsing of empty columns.
  - Old behavior: When parsing with a `schema`, empty columns were `undefined` and missing columns were also `undefined`.
  - New behavior: When parsing with a `schema`, empty columns are `null` and missing columns are still `undefined`.
    - This new behavior works better with Sequelize: when performing an `.update()` of a database record, `null` values (empty columns) will be set to `NULL` while `undefined` values (missing columns) will be ignored and will not be set to `NULL`.
    - The old behavior could be restored by passing `schemaPropertyValueForMissingValue: undefined` option.

* (breaking change) Renamed `schemaEntry.parse` property to `schemaEntry.type`.

* (breaking change) Changed `schema` format:
  - Old behavior: `Object.keys(schema)` were column titles and `schema[key].prop` was the property name.
    - Example: `{ "COLUMN": { prop: "property" } }`
  - New behavior: `Object.keys(schema)` are property names and `schema[key].colum` is the column title.
    - Example: `{ "property": { column: "COLUMN" } }`

* (breaking change) Changed nested `schema` format:
  - Old behavior: `type` property described the schema of the nested object.
    - Example: `{ "NESTED OBJECT": { prop: "nestedObject", type: { "COLUMN": { prop: "property" } } } }`
  - New behavior: `schema` property describes the schema of the nested object.
    - Example: `{ "nestedObject": { "schema": { "property": { column: "COLUMN" } } } }`

* (breaking change) `errors` entries for nested objects now don't have a `type` property.

* (breaking change) Removed `map` option. Use `schema` option instead.

* (breaking change) Renamed option: `schemaPropertyValueForEmptyCell` → `schemaPropertyValueForMissingValue`.

* (breaking change) Removed deprecated option `includeNullValues: true`.

* (breaking change) Renamed `rowMap` / `rowIndexMap` parameters to `rowIndexSourceMap`.

5.8.0 / 01.05.2024
==================

* Added new parameters to replace the old `includeNullValues: true` parameter: `schemaPropertyValueEmptyCellValue`, `schemaPropertyValueForMissingColumn`, `getEmptyObjectValue`. Now `includeNullValues: true` could be replaced with the following combination of parameters:
  * `schemaPropertyValueForMissingColumn: null`
  * `schemaPropertyValueForEmptyCell: null`
  * `getEmptyObjectValue = (object, { path? }) => null`
* Added `schemaPropertyShouldSkipRequiredValidationForMissingColumn: () => boolean` parameter. It is `() => false` by default.
* Added `getEmptyArrayValue: (array, { path }) => any` parameter. It is `() => null` by default.

5.5.0 / 14.09.2022
==================

* [Moved](https://gitlab.com/catamphetamine/read-excel-file/-/issues/62) from `jszip` to `fflate`. Most likely not a "breaking change". See [browser support](https://github.com/101arrowz/fflate/#browser-support).

5.4.3 / 20.07.2022
==================

* [Added](https://gitlab.com/catamphetamine/read-excel-file/-/issues/7) `ignoreEmptyRows: false` option when parsing using a `schema`.

* Changed `errors.row` property when parsing using a `schema`: from "object number" to "spreadsheet row number". Example: was `1` for the first row of data, now is `2` for the first row of data (because `1` now is the header row).

5.4.0 / 04.07.2022
==================

* [Fixed](https://gitlab.com/catamphetamine/read-excel-file/-/issues/54) non-ASCII character encoding by forcing Node.js version of the library to read zipped contents of an XLSX file in UTF-8 character encoding. I suppose it won't break the existing code.

5.3.5 / 26.06.2022
==================

* Added `includeNullValues: true` option when parsing spreadsheet data using a `schema`. By default, it ignores all `null` values (ignores all empty cells).

5.3.4 / 11.06.2022
==================

* Added an optional `reason?: string` property of a with-schema parsing error.

5.3.3 / 24.05.2022
==================

* Added `trim: false` option.

5.3.0 / 18.05.2022
==================

* Migrated to [ES Modules](https://gitlab.com/catamphetamine/read-excel-file/-/issues/44) exports.

5.2.27 / 11.02.2022
==================

* Added `readSheetNames()` function.

5.2.25 / 19.11.2021
==================

* [Fixed](https://github.com/catamphetamine/read-excel-file/issues/102) skipping empty rows and columns at the start.

5.2.22 / 11.11.2021
==================

* [Added](https://github.com/catamphetamine/read-excel-file/issues/100) `/web-worker` export.

5.2.11 / 08.10.2021
==================

* Added TypeScript "typings".

5.2.0 / 17.06.2021
==================

* (internal) Removed `xpath` dependency to reduce bundle size.

* (internal) Removed `xmldom` dependency in the browser to reduce bundle size.

* (internal) Fixed date parser: in previous versions it was setting time to `12:00` instead of `00:00`.

* (internal) `readXlsxFile()`: Added support for `e`, `d`, `z` and `inlineStr` cell types.

5.1.0 / 06.04.2021
==================

  * Simply updated all dependencies to their latest version.

5.0.0 / 27.12.2020
==================

  * `readXlsxFile()` now [doesn't skip](https://gitlab.com/catamphetamine/read-excel-file/-/issues/10) empty rows or columns: it only skips empty rows or columns at the end, but not in the beginning and not in the middle as it used to.

  * Removed `"URL"`, `"Email"`, `"Integer"` types. Use non-string exported ones instead: `URL`, `Email`, `Integer`.

  * Removed undocumented `convertToJson()` export.

  * Removed undocumented `read-excel-file/json` export.

4.1.0 / 09.11.2020
==================

* Renamed schema entry `parse()` function: now it's called `type`. This way, `type` could be both a built-in type and a custom type.

* Changed the built-in `"Integer"`, `"URL"` and `"Email"` types: now they're exported functions again instead of strings. Strings still work.

* Added `map` parameter: similar to `schema` but doesn't perform any parsing or validation. Can be used to map an Excel file to an array of objects that could be parsed/validated using [`yup`](https://github.com/jquense/yup).

* `type` of a schema entry is no longer required: if no `type` is specified, then the cell value is returned "as is" (string, or number, or boolean, or `Date`).

4.0.8 / 08.11.2020
==================

* Updated `JSZip` to the latest version. The [issue](https://gitlab.com/catamphetamine/read-excel-file/-/issues/8). The [original issue](https://github.com/catamphetamine/read-excel-file/issues/54).

4.0.0 / 25.05.2019
==================

  * (breaking change) Turned out that `sheetId` is [not the file name](https://github.com/tidyverse/readxl/issues/104) of the sheet. Instead, the filename of the sheet is looked up by `r:id` (or `ns:id`) in the `xl/_rels/workbook.xml.rels` file. That means that reading Excel file sheets by their numeric `sheet` ID is no longer supported in `readXlsxFile()` and if `sheet` option is specified then it means either "sheet index" (starting from `1`) or "sheet name". Also, removed the old deprecated way of passing `sheet` option directly as `readXlsxFile(file, sheet)` instead of `readXlsxFile(file, { sheet })`.

3.0.1 / 13.05.2019
==================

  * Fixed [IE 11 error](https://github.com/catamphetamine/read-excel-file/issues/26) `"XPathResult is undefined"` by including a polyfill for XPath. This resulted in the browser bundle becoming larger in size by 100 kilobytes.

3.0.0 / 30.06.2018
==================

  * (breaking change) Calling this library with `getSheets: true` option now returns an array of objects of shape `{ name }` rather than an object of shape `{ [id]: 'name' }`. Same's for calling this library with `properties: true` option.

  * (breaking change) Previous versions returned empty data in case of an error. Now if there're any errors they're thrown as-is and not suppressed.

  * (unlikely breaking change) Previous versions read the `sheet` having ID `1` by default. It was [discovered](https://github.com/catamphetamine/read-excel-file/issues/24) that this could lead to unintuitive behavior in some Excel editors when sheets order is changed by a user: in some editors a sheet with ID `1` could be moved to, for example, the second position, and would still have the ID `1` so for such Excel files by default the library would read the second sheet instead of the first one which would result in confusing behavior. In any case, numerical sheet IDs are inherently internal to the Excel file structure and shouldn't be externalized in any way (in this case, in the code reading such files) so the library now still accepts the numerical `sheet` parameter but rather than being interpreted as a numerical sheet ID it's now interpreted as a numerical sheet index (starting from `1`). If your code passes a numerical `sheet` ID parameter to the library then it will most likely behave the same way with the new version because in most cases a numerical sheet ID is the same as a numerical sheet index. This change is very unlikely to break anyone's code, but just to conform with the SEMVER specification this change is released as a "breaking change" because theoretically there could exist some very rare users affected by the change.

  * (very unlikely breaking change) Removed legacy support for numerical `sheet` IDs passed not as numbers but as strings. For example, `sheet: "2"` instead of `sheet: 2`. A string `sheet` parameter is now always treated as a sheet name.

2.0.1 / 26.06.2018
==================

  * Fixed `NaN`s appearing in the input instead of `null`s (and empty columns not being trimmed).

  * Added "smart date parser" which autodetects and parses most date formats.

2.0.0 / 09.06.2018
==================

  * (breaking change) If using `readXlsx()` without `schema` parameter it now parses boolean cell values as `true`/`false` and numerical cell values are now parsed as numbers, and also date cell values are parsed as dates in some cases (numbers otherwise). If using `readXlsx()` with `schema` parameter then there are no breaking changes.

  * Added `dateFormat` parameter (e.g. `mm/dd/yyyy`) for parsing dates automatically when using `readXlsx()` without `schema` parameter.

  * Added `read-excel-file/json` export for `convertToJson()`.

1.3.0 / 11.05.2018
==================

  * Refactored exports.
  * Fixed some empty columns returning an empty string instead of `null`.
  * Added `Integer` type for integer `Number`s. Also `URL` and `Email`.
  * Export `parseExcelDate()` function.
  * If both `parse()` and `type` are defined in a schema then `parse()` takes priority over `type`.

1.2.0 / 25.03.2018
==================

  * Rewrote `schema` JSON parsing.

1.1.0 / 24.03.2018
==================

  * Added `schema` option for JSON parsing.

1.0.0 / 21.03.2018
==================

  * Initial release.