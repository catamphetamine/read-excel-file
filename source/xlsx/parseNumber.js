// Parses a number from string.
// Throws an error if the number couldn't be parsed.
// When parsing floating-point number, is affected by
// the javascript number encoding precision issues:
// https://www.youtube.com/watch?v=2gIxbTn7GSc
// https://www.avioconsulting.com/blog/overcoming-javascript-numeric-precision-issues
export default function parseNumber(stringifiedNumber) {
  const parsedNumber = Number(stringifiedNumber)
  if (isNaN(parsedNumber)) {
    throw new Error(`Couldn't parse number: ${stringifiedNumber}`)
  }
  return parsedNumber
}