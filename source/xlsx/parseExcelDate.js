// Parses an Excel Date (represented by a "serial" floating-point number)
// into a javascript `Date` in UTC+0 timezone (with time is set to 00:00).
//
// https://www.pcworld.com/article/3063622/software/mastering-excel-date-time-serial-numbers-networkdays-datevalue-and-more.html
// "If you need to calculate dates in your spreadsheets,
//  Excel uses its own unique system, which it calls Serial Numbers".
//
export default function parseExcelDate(excelSerialDate, options) {
  // Windows operating system uses floating-point numbers to represent dates,
  // where the number represents the count of days elapsed since January 0th, 1900.
  //
  // This also means that there're 2 aspects associated with this choice:
  //
  // * January 1st, 1900, 00:00 is represented by `1` rather than `0`, which looks a bit weird.
  // * 1900 is a special year because it's a "one in a 100 years" occasion when it's not a leap year.
  //
  // To work around those two aspects, Mac OS chose another baseline — January 1st, 1900.
  // Although, that only postponed the second issue because 2100 is going to be the next "speciaL" year
  // which is not going to be a "leap" one.
  //
  // Older versions of Excel on Mac OS used year 1904 as the default baseline for numeric dates.
  // Since 2011, Microsoft Excel on Mac OS uses year 1900 as the default baseline for cross-platform consistency.
  // https://support.microsoft.com/en-us/office/date-systems-in-excel-e7fe7167-48a9-4b96-bb53-5612a800b487
  //
  // So the 1904 baseline is now deprecated, although still available to be configured manually.
  // So it still might be encountered in Excel files created on MacOS.
  // In that case, the Excel file contains a special flag — `<workbook><workbookPr date1904="1"/>...` —
  // that tells the application which baseline is being used for numeric date timestamps.
  //
  if (options && options.epoch1904) {
    // Convert the numeric date timestamp from 1904 baseline to 1900 baseline.
    excelSerialDate += (1904 - 1900) * DAYS_IN_YEAR + JANUARY_0TH_1900_DAY + ERRONEOUS_FEBRUARY_29_1990_DAY
  }

  const daysBeforeUnixEpoch = JANUARY_0TH_1900_DAY + ERRONEOUS_FEBRUARY_29_1990_DAY + (1970 - 1900) * DAYS_IN_YEAR + NUMBER_OF_LEAP_YEARS_BETWEEN_1900_AND_1970

  return new Date(Math.floor((excelSerialDate - daysBeforeUnixEpoch) * DAY))
}

// "Excel serial date" is just a (fractional) count of days passed since `00/01/1900`.
//
// In contrast, "Unix timestamps" use `01/01/1970` as the baseline for numeric dates.
//
// In order to convert one into another, it should calculate the count of days elapsed
// since `00/01/1900` (Excel epoch) till `01/01/1970` (Unix epoch), or the count of days
// between year `1900` and year `1970`, plus one day.
//
// It also should account for the number of "leap years" between year `1900` and year `1970`,
// which is 17 of them. https://kalender-365.de/leap-years.php
//
// "One year has the length of 365 days, 5 hours, 48 minutes and 45 seconds.
//  These are 365.2421875 days. This is hard to calculate with, so for practical reasons
//  a normal year has been given 365 days and a leap year 366 days. In leap years,
//  February 29th is added as leap day, which doesn't exist in a normal year.
//  A leap year is every 4 years, but not every 100 years, then again every 400 years.
//  So the year 1900 wasn't a leap year, but 2000 was".
//
// And also, Excel has a historical bug when it incorrectly assumes year `1900` to be a leap year,
// and, as a result, all Excel serial dates starting from March 1st, 1900 lag 1 day behind
// and require an additional 1 day to be added to them in order to be converted to a proper timestamp.
//
// https://learn.microsoft.com/en-us/answers/questions/5249322/why-does-microsoft-excel-considers-29-02-1900-to-b?forum=msoffice-all&referrer=answers#:~:text=This%20made%20it%20easier%20for,other%20programs%20that%20use%20dates.
//
// "When Lotus 1-2-3 was first released, the program assumed that the year 1900 was a leap year,
//  even though it actually was not a leap year. This made it easier for the program to handle
//  leap years and caused no harm to almost all date calculations in Lotus 1-2-3.
//
//  When Microsoft Multiplan and Microsoft Excel were released, they also assumed that 1900
//  was a leap year. This assumption allowed Microsoft Multiplan and Microsoft Excel to use
//  the same serial date system used by Lotus 1-2-3 and provide greater compatibility with Lotus 1-2-3.
//  Treating 1900 as a leap year also made it easier for users to move worksheets from one program
//  to the other".
//
// So the historical bug is basically that Excel thinks that February 29th, 1900 existed
// while in reality it didn't. That's why it's actually 1 day off for any date after that one.
//
const NUMBER_OF_LEAP_YEARS_BETWEEN_1900_AND_1970 = 17
const JANUARY_0TH_1900_DAY = 1
const ERRONEOUS_FEBRUARY_29_1990_DAY = 1

