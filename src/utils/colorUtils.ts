export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export function parseColor(colorStr: string): { r: number; g: number; b: number } | null {
  if (colorStr.startsWith('#')) {
    return hexToRgb(colorStr)
  }
  
  if (colorStr.startsWith('rgb')) {
    const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      }
    }
  }
  
  if (colorStr.startsWith('rgba')) {
    const match = colorStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/)
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      }
    }
  }
  
  return null
}

export function getColorDistance(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  )
}

export function groupSimilarColors(colors: { hex: string; rgb: { r: number; g: number; b: number }; frequency: number }[], threshold = 30): { hex: string; rgb: { r: number; g: number; b: number }; frequency: number }[] {
  const groups: { hex: string; rgb: { r: number; g: number; b: number }; frequency: number }[] = []
  
  for (const color of colors) {
    const existingGroup = groups.find(group => 
      getColorDistance(group.rgb, color.rgb) < threshold
    )
    
    if (existingGroup) {
      existingGroup.frequency += color.frequency
    } else {
      groups.push({ ...color })
    }
  }
  
  return groups.sort((a, b) => b.frequency - a.frequency)
}

export function isLightColor(color: { r: number; g: number; b: number }): boolean {
  const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000
  return brightness > 128
}

export function generateColorScale(baseColor: { r: number; g: number; b: number }): Record<number, string> {
  const scale: Record<number, string> = {}
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const factor = (step - 500) / 500
    
    let r = baseColor.r
    let g = baseColor.g
    let b = baseColor.b
    
    if (factor > 0) {
      r = Math.round(r * (1 - factor))
      g = Math.round(g * (1 - factor))
      b = Math.round(b * (1 - factor))
    } else {
      r = Math.round(r + (255 - r) * Math.abs(factor))
      g = Math.round(g + (255 - g) * Math.abs(factor))
      b = Math.round(b + (255 - b) * Math.abs(factor))
    }
    
    scale[step] = rgbToHex(r, g, b)
  }
  
  return scale
}