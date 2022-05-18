import parseExcel from '../source/read/readXlsxFileNode.js'
import assert from 'assert'

function parseXlsx(path, sheet, callback) {
  if (typeof callback === 'undefined') {
    callback = sheet;
    sheet = '1';
  }
  parseExcel(path, sheet).then((data) => callback(null, data), callback);
}

var sheetsDir = './test/spreadsheets';
var sheets = {
  'excel_mac_2011-basic.xlsx': [ [ 'One', 'Two' ], [ 'Three', 'Four' ] ],
  'excel_mac_2011-formatting.xlsx': [ [ 'Hey', 'now', 'so' ], [ 'cool', null, null ] ],
  'excel_multiple_text_nodes.xlsx': [ [ 'id', 'memo' ], [ '1.0', 'abc def ghi' ], [ '2.0', 'pqr stu' ] ]
};

describe('excel.js', function() {
  for (var filename in sheets) {
    (function(filename, expected) {

      describe(filename + ' basic test', function() {
        it('should return the right value', function(done) {
          parseXlsx(sheetsDir + '/' + filename, function(err, data) {
            assert.deepEqual(data, expected);
            done(err);
          });
        })
        it('should return the right value with the sheet specified', function(done) {
          parseXlsx(sheetsDir + '/' + filename, '1', function(err, data) {
            assert.deepEqual(data, expected);
            done(err);
          });
        })
      });

    })(filename, sheets[filename]);
  }
});
