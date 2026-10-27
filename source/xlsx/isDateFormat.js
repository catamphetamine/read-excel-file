// In some date formats, there's a ";@" postfix.
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
// This variable is exported only to be specified in `worker-f` dependencies.
//
export const DATE_FORMAT_POSTFIX_THAT_ALLOWS_ANY_ARBITRARY_TEXT_INPUT = /;@$/

// Date format template will be cleared of any "unrelated" characters.
//
// * Characters `a-z` are "related" because they're used as date format tokens.
//   * d — Day
//   * yyyy — Year
//   * etc
//
// * Characters `0#?,.%` are "related" because they indicate a numeric number format.
//   * 0 — Mandatory digit placeholder
//   * # — Optional digit placeholder
//   * ? — Digit placeholder that aligns decimals or fraction spaces
//   * , or . — Thousands and decimal separators. This one is ignored because
//     it could also be present in a valid date template: "d mmmm yyyy г." or "mmm dddd, yyyy"
//   * % — Percentage multiplier
//
// This  variable is exported only to be specified in `worker-f` dependencies.
//
export const DATE_FORMAT_TOKEN_SPLITTER_REG_EXP = /[^a-z0#\?%]+/

/**
 * XLSX standard does have "d" type for dates, but it's not commonly used.
 * Instead, `.xlsx` files use "n" type for storing both numbers and dates (as timestamps).
 * So how does one tell if a cell value should be interpreted as a number or as a date?
 * The answer is in the "format" that is used to "format" the cell value: if it's
 * date-specific then it's a date, otherwise it's a number.
 * This function tells if a given number format template represents a date rather than a number.
 * @param {number} formatId
 * @param {string} template
 * @param {boolean?[]} dateFormatDetectionCache
 * @returns {boolean}
 */
export default function isDateFormat(formatId, template, dateFormatDetectionCache) {
	const cachedResult = dateFormatDetectionCache[formatId]
  if (cachedResult === undefined) {
    return dateFormatDetectionCache[formatId] = isDateFormatTemplate(template)
  }
  return cachedResult
}

/**
 * XLSX standard does have "d" type for dates, but it's not commonly used.
 * Instead, `.xlsx` files use "n" type for storing both numbers and dates (as timestamps).
 * So how does one tell if a cell value should be interpreted as a number or as a date?
 * The answer is in the "format" that is used to "format" the cell value: if it's
 * date-specific then it's a date, otherwise it's a number.
 * This function tells if a given number format template represents a date rather than a number.
 * @param {string} numberFormat
 * @returns {boolean}
 */
export function isDateFormatTemplate(template) {
  // Date format tokens could be in upper case or in lower case.
  // Normalize the format template by lowercasing it first.
  template = template.toLowerCase()

  // In some date formats, there's an ";@" suffix. Remove it.
  //
  // Adding ";@"" at the end ensures that if someone types text into the cell
  // instead of a date, Excel displays that text normally rather than hiding it or throwing an error.
	// Because it occurs in almost all Excel date formats, it should be stripped.
  //
  template = template.replace(DATE_FORMAT_POSTFIX_THAT_ALLOWS_ANY_ARBITRARY_TEXT_INPUT, '')

  // Replace any escaped characters with a dummy placeholder
  // that won't be recognized as a "meaningful" character,
  // and therefore it won't influence further parsing.
  //
  // The dummy placeholder is not removed because it still acts as a sepaarator
  // between potential adjacent "meaningful" tokens. If it was simply removed
  // then it could potentially merge two valid date format tokens into an invalid one.
  // Example: "d\my" → "d y" (tokens: "d" and "y" — both valid) vs "d\my" → "dy" (unknown token "dy").
  //
  // Escaping is done by putting a backslash (\) directly before a character.
  // For example, `0.00\m` displays letter "m" literally instead of interpreting it
  // as a month or minute token.
  //
  template = template.replace(/\\./g, ' ')

  // Split the template by semicolon character into potential multiple independent parts
  // and then test each part independently. If one part represents a date format then
  // the entire format does.
  //
  // What are the cases when there could be a semicolon in a date format tempalte:
  //
  // * There could be a conditional prefix — `[Condition]TrueFormat;FalseFormat` —
  //   that splits the template into `TrueFormat` and `FalseFormat` parts which
  //   should be evaluated independently. If `TrueFormat` or `FalseFormat` part
  //   represents a date format then the entire format represents a date.
  //
  //   * Example: `[<45000]"Old: "yyyy-mm-dd;yyyy-mm-dd` displays "Old"
  //     if the date serial is under 45000, otherwise it shows the date.
  //
  //     * Possible operators:
  //       * [>number] (Greater than)
  //       * [>=number] (Greater than or equal to)
  //       * [<number] (Less than)
  //       * [<=number] (Less than or equal to)
  //       * [=number] (Equal to)
  //       * [<>number] (Not equal to)
  //
  //   * Excel only allows one conditional prefix to be used.
  //     * Correct: `[<45000]MM/DD/YYYY; DD-MMM-YYYY`
  //     * Incorrect: `[<45000]MM/DD/YYYY; [>=45000]DD-MMM-YYYY`
  //
  // * Another possible case of using semicolons is dividing a format for different types of data:
  //   `Positive values; Negative values; Zero values; Text`.
  //   In such case, if any of these parts represent a date then the entire format represents a date.
  //
  //   * Example: `yyyy-mm-dd;[Red]yyyy-mm-dd; "No Date"` — Displays normal dates normally,
  //     negative/error serials in red, and text/zero entries as "No Date".
  //
  const templates = template.split(';')

  // If any of the sub-templates represent a date then the entire template represents a date.
  return templates.some(isDateFormatSubTemplate)

  /**
   * Tells if a given format template formats a date.
   * @param {string} template
   * @returns {boolean}
   */
  function isDateFormatSubTemplate(template) {
    // Replace any quoted text with a dummy placeholder
    // that won't be recognized as a "meaningful" character,
    // and therefore it won't influence further parsing.
    //
    // The dummy placeholder is not removed because it still acts as a sepaarator
    // between potential adjacent "meaningful" tokens.If it was simply removed
    // then it could potentially merge two valid date format tokens into an invalid one.
    // Example: `d"-"y` → `d y` (tokens: "d" and "y" — both valid) vs `d"-"y` → `dy` (unknown token "dy").
    //
    // Formats could include arbitrary prefixes or postfixes.
    // Example: `"Date: "yyyy-mm-dd` will display "Date: 2026-06-06".
    // Example: `yyyy-mm-dd "EST"` will display "2026-08-09 EST".
    //
    template = template.replace(/"[^"]*"/g, ' ')

    // Remove ".0" or ".00" or ".000" tokens from the format template.
    //
    // * Adding ".0" after "s" tells Excel to displays the fractional part of a second
    //   rounded to one decimal place (tenths). For example, a template "mm:ss.0"
    //   will output: 30:00.0, 30:00.1, 30:00.2, etc.
    //
    //   * Another example: "[ss].0" format displays elapsed time in seconds
    //     with fractional tenths of a second, allowing seconds to accumulate
    //     past 59 without rolling over into minutes: 59.0, 60.0, 61.0, 62.0, etc.
    //
    // * Adding ".00" after "s" tells Excel to displays the fractional part of a second
    //   rounded to two decimal places (hundredths). For example, a template "mm:ss.00"
    //   will output: 30:00.00, 30:00.01, 30:00.02, etc.
    //
    // * Adding ".000" after "s" (such as "ss.000" or "s.000") displays milliseconds
    //   (fractional seconds) up to three decimal places: 30:00.000, etc.
    //
    // Sidenote: The character before `00` or `000` could not only be `.` but also `,`
    // depending on the system's language settings (European regions use `,`).
    //
    // Such tokens are also used in general number formats, so they're not exclusive to dates.
    // For example, ".000" token forces a number to display exactly three decimal places,
    // padding with zeros if necessary and rounding if there are more.
    //
    // This is the reason why "00" or "000" aren't added to `DATE_TEMPLATE_TOKENS` —
    // because they're not exclusively "date template tokens" but rather
    // "numeric template tokens" in general. Hence, they should be removed
    // at the clean-up stage, because their presence can't be a deciding factor
    // when telling if a given template corresponds to a date or not.
    //
    template = template.replace(/(\[?[smhd]{1,2}\]?)[\.\,]00?0?/g, '$1')

    // Replace elapsed time brackets with regular time tokens.
    //
    // Formats like `[h]:mm:ss` or `[m]:ss` explicitly represent durations (elapsed time)
    // rather than standard calendar dates, but they are parsed under the Date/Time engine
    // umbrella in Excel. The presence of `[d]` or `[h]` or `[m]` or `[s]` with square brackets
    // (or same tokens with duplicate letters like `[ss]` that conditionally add a leading zero)
    // automatically  categorizes it as a Time format.
    //
    template = template.replace(/\[([smhd]{1,2})\]/g, '$1')

    // Remove any prefixes from the format template.
    //
    // There could be multiple prefixes in a date format template.
    // Example: `[Yellow][DBNum1][$-404]yyyy"年"m"月"d"日";@`
    // Any of those prefixes, as their name suggests, could only be present at the start.
    // They could be present in any number and in any order.
    // All those prefixes should be stripped.
    //
    // What kinds of prefixes could there be?
    //
    // * Conditional prefix — `[Condition]TrueFormat;FalseFormat` — has already been explained earlier.
    //
    // * Native number modifier — It changes standard numbers or date values into native character sets,
    //   specifically lowercase Kanji, Chinese, or Korean numerals.
    //
    //   Example values:
    //
    //   * [DBNum1] / [NatNum1]: Displays numbers as lowercase or standard Kanji/native numerals
    //     (e.g., 一, 二, 三).
    //   * [DBNum2] / [NatNum2]: Displays numbers as formal/uppercase Kanji or traditional numerals
    //     (e.g., 壱, 弐, 参).
    //   * [DBNum3] / [NatNum3]: Displays numbers using full-width Arabic numerals.
    //   * [DBNum4]: Often maps to specific local simplified or phonetic numeral representations
    //     depending on the system language settings.
    //
    // * Color prefix — outputs the value in a given color.
    //
    //   Example values:
    //
    //   * `[ColorN]`
    //   * `[Red]`
    //   * `[Yellow]`
    //
    // * Locale prefix — outputs the value using according to a given locale.
    //
    //   Syntax format: [$-LCID], where "LCID" means "Windows Locale ID" and is a hexademical number.
    //
    //   Example values:
    //
    //   * [$-0409] — English (United States)
    //   * [$-0809] — English (United Kingdom)
    //   * [$-0407] — German (Germany)
    //   * [$-40c] — French (France)
    //   * [$-ru-RU] — Russian (Russia)
    //   * [$-x-sysdate] — Uses the computer's local system long date format
    //
    //   Example: `[$-0407]dd-mmm-yyyy` forces the short month name to output in German.
    //
    //   Such prefix could also specify an alternative calendar system using specific trailing letters:
    //
    //   Example values:
    //
    //   * [$-,F] — Lunar calendar
    //   * [$-,G] — Indian Civil calendar
    //   * [$-,M] — Persian calendar
    //   * [$-,N] — Hijri (Islamic) calendar
    //   * [$-,106] or [$-0106] — Arabic / Islamic calendar
    //   * [$-,B1] (legacy) — Forces standard Gregorian interpretation
    //   * [$-,B2] (legacy) — Forces Hijri interpretation mode
    //
    //   Seeing a locale prefix in a format doesn't necessarily imply that this is a date format.
    //   For example, `[$-409]#,##0.00` format could be used on a generic number to force
    //   standard dot-and-comma layout that is used the US English locale.
    //
    template = template.replace(/\[[^\]]*\]/g, '')

    // Extract any remaining alphabetic parts from what's left from the template string.
    // Example: "mm/dd/yyyy" → ["mm", "dd", "yyyy"]
    const tokens = template.split(DATE_FORMAT_TOKEN_SPLITTER_REG_EXP)
      // Filter out any empty-string tokens.
      // For example, Russian template "d mmmm yyyy г." contains "г." postfix after year.
      // Splitting it by the above regexp would prodce an empty-string token at the end of the template.
      // Similarly, splitting a non-existing template "г. d mmmm yyyy" by the regexp above
      // would produce an empty-string token at the start of the template.
      // So any instances of an empty-string token at the start or at the end should be filtered out.
      // Normally, Excel would escape any such "г." strings (and even spaced) with a backslash,
      // but an `.xlsx` file could come from any other source that does not perform such escaping,
      // such as a hand-made script.
      .filter(_ => _)

    // Normally, if there're any date-specific tokens in the template then it is considered
    // a date format. Otherwise, it is considered a number format.
    //
    // That algorithm works if the format template parsing engine is solid and covered
    // with a gazillion of tests, because otherwise it could potentially produce "false positive"
    // results due to the very "permissive" nature of it making a decision.
    //
    // If the format parsing engine has some kind of a bug, and falsely categorizes a format
    // to represent a date when in reality it represents a number, things could go wrong
    // and the user would get weird output when some numbers are presented as if they were dates.
    //
    // In order to avoid such "false positives", there're two ways:
    // * Someone ports a format template parsing engine from an existing spreadsheet editor application's code.
    // * The format template parsing engine stays as is but becomes less permissive when making a decision.
    //
    // The latter approach is used, meaning that inclusion of any "unexpected" characters in the template
    // will stop it from being treated as a date template. What should the "unexpected" characters be then?
    // I'd suppose that those should be ones that're known to be used in numeric number formats:
    //
    // * 0 — Mandatory digit placeholder
    // * # — Optional digit placeholder
    // * ? — Digit placeholder that aligns decimals or fraction spaces
    // * , or . — Thousands and decimal separators. This one is not included because it could also be used in date formats.
    // * % — Percentage multiplier

    return tokens.length === 0
      // If no date-template-specific tokens are present in what's left from the template string
      // then it could be any kind of template such as a generic numeric template
      // such as "$#,##0.00" currency template or "0.0%" percentage template.
      // I.e. it's better to output a "false positive" here rather than end up
      // accidentally interpreting numbers as dates, which users wouldn't want.
      ? false
      // If a non-date-format-specific token is found, then it might not necessarily be a date format.
      // In order to make a certain guess and avoid "false positives", it should treat any
      // unexpected situations as "not a date template" so that it doesn't accidentally
      // interpret numbers as dates, which users wouldn't want.
      : tokens.every(token => DATE_FORMAT_TEMPLATE_TOKENS.indexOf(token) >= 0)
  }
}

