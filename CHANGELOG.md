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