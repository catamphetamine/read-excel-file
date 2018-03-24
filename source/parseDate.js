// Parses a text value into a `Date` provided a `format`.
// The date returned is in the user's time zone and the time is `00:00`.
export default function parse_date(string, format, noon, utc)
{
	if (!string)
	{
		return
	}

	let year = extract(string, format, 'YYYY')

	if (year === undefined)
	{
		year = extract(string, format, 'YY')

		if (year !== undefined)
		{
			// Current year in the user's time zone.
			const current_year = new Date().getFullYear()
			const current_year_century = current_year - current_year % 100
			year += current_year_century
		}
	}

	const month = extract(string, format, 'MM')
	const day   = extract(string, format, 'DD')

	if (year === undefined || month === undefined || day === undefined)
	{
		console.error(`Couldn't parse date. Most likely an invalid date entered (manually). Otherwise it could be an unsupported date format: ${format} (only DD, MM, YY and YYYY literals are supported).`)
		return
	}

	// The date created is in the user's time zone and the time is `00:00`.
	let date = new Date
	(
		year,
		month - 1,
		day,
		noon ? 12 : undefined
	)

	if (utc)
	{
		// Converts timezone to UTC while preserving the same time
		date = convert_to_utc_timezone(date)
	}

	// If `new Date()` returns "Invalid Date"
	// (sometimes it does)
	if (isNaN(date.getTime()))
	{
		return
	}

	return date
}

// Converts timezone to UTC while preserving the same time
export function convert_to_utc_timezone(date)
{
	// Doesn't account for leap seconds but I guess that's ok
	// given that javascript's own `Date()` does not either.
	// https://www.timeanddate.com/time/leap-seconds-background.html
	//
	// https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
	//
	return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
}

function extract(string, template, piece)
{
	const starts_at = template.indexOf(piece)

	if (starts_at < 0)
	{
		return
	}

	// Check overall sanity
	if (!corresponds_to_template(string, template))
	{
		return
	}

	const number = parseInt(string.slice(starts_at, starts_at + piece.length))

	if (!isNaN(number))
	{
		return number
	}
}

function corresponds_to_template(string, template)
{
	if (string.length !== template.length)
	{
		return false
	}

	let i = 0
	while (i < string.length)
	{
		const is_a_digit = string[i] >= '0' && string[i] <= '9'

		if (!is_a_digit)
		{
			if (string[i] !== template[i])
			{
				return false
			}
		}
		else
		{
			if (template[i] !== 'D' && template[i] !== 'M' && template[i] !== 'Y')
			{
				return false
			}
		}

		i++
	}

	return true
}