// These tokens could be in upper case or in lower case.
// There seems to be no single standard, so using lower case.
//
// This is exported only to be specified in `worker-f` dependencies.
//
export const DATE_FORMAT_TEMPLATE_TOKENS = [
  // Seconds.
  's',
  // Seconds (min two digits). Example: "05".
  'ss',
  // Minutes. Could also means months, depending on the context. Example: "5".
  'm',
  // Minutes (min two digits). Could also means months, depending on the context. Example: "05".
  'mm',
  // Hours. Example: "1".
  'h',
  // Hours (min two digits). Example: "01".
  'hh',
  // "am" part of "am/pm" or "AM/PM".
  'am',
  // "pm" part of "am/pm" or "AM/PM".
  'pm',
  // "a" part of "a/p" or "A/P".
  'a',
  // "p" part of "a/p" or "A/P".
  'p',
  // Day. Example: "1"
  'd',
  // Day (min two digits). Example: "01"
  'dd',
  // Short, three-letter abbreviation for the day of the week. Example: "Mon"
  'ddd',
  // Full name of the day of the week. Example: "Monday"
  'dddd',
  // Abbreviated weekday name. Example: "Mon", "Tue"
  'aaa',
  // Full weekday name. Example: "Monday", "Tuesday"
  'aaaa',
  // First letter of the weekday name. Example: "M", "T"
  'aaaaa',
  // Month (numeric). Could also mean minutes, depending on the context. Example: "1".
  'm',
  // Month (numeric, min two digits). Could also mean minutes, depending on the context. Example: "01".
  'mm',
  // Month (shortened month name). Example: "Jan".
  'mmm',
  // Month (full month name). Example: "January".
  'mmmm',
  // Month (first letter). Example: "J".
  'mmmmm',
  // Excel typically treats a single `y` the same as `yy` in custom formatting,
  // though standard practice is using `yy` or `yyyy`.
  'y',
  // Two-digit year, with a leading zero if needed. Example: "01".
  'yy',
  // Full year. Example: "2001".
  'yyyy',
  //
  // `e` or `ee` token stands for "era year" and represents an era-based year,
  // primarily supporting Japanese, Taiwanese, or Minguo/Buddhist calendar systems.
  // An example of an "era year" would be Heisei or Reiwa year numbers,
  // or Buddhist Era years which are Gregorian years plus 543.
  //
  // * `e` outputs the era year as a 4-digit (or unpadded) number.
  //   For example, `2026` or `115` depending on the active regional era.
  //   In standard Western/Gregorian locales, Excel often falls back to treating `e`
  //   similarly to a regular year layout.
  //
  // * `ee` outputs a 2-digit padded era year. For example, `26` or `15`.
  //
  // * `eeee` — While `yyyy` is the standard token for a 4-digit year,
  //   `eeee` is historically used for specialized international calendar eras
  //   (like the Japanese or Taiwanese imperial eras). However, in standard
  //   Western/Gregorian system locales, Excel treats `eeee` exactly like `yyyy`.
  'e',
  'ee',
  'eeee'
]