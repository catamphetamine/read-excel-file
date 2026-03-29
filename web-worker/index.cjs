exports = module.exports = require('../commonjs/export/readXlsxFileWebWorker.js').default
exports['default'] = require('../commonjs/export/readXlsxFileWebWorker.js').default

exports.readSheet = require('../commonjs/export/readSheetWebWorker.js').default

// `parseData()`
exports.parseData = require('../commonjs/parseData/parseData.js').default
exports.Integer = require('../commonjs/parseData/types/additional/Integer.js').default
exports.Email = require('../commonjs/parseData/types/additional/Email.js').default
exports.URL = require('../commonjs/parseData/types/additional/URL.js').default