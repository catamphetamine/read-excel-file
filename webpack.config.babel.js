import webpack from 'webpack'
import path from 'path'

const env = process.env.WEBPACK_ENV

const library_name = 'read-excel-file'
const global_variable_name = 'readXlsxFile'

let output_file
if (env === 'build') {
  output_file = `${library_name}.min.js`
} else {
  output_file = `${library_name}.js`
}

module.exports = 
{
  entry: path.join(__dirname, '/browser.default.js'),
  devtool: 'source-map',
  output:
  {
    path           : path.join(__dirname, '/bundle'),
    filename       : output_file,
    library        : global_variable_name,
    // libraryTarget  : 'umd',
    // umdNamedDefine : true
  },
  module:
  {
    rules:
    [{
      test    : /(\.js)$/,
      loader  : 'babel-loader',
      exclude : /node_modules/
    }]
  },
  externals:
  {
    // // Use external version of React
    // "react"     : "React",
    // "react-dom" : "ReactDOM"
  }
}