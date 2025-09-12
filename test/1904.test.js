import readXlsx from '../source/read/readXlsxFileNode.js'

describe('1904', () => {
	it('should parse 1904 macOS dates', async () => {
		const data = await readXlsx('./test/spreadsheets/1904.xlsx')

		expect(data.length).to.equal(6)

		data[0][0].should.equal('Date')
		data[1][0].toISOString().should.equal('2018-05-05T00:00:00.000Z')
		data[2][0].toISOString().should.equal('2018-05-05T00:00:00.000Z')
		data[3][0].toISOString().should.equal('2018-05-05T00:00:00.000Z')
		data[4][0].toISOString().should.equal('2018-05-05T00:00:00.000Z')
		data[5][0].toISOString().should.equal('2018-05-05T00:00:00.000Z')
	})

	it('should parse 1904 macOS dates', async () => {
		const data = await readXlsx('./test/spreadsheets/1904.xlsx', {
			schema: {
				date: {
					column: 'Date',
					type: Date
				}
			}
		})

		data.errors.length.should.equal(0)
		data.rows.length.should.equal(5)
		data.rows[0].date.toISOString().should.equal('2018-05-05T00:00:00.000Z')
		data.rows[1].date.toISOString().should.equal('2018-05-05T00:00:00.000Z')
		data.rows[2].date.toISOString().should.equal('2018-05-05T00:00:00.000Z')
		data.rows[3].date.toISOString().should.equal('2018-05-05T00:00:00.000Z')
		data.rows[4].date.toISOString().should.equal('2018-05-05T00:00:00.000Z')
	})

	it('should list sheet names in sheet not found error', async () => {
		// By id.
		try {
			await readXlsx('./test/spreadsheets/1904.xlsx', { sheet: 2 })
		} catch (error) {
			error.message.should.equal('Sheet #2 not found in the *.xlsx file. Available sheets: "sheet 1" (#1).')
		}
		// By name.
		try {
			await readXlsx('./test/spreadsheets/1904.xlsx', { sheet: 'sheet 2' })
		} catch (error) {
			error.message.should.equal('Sheet "sheet 2" not found in the *.xlsx file. Available sheets: "sheet 1" (#1).')
		}
	})
})