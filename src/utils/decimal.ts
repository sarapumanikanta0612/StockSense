function splitDecimal(value: string) {
  const [rawInteger = '0', rawFraction = ''] = value.split('.')
  const integer = rawInteger.replace(/^0+(?=\d)/, '') || '0'
  const fraction = rawFraction.padEnd(3, '0').slice(0, 3)
  return { integer, fraction }
}

export function compareDecimalStrings(left: string, right: string) {
  const leftParts = splitDecimal(left)
  const rightParts = splitDecimal(right)

  if (leftParts.integer.length !== rightParts.integer.length) {
    return leftParts.integer.length > rightParts.integer.length ? 1 : -1
  }

  const integerComparison = leftParts.integer.localeCompare(rightParts.integer)
  if (integerComparison !== 0) return integerComparison > 0 ? 1 : -1

  const fractionComparison = leftParts.fraction.localeCompare(rightParts.fraction)
  return fractionComparison === 0 ? 0 : fractionComparison > 0 ? 1 : -1
}

export function formatDecimalString(value: string) {
  const { integer, fraction } = splitDecimal(value)
  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const trimmedFraction = fraction.replace(/0+$/, '')
  return trimmedFraction ? `${groupedInteger}.${trimmedFraction}` : groupedInteger
}
