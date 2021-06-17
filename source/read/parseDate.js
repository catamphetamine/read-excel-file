// Parses an Excel Date ("serial") into a
// corresponding javascript Date in UTC+0 timezone.
// (with time equal to 00:00)
//
// Doesn't account for leap seconds.
// Therefore is not 100% correct.
// But will do, I guess, since we're
// not doing rocket science here.
//
// https://www.pcworld.com/article/3063622/software/mastering-excel-date-time-serial-numbers-networkdays-datevalue-and-more.html
// "If you need to calculate dates in your spreadsheets,
//  Excel uses its own unique system, which it calls Serial Numbers".
//
export default function parseExcelDate(excelSerialDate, options) {
  // https://support.microsoft.com/en-gb/help/214330/differences-between-the-1900-and-the-1904-date-system-in-excel
  if (options && options.epoch1904) {
    excelSerialDate += 1462
  }

  // "Excel serial date" is just
  // the count of days since `01/01/1900`
  // (seems that it may be even fractional).
  //
  // The count of days elapsed
  // since `01/01/1900` (Excel epoch)
  // till `01/01/1970` (Unix epoch).
  // Accounts for leap years
  // (19 of them, yielding 19 extra days).
  const daysBeforeUnixEpoch = 70 * 365 + 19

  // An hour, approximately, because a minute
  // may be longer than 60 seconds, see "leap seconds".
  const hour = 60 * 60 * 1000

  return new Date(Math.round((excelSerialDate - daysBeforeUnixEpoch) * 24 * hour))
}