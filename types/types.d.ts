export type CellValue<ParsedNumber = number> =
	| string
	| ParsedNumber
	| boolean
	| typeof Date

export type Row<ParsedNumber = number> = (CellValue<ParsedNumber> | null)[]

export type SheetData<ParsedNumber = number> = Row<ParsedNumber>[]

export type ReadFileResult<ParsedNumber = number> = {
	sheet: string;
	data: SheetData<ParsedNumber>;
}[]

export interface ReadOptions<ParsedNumber = number> {
	trim?: boolean;
	parseNumber?: (string: string) => ParsedNumber;
	dateFormat?: string;
}
