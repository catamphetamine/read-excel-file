import parseXlsx from '../source/read/readXlsxFileNode.js'

const sheetsDir = './test/spreadsheets'

const sheets = {
  'excel_mac_2011-basic.xlsx': [ [ 'One', 'Two' ], [ 'Three', 'Four' ] ],
  'excel_mac_2011-formatting.xlsx': [ [ 'Hey', 'now', 'so' ], [ 'cool', null, null ] ],
  'excel_multiple_text_nodes.xlsx': [ [ 'id', 'memo' ], [ 1, 'abc def ghi' ], [ 2, 'pqr stu' ] ]
}

describe('read-excel-file', function() {
  for (const filename in sheets) {
    // Creates a javascript "closure".
    // Otherwise, in every test, `expected` variable value would be equal
    // to the last `for` cycle's `expected` variable value.
    (function(filename, expected) {
      describe(filename + ' basic test', function() {
        it('should return the right value', async function() {
          const result = await parseXlsx(sheetsDir + '/' + filename)
          expect(result).to.deep.equal(expected)
        })
        it('should return the right value with the sheet specified', async function() {
          const result = await parseXlsx(sheetsDir + '/' + filename, '1')
          expect(result).to.deep.equal(expected)
        })
      })
    })(filename, sheets[filename])
  }
})