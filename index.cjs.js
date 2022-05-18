// This file is deprecated.
// It's the same as `index.cjs`, just with an added `*.js` extension.
// It fixes the issue when some software doesn't see files with `*.cjs` file extensions
// when used as the `main` property value in `package.json`.

exports = module.exports = require('./commonjs/read/readXlsxFileBrowser.js').default
exports['default'] = require('./commonjs/read/readXlsxFileBrowser.js').default
exports.readSheetNames = require('./commonjs/read/readSheetNamesBrowser.js').default
exports.parseExcelDate = require('./commonjs/read/parseDate.js').default
exports.Integer = require('./commonjs/types/Integer.js').default
exports.Email = require('./commonjs/types/Email.js').default
exports.URL = require('./commonjs/types/URL.js').default
