exports = module.exports = require('../commonjs/export/readXlsxFileWebWorker.js').default
exports['default'] = require('../commonjs/export/readXlsxFileWebWorker.js').default

exports.readSheet = require('../commonjs/export/readSheetWebWorker.js').default
exports.InvalidInputError = require('../commonjs/xlsx/file/InvalidInputError.js').default
exports.InvalidSpreadsheetError = require('../commonjs/xlsx/InvalidSpreadsheetError.js').default
exports.SheetNotFoundError = require('../commonjs/xlsx/SheetNotFoundError.js').default

// `parseSheetData()`
exports.parseSheetData = require('../commonjs/parseSheetData/parseSheetData.js').default
exports.Integer = require('../commonjs/parseSheetData/types/additional/Integer.js').default
exports.Email = require('../commonjs/parseSheetData/types/additional/Email.js').default
exports.URL = require('../commonjs/parseSheetData/types/additional/URL.js').default
exports.getColumnTitleForProperty = require('../commonjs/parseSheetData/getColumnTitleForProperty.js').default