import { ThemeData, ColorInfo, FontInfo, SpacingInfo, ComponentInfo } from '../types/theme'
import { NameGenerator } from './nameGenerator'
import { generateColorScale } from './colorUtils'

export class ThemeExporter {
  private nameGenerator = new NameGenerator()

  exportTailwindConfig(theme: ThemeData): string {
    const semanticColors = this.nameGenerator.generateSemanticColorNames(theme.colors)
    const semanticFonts = this.nameGenerator.generateFontNames(theme.fonts)
    
    const config = {
      theme: {
        extend: {
          colors: this.generateTailwindColors(semanticColors, theme.colors),
          fontFamily: this.generateTailwindFonts(semanticFonts),
          fontSize: this.generateTailwindFontSizes(theme.fonts),
          spacing: this.generateTailwindSpacing(theme.spacing),
          borderRadius: this.generateTailwindBorderRadius(theme.components),
          boxShadow: this.generateTailwindShadows(theme.components)
        }
      }
    }
    
    return `/** @type {import('tailwindcss').Config} */
export default ${JSON.stringify(config, null, 2)}`
  }

  exportSCSSVariables(theme: ThemeData): string {
    const semanticColors = this.nameGenerator.generateSemanticColorNames(theme.colors)
    const semanticFonts = this.nameGenerator.generateFontNames(theme.fonts)
    
    let scss = '// Generated SCSS Variables\n\n'
    
    // Colors
    scss += '// Colors\n'
    Object.entries(semanticColors).forEach(([name, color]) => {
      scss += `$color-${name}: ${color.hex};\n`
      
      // Generate color scale
      const scale = generateColorScale(color.rgb)
      Object.entries(scale).forEach(([shade, hex]) => {
        scss += `$color-${name}-${shade}: ${hex};\n`
      })
    })
    
    scss += '\n// Typography\n'
    Object.entries(semanticFonts).forEach(([name, font]) => {
      scss += `$font-${name}: ${this.formatFontFamily(font.family)};\n`
      scss += `$font-${name}-weight: ${font.weight};\n`
      scss += `$font-${name}-size: ${font.size};\n`
    })
    
    scss += '\n// Spacing\n'
    theme.spacing.slice(0, 8).forEach((spacing, index) => {
      scss += `$spacing-${index + 1}: ${spacing.value};\n`
    })
    
    return scss
  }

  exportCSSCustomProperties(theme: ThemeData): string {
    const semanticColors = this.nameGenerator.generateSemanticColorNames(theme.colors)
    const semanticFonts = this.nameGenerator.generateFontNames(theme.fonts)
    
    let css = '/* Generated CSS Custom Properties */\n:root {\n'
    
    // Colors
    Object.entries(semanticColors).forEach(([name, color]) => {
      css += `  --color-${name}: ${color.hex};\n`
      
      // Generate color scale
      const scale = generateColorScale(color.rgb)
      Object.entries(scale).forEach(([shade, hex]) => {
        css += `  --color-${name}-${shade}: ${hex};\n`
      })
    })
    
    // Typography
    Object.entries(semanticFonts).forEach(([name, font]) => {
      css += `  --font-${name}: ${this.formatFontFamily(font.family)};\n`
      css += `  --font-${name}-weight: ${font.weight};\n`
      css += `  --font-${name}-size: ${font.size};\n`
    })
    
    // Spacing
    theme.spacing.slice(0, 8).forEach((spacing, index) => {
      css += `  --spacing-${index + 1}: ${spacing.value};\n`
    })
    
    css += '}\n'
    return css
  }

  private generateTailwindColors(semanticColors: Record<string, ColorInfo>, _allColors: ColorInfo[]): Record<string, any> {
    const colors: Record<string, any> = {}
    
    Object.entries(semanticColors).forEach(([name, color]) => {
      const scale = generateColorScale(color.rgb)
      colors[name] = {
        DEFAULT: color.hex,
        ...scale
      }
    })
    
    return colors
  }

  private generateTailwindFonts(semanticFonts: Record<string, FontInfo>): Record<string, string[]> {
    const fonts: Record<string, string[]> = {}
    
    Object.entries(semanticFonts).forEach(([name, font]) => {
      fonts[name] = this.parseFontFamily(font.family)
    })
    
    return fonts
  }

  private generateTailwindFontSizes(fonts: FontInfo[]): Record<string, string> {
    const sizes: Record<string, string> = {}
    
    // Get unique font sizes and map them to Tailwind-like names
    const uniqueSizes = [...new Set(fonts.map(f => f.size))]
      .sort((a, b) => parseFloat(a) - parseFloat(b))
    
    const sizeNames = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl']
    
    uniqueSizes.forEach((size, index) => {
      if (index < sizeNames.length) {
        sizes[sizeNames[index]] = size
      }
    })
    
    return sizes
  }

  private generateTailwindSpacing(spacing: SpacingInfo[]): Record<string, string> {
    const spacingMap: Record<string, string> = {}
    
    spacing.forEach((space, index) => {
      spacingMap[`custom-${index + 1}`] = space.value
    })
    
    return spacingMap
  }

  private generateTailwindBorderRadius(components: ComponentInfo[]): Record<string, string> {
    const radiusMap: Record<string, string> = {}
    
    const radiusValues = components
      .filter(c => c.styles.borderRadius && c.styles.borderRadius !== '0px')
      .map(c => c.styles.borderRadius!)
    
    const uniqueRadius = [...new Set(radiusValues)]
    
    uniqueRadius.forEach((radius, index) => {
      radiusMap[`custom-${index + 1}`] = radius
    })
    
    return radiusMap
  }

  private generateTailwindShadows(components: ComponentInfo[]): Record<string, string> {
    const shadowMap: Record<string, string> = {}
    
    const shadowValues = components
      .filter(c => c.styles.boxShadow && c.styles.boxShadow !== 'none')
      .map(c => c.styles.boxShadow!)
    
    const uniqueShadows = [...new Set(shadowValues)]
    
    uniqueShadows.forEach((shadow, index) => {
      shadowMap[`custom-${index + 1}`] = shadow
    })
    
    return shadowMap
  }

  private formatFontFamily(family: string): string {
    // Clean up font family string
    return family.replace(/"/g, '').split(',')[0].trim()
  }

  private parseFontFamily(family: string): string[] {
    // Parse font family into array format for Tailwind
    return family.replace(/"/g, '').split(',').map(f => f.trim())
  }
}