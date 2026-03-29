// XLSX does have "d" type for dates, but it's not commonly used.
// Instead, it prefers using "n" type for storing dates as timestamps.
//
// Whether a numeric value is a number or a date timestamp, it sometimes could be
// detected by looking at the value "format" and seeing if it's a date-specific one.

import isDateFormat from './isDateFormat.js'

export default function isDateFormatStyle(styleId, styles, options) {
  if (styleId) {
    const style = styles[styleId]
    if (!style) {
      throw new Error(`Cell style not found: ${styleId}`)
    }
    if (!style.numberFormat) {
      return false
    }
    if (
      // Whether it's a "number format" that's conventionally used for storing date timestamps.
      BUILT_IN_DATE_FORMAT_IDS.indexOf(Number(style.numberFormat.id)) >= 0 ||
      // Whether it's a "number format" that uses a "formatting template"
      // that the developer is certain is a date formatting template.
      (options.dateFormat && style.numberFormat.template === options.dateFormat) ||
      // Whether the "smart formatting template" feature is not disabled
      // and it has detected that it's a date formatting template by looking at it.
      (options.smartDateParser !== false && style.numberFormat.template && isDateFormat(style.numberFormat.template))
     ) {
      return true
    }
  }
}

// Built-in formats have ID < 164.
// Some of those formats are intended to use when displaying dates.
//
// Depending on the "locale" used by the spreadsheet viewing application,
// different built-in format IDs might correspond to different templates.
// https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.numberingformat?view=openxml-2.8.1
//
// Here's a list of "locale"-independent built-in format IDs that're known to represent dates.
//
const LOCALE_INDEPENDENT_BUILT_IN_DATE_FORMAT_IDS = [
  14, // mm-dd-yy
  15, // d-mmm-yy
  16, // d-mmm
  17, // mmm-yy
  18, // h:mm AM/PM
  19, // h:mm:ss AM/PM
  20, // h:mm
  21, // h:mm:ss
  22, // m/d/yy h:mm
  45, // mm:ss
  46, // [h]:mm:ss
  47  // mmss.0
]

// "zh-tw" OR "zh-cn" locales.
// Language glyphs (aka "hieroglyphs") are not replaced with their respective unicode values here.
const MAINLAND_CHINESE_OR_TAIWANESE_LOCALE_BUILT_IN_DATE_FORMAT_IDS = [
  27, // [$-404]e/m/d OR yyyy"年"m"月"
  28, // [$-404]e"年"m"月"d"日" OR m"月"d"日"
  29, // [$-404]e"年"m"月"d"日" OR m"月"d"日"
  30, // m/d/yy OR m-d-yy
  31, // yyyy"年"m"月"d"日" OR yyyy"年"m"月"d"日"
  32, // hh"時"mm"分" OR h"时"mm"分"
  33, // hh"時"mm"分"ss"秒" OR h"时"mm"分"ss"秒"
  34, // 上午/下午hh"時"mm"分" OR 上午/下午h"时"mm"分"
  35, // 上午/下午hh"時"mm"分"ss"秒" OR 上午/下午h"时"mm"分"ss"秒"
  36, // [$-404]e/m/d OR yyyy"年"m"月"
  50, // [$-404]e/m/d OR yyyy"年"m"月"
  51, // [$-404]e"年"m"月"d"日" OR m"月"d"日"
  52, // 上午/下午hh"時"mm"分" OR yyyy"年"m"月"
  53, // 上午/下午hh"時"mm"分"ss"秒" OR m"月"d"日"
  54, // [$-404]e"年"m"月"d"日" OR m"月"d"日"
  55, // 上午/下午hh"時"mm"分" OR 上午/下午h"时"mm"分"
  56, // 上午/下午hh"時"mm"分"ss"秒" OR 上午/下午h"时"mm"分"ss"秒"
  57, // [$-404]e/m/d OR yyyy"年"m"月"
  58  // [$-404]e"年"m"月"d"日" OR m"月"d"日"
]

// "ja-jp" OR "ko-kr" locales.
// Language glyphs (aka "hieroglyphs") are not replaced with their respective unicode values here.
const JAPANESE_OR_KOREAN_LOCALE_BUILT_IN_DATE_FORMAT_IDS = [
  27, // [$-411]ge.m.d OR yyyy"年" mm"月" dd"日"
  28, // [$-411]ggge"年"m"月"d"日" OR mm-dd
  29, // [$-411]ggge"年"m"月"d"日" OR mm-dd
  30, // m/d/yy OR mm-dd-yy
  31, // yyyy"年"m"月"d"日" OR yyyy"년" mm"월" dd"일"
  32, // h"時"mm"分" OR h"시" mm"분"
  33, // h"時"mm"分"ss"秒" OR h"시" mm"분" ss"초"
  34, // yyyy"年"m"月" OR yyyy-mm-dd
  35, // m"月"d"日" OR yyyy-mm-dd
  36, // [$-411]ge.m.d OR yyyy"年" mm"月" dd"日"
  50, // [$-411]ge.m.d OR yyyy"年" mm"月" dd"日"
  51, // [$-411]ggge"年"m"月"d"日" OR mm-dd
  52, // yyyy"年"m"月" OR yyyy-mm-dd
  53, // m"月"d"日" OR yyyy-mm-dd
  54, // [$-411]ggge"年"m"月"d"日" OR mm-dd
  55, // yyyy"年"m"月" OR yyyy-mm-dd
  56, // m"月"d"日" OR yyyy-mm-dd
  57, // [$-411]ge.m.d OR yyyy"年" mm"月" dd"日"
  58  // [$-411]ggge"年"m"月"d"日" OR mm-dd
]

// "th-th" locale.
// Language glyphs (aka "hieroglyphs") are not replaced with their respective unicode values here.
const THAI_LOCALE_BUILT_IN_DATE_FORMAT_IDS = [
  71, // ว/ด/ปปปป
  72, // ว-ดดด-ปป
  73, // ว-ดดด
  74, // ดดด-ปป
  75, // ช:นน
  76, // ช:นน:ทท
  77, // ว/ด/ปปปป ช:นน
  78, // นน:ทท
  79, // [ช]:นน:ทท
  80, // นน:ทท.0
  81  // d/m/bb
]

// Start with language-agnostic date format IDs.
const BUILT_IN_DATE_FORMAT_IDS = LOCALE_INDEPENDENT_BUILT_IN_DATE_FORMAT_IDS.concat(
  // Add Mainland Chinese or Taiwanese date format IDs that haven't already been added.
  MAINLAND_CHINESE_OR_TAIWANESE_LOCALE_BUILT_IN_DATE_FORMAT_IDS
).concat(
  // Add Japanese or Korean date format IDs that haven't already been added.
  JAPANESE_OR_KOREAN_LOCALE_BUILT_IN_DATE_FORMAT_IDS.filter(
    numberFormatId => MAINLAND_CHINESE_OR_TAIWANESE_LOCALE_BUILT_IN_DATE_FORMAT_IDS.indexOf(numberFormatId) < 0
  )
).concat(
  // Add Thai date format IDs that haven't already been added.
  THAI_LOCALE_BUILT_IN_DATE_FORMAT_IDS.filter(
    numberFormatId => MAINLAND_CHINESE_OR_TAIWANESE_LOCALE_BUILT_IN_DATE_FORMAT_IDS.indexOf(numberFormatId) < 0
  ).filter(
    numberFormatId => JAPANESE_OR_KOREAN_LOCALE_BUILT_IN_DATE_FORMAT_IDS.indexOf(numberFormatId) < 0
  )
)
