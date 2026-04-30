export interface Options<ParsedNumber = number> {
	trim?: boolean;
	parseNumber?: (string: string) => ParsedNumber;
	dateFormat?: string;
}
