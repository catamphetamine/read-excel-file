import json from 'rollup-plugin-json'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

export default [
  {
    input: './modules/read/readXlsxFileBrowser',
    plugins: [
      json(),
      terser(),
      nodeResolve({
        browser: true
      }),
      commonjs()
    ],
    external: [
      // 'react',
      // 'prop-types'
    ],
    output: {
      format: 'umd',
      name: 'readXlsxFile',
      file: 'bundle/read-excel-file.min.js',
      sourcemap: true,
      globals: {
        // 'react': 'React',
        // 'prop-types': 'PropTypes'
      }
    }
  }
]