import { describe, it } from 'mocha'
import { expect } from 'chai'

import getColumnTitleForProperty from './getColumnTitleForProperty.js'

describe('parseSheetData/getColumnTitleForProperty', () => {
	it('should get column title for property path', () => {
		const schema = {
			a: {
				schema: {
					b: {
						schema: {
							c: {
								column: 'TITLE'
							}
						}
					}
				}
			}
		}

		expect(getColumnTitleForProperty([], schema)).to.equal(undefined)
		expect(getColumnTitleForProperty(['d'], schema)).to.equal(undefined)
		expect(getColumnTitleForProperty(['a'], schema)).to.equal(undefined)
		expect(getColumnTitleForProperty(['a', 'b'], schema)).to.equal(undefined)
		expect(getColumnTitleForProperty(['a', 'b', 'c'], schema)).to.equal('TITLE')
		expect(getColumnTitleForProperty(['a', 'b', 'c', 'd'], schema)).to.equal(undefined)
	})
})