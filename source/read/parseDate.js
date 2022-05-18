    // Parses an Excel Date ("serial") into a corresponding javascript Date in UTC+0 timezone.
    // (with time equal to 00:00)
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
      // may be longer than 60 seconds, due to "leap seconds".
      //
      // Still, Javascript `Date` (and UNIX time in general) intentionally
      // drops the concept of "leap seconds" in order to make things simpler.
      // So it's fine.
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
      //  The fact is, that the unpredictable nature of leap seconds makes them very
      //  difficult to work with in APIs. One can't generally pass timestamps around
      //  that need leap seconds tables to be interpreted correctly, and expect that
      //  one system will interpret them the same as another. For example, while your
      //  example timestamp 1483228826 is 2017-01-01T00:00:00Z on your system,
      //  it would be interpreted as 2017-01-01T00:00:26Z on POSIX based systems,
      //  or systems without leap second tables. So they aren't portable.
      //  Even on systems that have full updated tables, there's no telling what those
      //  tables will contain in the future (beyond the 6-month IERS announcement period),
      //  so I can't produce a future timestamp without risk that it may eventually change.
      //
      //  To be clear - to support leap seconds in a programming language, the implementation
      //  must go out of its way to do so, and must make tradeoffs that are not always acceptable.
      //  Though there are exceptions, the general position is to not support them - not because
      //  of any subversion or active countermeasures, but because supporting them properly is much,
      //  much harder."
      //
      // https://en.wikipedia.org/wiki/Unix_time#Leap_seconds
      // https://en.wikipedia.org/wiki/Leap_year
      // https://en.wikipedia.org/wiki/Leap_second
      //
      const hour = 60 * 60 * 1000

      return new Date(Math.round((excelSerialDate - daysBeforeUnixEpoch) * 24 * hour))
    }