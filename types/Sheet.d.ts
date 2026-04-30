import type { SheetData } from './SheetData.d.js'

export type Sheet<ParsedNumber = number> = {
	sheet: string;
	data: SheetData<ParsedNumber>;
}