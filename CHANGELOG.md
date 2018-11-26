<!-- 3.0.0 — Don't return empty data in case of an error; throw the error instead. -->

2.0.1 / 26.06.2018
==================

  * Fixed `NaN`s appearing in the input instead of `null`s (and empty columns not being trimmed).

  * Added "smart date parser" which autodetects and parses most date formats.

2.0.0 / 09.06.2018
==================

  * (breaking change) If using `readXlsx()` without `schema` parameter it now parses boolean cell values as `true`/`false` and numerical cell values are now parsed as numbers, and also date cell values are parsed as dates in some cases (numbers otherwise). If using `readXlsx()` with `schema` parameter then there are no breaking changes.

  * Added `dateFormat` parameter (e.g. `MM/DD/YY`) for parsing dates automatically when using `readXlsx()` without `schema` parameter.

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