export function parseSpacing(value: string): number {
  if (!value || value === '0px' || value === '0') return 0
  
  const match = value.match(/^(\d*\.?\d+)(px|rem|em)$/)
  if (!match) return 0
  
  const num = parseFloat(match[1])
  const unit = match[2]
  
  switch (unit) {
    case 'px':
      return num
    case 'rem':
      return num * 16 // Assuming 16px = 1rem
    case 'em':
      return num * 16 // Simplified assumption
    default:
      return 0
  }
}

export function mapToTailwindSpacing(pixels: number): string {
  const tailwindMap: Record<number, string> = {
    0: '0',
    1: '0.5',
    2: '0.5',
    4: '1',
    6: '1.5',
    8: '2',
    10: '2.5',
    12: '3',
    14: '3.5',
    16: '4',
    20: '5',
    24: '6',
    28: '7',
    32: '8',
    36: '9',
    40: '10',
    44: '11',
    48: '12',
    56: '14',
    64: '16',
    80: '20',
    96: '24',
    112: '28',
    128: '32',
    144: '36',
    160: '40',
    176: '44',
    192: '48',
    208: '52',
    224: '56',
    240: '60',
    256: '64',
    288: '72',
    320: '80',
    384: '96'
  }
  
  if (tailwindMap[pixels]) {
    return tailwindMap[pixels]
  }
  
  // Find closest match
  const keys = Object.keys(tailwindMap).map(Number).sort((a, b) => a - b)
  let closest = keys[0]
  let minDiff = Math.abs(pixels - closest)
  
  for (const key of keys) {
    const diff = Math.abs(pixels - key)
    if (diff < minDiff) {
      minDiff = diff
      closest = key
    }
  }
  
  return tailwindMap[closest]
}

export function getTailwindSpacingClass(type: 'margin' | 'padding', value: string): string {
  const pixels = parseSpacing(value)
  const tailwindValue = mapToTailwindSpacing(pixels)
  
  const prefix = type === 'margin' ? 'm' : 'p'
  return `${prefix}-${tailwindValue}`
}

export function analyzeSpacingPattern(spacings: { value: string; frequency: number }[]): string[] {
  const frequentSpacings = spacings
    .filter(s => s.frequency >= 2)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 8)
    .map(s => getTailwindSpacingClass('padding', s.value))
  
  return [...new Set(frequentSpacings)]
}