// On some date formats, there's a "[$-...]" prefix that locks the locale
// to be a specific one when formatting a date using this format.
//
// https://stackoverflow.com/questions/4730152/what-indicates-an-office-open-xml-cell-contains-a-date-time-value
//
// Format examples:
//
// * "[$-404]e/m/d"
// * "[$-414]mmmm\ yyyy;@"
// * "[$-ru-RU]dd.mm.yyyy;@"
// * "[$-x-sysdate]dddd, mmmm dd, yyyy"
//
const DATE_FORMAT_SPECIFIC_LOCALE_PREFIX = /^\[\$-[^\]]+\]/

// On some date formats, there's a ";@" suffix.
// It instructs the spreadsheet editor application to display any non-numeric
// value as is instead of hiding it or something like that.
//
// For example, if one inputs "Some text" instead of a date in such cell,
// it will still show "Some text" instead of an empty cell, even though
// the value is strictly-speaking invalid.
//
// Specifically, ";" means "anything before this applies only to a numeric value,
// while anything after it applies to a text value". And a follow-up "@" means
// "for a text value, just output it as is".
//
// It's not really clear why would anyone add such a feature to a format.
// Perhaps it feels more "user-friendly" towards a non-"tech-savvy" user
// of a spreadsheet editor application.
//
// Format examples:
//
// * "m/d/yyyy;@"
// * "[$-414]mmmm\ yyyy;@"
//
const DATE_FORMAT_ALLOW_ANY_OTHER_TEXT_SUFFIX = /;@$/

const CACHE = {}

export default function isDateFormatCached(template) {
	if (template in CACHE) {
		return CACHE[template]
	}
	const result = isDateFormat(template)
	CACHE[template] = result
	return result
}

function isDateFormat(template) {
  // Date format tokens could be in upper case or in lower case.
  // There seems to be no single standard.
  // So the template is lowercased first.
  template = template.toLowerCase()

  // On some date formats, there's an "[$-...]" prefix.
  // It forces a specific locale to be used when formatting a date.
  template = template.replace(DATE_FORMAT_SPECIFIC_LOCALE_PREFIX, '')

  // On some date formats, there's an ";@" suffix.
  // It's not clear why would anyone need it in a date format template.
	// Still, because it occurs there, it should be stripped.
  template = template.replace(DATE_FORMAT_ALLOW_ANY_OTHER_TEXT_SUFFIX, '')

  // Extract all alphabetic parts from what's left from the template string.
  // Example: "mm/dd/yyyy" → ["mm", "dd", "yyyy"]
  const tokens = template.split(/\W+/)

  // If no alphabetic parts are present in what's left from the template string
  // then it could be any kind of template such as a generic numeric template
  // such as "$#,##0.00" currency template or "0.0%" percentage template.
  if (tokens.length < 0) {
    return false
  }

  for (const token of tokens) {
    // If a non-date-format-specific alphabetic substring is found,
    // this might not necessarily be a date format.
    if (DATE_TEMPLATE_TOKENS.indexOf(token) < 0) {
      return false
    }
  }

  return true
}

// These tokens could be in upper case or in lower case.
// There seems to be no single standard, so using lower case.
const DATE_TEMPLATE_TOKENS = [
  // Seconds (min two digits). Example: "05".
  'ss',
  // Minutes (min two digits). Example: "05". Could also be "Months". Weird.
  'mm',
  // Hours. Example: "1".
  'h',
  // Hours (min two digits). Example: "01".
  'hh',
  // "AM" part of "AM/PM". Lowercased just in case.
  'am',
  // "PM" part of "AM/PM". Lowercased just in case.
  'pm',
  // Day. Example: "1"
  'd',
  // Day (min two digits). Example: "01"
  'dd',
  // Month (numeric). Example: "1".
  'm',
  // Month (numeric, min two digits). Example: "01". Could also be "Minutes". Weird.
  'mm',
  // Month (shortened month name). Example: "Jan".
  'mmm',
  // Month (full month name). Example: "January".
  'mmmm',
  // Two-digit year. Example: "20".
  'yy',
  // Full year. Example: "2020".
  'yyyy',

  // I don't have any idea what "e" means.
  // It's used in "built-in" XLSX formats:
  // * 27 '[$-404]e/m/d';
  // * 36 '[$-404]e/m/d';
  // * 50 '[$-404]e/m/d';
  // * 57 '[$-404]e/m/d';
  'e'
];