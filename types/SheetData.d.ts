export type CellValue<ParsedNumber = number> =
	| string
	| ParsedNumber
	| boolean
	| Date

export type Row<ParsedNumber = number> = (CellValue<ParsedNumber> | null)[]

export type SheetData<ParsedNumber = number> = Row<ParsedNumber>[]