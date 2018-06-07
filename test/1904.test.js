import readXlsx from '../source/readXlsxFileNode'

describe('1904', () => {
	it('should parse 1904 macOS dates', async () => {
		const data = await readXlsx(__dirname + '/spreadsheets/1904.xlsx', {
			schema: {
				Date: {
					type: Date,
					prop: 'date'
				}
			}
		})

		data.errors.length.should.equal(0)
		data.rows.length.should.equal(5)
		data.rows[0].date.toISOString().should.equal('2018-05-05T12:00:00.000Z')
	})
})