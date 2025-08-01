import { ColorInfo, FontInfo } from '../types/theme'

export class NameGenerator {
  generateSemanticColorNames(colors: ColorInfo[]): Record<string, ColorInfo> {
    const namedColors: Record<string, ColorInfo> = {}
    const sortedColors = [...colors].sort((a, b) => b.frequency - a.frequency)
    
    // Primary colors (most frequent, often brand colors)
    const primaryCandidates = sortedColors.filter(color => 
      color.category === 'background' || color.category === 'accent'
    ).slice(0, 3)
    
    if (primaryCandidates.length > 0) {
      namedColors.primary = primaryCandidates[0]
      if (primaryCandidates.length > 1) {
        namedColors.secondary = primaryCandidates[1]
      }
      if (primaryCandidates.length > 2) {
        namedColors.accent = primaryCandidates[2]
      }
    }
    
    // Find neutral colors (grays, whites, blacks)
    const neutrals = sortedColors.filter(color => this.isNeutralColor(color))
    if (neutrals.length > 0) {
      namedColors.neutral = neutrals[0]
    }
    
    // Text colors
    const textColors = sortedColors.filter(color => color.category === 'text')
    if (textColors.length > 0) {
      namedColors.text = textColors[0]
    }
    
    // Success/Error/Warning colors (based on common color ranges)
    const success = sortedColors.find(color => this.isSuccessColor(color))
    const error = sortedColors.find(color => this.isErrorColor(color))
    const warning = sortedColors.find(color => this.isWarningColor(color))
    
    if (success) namedColors.success = success
    if (error) namedColors.error = error
    if (warning) namedColors.warning = warning
    
    return namedColors
  }
  
  generateFontNames(fonts: FontInfo[]): Record<string, FontInfo> {
    const namedFonts: Record<string, FontInfo> = {}
    
    // Heading fonts
    const headingFonts = fonts.filter(font => font.category === 'heading')
    if (headingFonts.length > 0) {
      namedFonts.heading = headingFonts[0]
    }
    
    // Body fonts
    const bodyFonts = fonts.filter(font => font.category === 'body')
    if (bodyFonts.length > 0) {
      namedFonts.body = bodyFonts[0]
    }
    
    // Monospace fonts
    const monoFonts = fonts.filter(font => 
      font.family.toLowerCase().includes('mono') || 
      font.family.toLowerCase().includes('courier') ||
      font.family.toLowerCase().includes('code')
    )
    if (monoFonts.length > 0) {
      namedFonts.mono = monoFonts[0]
    }
    
    return namedFonts
  }
  
  generateColorScaleName(baseColor: ColorInfo, shade: number): string {
    // Simple heuristic based on color properties
    if (this.isNeutralColor(baseColor)) {
      return `gray-${shade}`
    }
    
    if (this.isSuccessColor(baseColor)) {
      return `green-${shade}`
    }
    
    if (this.isErrorColor(baseColor)) {
      return `red-${shade}`
    }
    
    if (this.isWarningColor(baseColor)) {
      return `yellow-${shade}`
    }
    
    // Default to color-based names
    const hue = this.getColorHue(baseColor)
    return `${hue}-${shade}`
  }
  
  private isNeutralColor(color: ColorInfo): boolean {
    const { r, g, b } = color.rgb
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b))
    return maxDiff < 30 // Colors where RGB values are close together
  }
  
  private isSuccessColor(color: ColorInfo): boolean {
    const { r, g, b } = color.rgb
    return g > r && g > b && g > 100 // Green dominant
  }
  
  private isErrorColor(color: ColorInfo): boolean {
    const { r, g, b } = color.rgb
    return r > g && r > b && r > 100 // Red dominant
  }
  
  private isWarningColor(color: ColorInfo): boolean {
    const { r, g, b } = color.rgb
    return r > 150 && g > 150 && b < 100 // Yellow/Orange
  }
  
  private getColorHue(color: ColorInfo): string {
    const { r, g, b } = color.rgb
    
    if (r > g && r > b) return 'red'
    if (g > r && g > b) return 'green'  
    if (b > r && b > g) return 'blue'
    if (r > 150 && g > 150 && b < 100) return 'yellow'
    if (r > 100 && b > 100 && g < 100) return 'purple'
    if (g > 100 && b > 100 && r < 100) return 'cyan'
    
    return 'gray'
  }
}