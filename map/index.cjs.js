// This file is deprecated.
// It's the same as `index.cjs`, just with an added `*.js` extension.
// It fixes the issue when some software doesn't see files with `*.cjs` file extensions
// when used as the `main` property value in `package.json`.

exports = module.exports = require('../commonjs/read/schema/convertToJson.js').default
exports['default'] = require('../commonjs/read/schema/convertToJson.js').default