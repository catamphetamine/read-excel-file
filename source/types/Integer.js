export default function Integer() {}

// https://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
export function isInteger(value)
{
  if (isNaN(value)) {
    return false
  }
  const x = parseFloat(value)
  return (x | 0) === x
}