// An approximate count of seconds in a day is:
// 24 hours * 60 minutes in an hour * 60 seconds in a minute
//
// It is approximate because a minute could be longer than 60 seconds, due to "leap seconds".
//
// Still, javascript `Date`, and UNIX time in general, intentionally
// drop the concept of "leap seconds" in order to make things simpler.
// So this approximation is valid and doesn't result in any bugs.
// https://stackoverflow.com/questions/53019726/where-are-the-leap-seconds-in-javascript
//
// "The JavaScript Date object specifically adheres to the concept of Unix Time
//  (albeit with higher precision). This is part of the POSIX specification,
//  and thus is sometimes called "POSIX Time". It does not count leap seconds,
//  but rather assumes every day had exactly 86,400 seconds. You can read about
//  this in section 20.3.1.1 of the current ECMAScript specification, which states:
//
//  "Time is measured in ECMAScript in milliseconds since 01 January, 1970 UTC.
//   In time values leap seconds are ignored. It is assumed that there are exactly
//   86,400,000 milliseconds per day."
//
// The reason is that the unpredictable nature of leap seconds makes them very
// difficult to work with in APIs. One can't generally pass timestamps around
// that need leap seconds tables to be interpreted correctly, and expect that
// one system will interpret them the same as another. For example, a timestamp
// `1483228826` that accounts for "leap seconds" should've been interpreted as
// "2017-01-01T00:00:00Z", but if the receiver doesn't account for "leap seconds",
// they would interpret it as "2017-01-01T00:00:26Z" (e.g. POSIX-based systems like Linux),
// So "leap seconds" aren't really portable.
// Even on systems that have full frequently-updated "leap second" tables,
// there's no telling what adjustments those tables will contain in the future
// (i.e. beyond the 6-month IERS announcement period) because "leap seconds" can't be
// determined by a fixed mathematical formula or something like that. Instead,
// scientists introduce them as needed based on the observed Earth's rotation around the sun.
//
// "Because the Earth's rotational speed varies in response to climatic and geological events,
//  UTC leap seconds are irregularly spaced and not precisely predictable. The decision to insert
// a leap second is made by the International Earth Rotation and Reference Systems Service (IERS),
// typically about six months in advance, to ensure that the difference between UTC and UT1
// does not exceed ±0.9 seconds."
//
// One example is year `1900` which is "every fourth year" but it still is not a "leap year".
//
// To reiterate: to support leap seconds in a programming language, the implementation
// must go out of its way to do so, and must make tradeoffs that are not always acceptable.
// Though there are exceptions, the general position is to not support them - not because
// of any subversion or active countermeasures, but because supporting them properly is much,
// much harder.
//
// https://en.wikipedia.org/wiki/Unix_time#Leap_seconds
// https://en.wikipedia.org/wiki/Leap_year
// https://en.wikipedia.org/wiki/Leap_second
//
const DAY = 24 * 60 * 60 * 1000
const DAYS_IN_YEAR = 365
