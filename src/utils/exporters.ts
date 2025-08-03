import { ThemeData, FontInfo, SpacingInfo, ComponentInfo } from '../types/theme'

export class ThemeExporter {

  exportTailwindConfig(theme: ThemeData): string {
    const colors: Record<string, any> = {}
    const fonts: Record<string, string[]> = {}
    
    // Use smart role-based naming, prioritizing CSS variables
    theme.colors.forEach(color => {
      let name = color.role || color.category || 'color'
      
      // If this came from a CSS variable, use a cleaner name
      if (color.cssVariable) {
        const cleanName = color.cssVariable
          .replace('--', '')
          .replace(/[-_]/g, '-')
          .toLowerCase()
        
        // Use the clean variable name if it's meaningful, otherwise fall back to role
        if (cleanName.length > 2 && !cleanName.match(/^\d+$/)) {
          name = cleanName
        }
      }
      
      // Avoid duplicates by adding suffix if needed
      let finalName = name
      let counter = 1
      while (colors[finalName] && colors[finalName] !== color.hex) {
        finalName = `${name}-${counter}`
        counter++
      }
      
      colors[finalName] = color.hex
    })
    
    theme.fonts.forEach(font => {
      const name = font.role || font.category || 'font'
      if (!fonts[name]) {
        fonts[name] = font.family.split(',').map(f => f.trim().replace(/"/g, ''))
      }
    })
    
    const config = {
      theme: {
        extend: {
          colors,
          fontFamily: fonts,
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
    let scss = '// Generated SCSS Variables\n\n'
    
    // Colors with role-based names
    scss += '// Colors\n'
    theme.colors.forEach(color => {
      const name = color.role || color.category || 'color'
      scss += `$${name}: ${color.hex};\n`
    })
    
    scss += '\n// Typography\n'
    theme.fonts.forEach(font => {
      const name = font.role || font.category || 'font'
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
    let css = '/* Generated CSS Custom Properties */\n:root {\n'
    
    // Colors with role-based names
    theme.colors.forEach(color => {
      const name = color.role || color.category || 'color'
      css += `  --${name}: ${color.hex};\n`
    })
    
    // Typography
    theme.fonts.forEach(font => {
      const name = font.role || font.category || 'font'
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
}