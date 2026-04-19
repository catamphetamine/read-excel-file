exports = module.exports = require('../commonjs/export/readXlsxFileWebWorker.js').default
exports['default'] = require('../commonjs/export/readXlsxFileWebWorker.js').default

exports.readSheet = require('../commonjs/export/readSheetWebWorker.js').default

// `parseSheetData()`
exports.parseSheetData = require('../commonjs/parseSheetData/parseSheetData.js').default
exports.Integer = require('../commonjs/parseSheetData/types/additional/Integer.js').default
exports.Email = require('../commonjs/parseSheetData/types/additional/Email.js').default
exports.URL = require('../commonjs/parseSheetData/types/additional/URL.js').default