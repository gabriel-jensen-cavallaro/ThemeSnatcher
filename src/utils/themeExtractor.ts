import { ColorInfo, FontInfo, ThemeData, SpacingInfo } from '../types/theme'
import { parseColor, rgbToHex, groupSimilarColors } from './colorUtils'
import { getKeyElements, getComputedStyleProperty, getElementSelector, filterDesignElements } from './domUtils'
import { ComponentDetector } from './componentDetector'
import { SmartFilter } from './smartFiltering'
import { parseSpacing, getTailwindSpacingClass } from './spacingUtils'

export class ThemeExtractor {
  private colorFrequency = new Map<string, { count: number; elements: string[]; category: string }>()
  private fontFrequency = new Map<string, { count: number; elements: string[]; category: string }>()
  private spacingFrequency = new Map<string, { count: number; elements: string[]; type: 'margin' | 'padding' }>()
  private smartFilter = new SmartFilter()
  private componentDetector = new ComponentDetector()

  extractTheme(): ThemeData {
    this.colorFrequency.clear()
    this.fontFrequency.clear()
    this.spacingFrequency.clear()

    // Get prioritized design elements
    const elements = this.smartFilter.prioritizeDesignElements(filterDesignElements(getKeyElements()))
    
    elements.forEach(element => {
      this.extractColorsFromElement(element)
      this.extractFontsFromElement(element)
      this.extractSpacingFromElement(element)
    })

    const rawColors = this.processColors()
    const colors = this.smartFilter.filterDesignColors(rawColors, elements)
    const fonts = this.processFonts()
    const spacing = this.processSpacing()
    const components = this.componentDetector.detectComponents()
    const isDarkMode = this.smartFilter.detectDarkMode()

    return {
      colors,
      fonts,
      spacing,
      components,
      timestamp: Date.now(),
      url: window.location.href,
      isDarkMode
    }
  }

  private extractColorsFromElement(element: Element): void {
    const styles = [
      { prop: 'color', category: 'text' },
      { prop: 'background-color', category: 'background' },
      { prop: 'border-color', category: 'border' },
      { prop: 'border-top-color', category: 'border' },
      { prop: 'border-right-color', category: 'border' },
      { prop: 'border-bottom-color', category: 'border' },
      { prop: 'border-left-color', category: 'border' },
      { prop: 'box-shadow', category: 'accent' },
      { prop: 'text-shadow', category: 'accent' }
    ]

    const selector = getElementSelector(element)

    styles.forEach(({ prop, category }) => {
      const value = getComputedStyleProperty(element, prop)
      
      if (value && value !== 'none' && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)') {
        // Handle box-shadow and text-shadow which may contain multiple colors
        if (prop.includes('shadow')) {
          const colors = this.extractColorsFromShadow(value)
          colors.forEach(color => this.addColorToFrequency(color, selector, category))
        } else {
          const color = parseColor(value)
          if (color) {
            const hex = rgbToHex(color.r, color.g, color.b)
            this.addColorToFrequency(hex, selector, category)
          }
        }
      }
    })
  }

  private extractColorsFromShadow(shadowValue: string): string[] {
    const colors: string[] = []
    const rgbMatches = shadowValue.match(/rgb\([^)]+\)/g) || []
    const hexMatches = shadowValue.match(/#[a-fA-F0-9]{6}/g) || []
    
    rgbMatches.forEach(match => {
      const color = parseColor(match)
      if (color) {
        colors.push(rgbToHex(color.r, color.g, color.b))
      }
    })
    
    colors.push(...hexMatches)
    return colors
  }

  private addColorToFrequency(hex: string, selector: string, category: string): void {
    // Skip very light or very dark colors that are likely default/system colors
    const color = parseColor(hex)
    if (!color) return
    
    const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000
    if (brightness > 250 || brightness < 10) return

    if (this.colorFrequency.has(hex)) {
      const existing = this.colorFrequency.get(hex)!
      existing.count++
      if (!existing.elements.includes(selector)) {
        existing.elements.push(selector)
      }
    } else {
      this.colorFrequency.set(hex, {
        count: 1,
        elements: [selector],
        category
      })
    }
  }

  private extractFontsFromElement(element: Element): void {
    const fontFamily = getComputedStyleProperty(element, 'font-family')
    const fontWeight = getComputedStyleProperty(element, 'font-weight')
    const fontSize = getComputedStyleProperty(element, 'font-size')
    
    if (!fontFamily) return

    const selector = getElementSelector(element)
    const category = this.getFontCategory(element)
    const fontKey = `${fontFamily}|${fontWeight}|${fontSize}`

    if (this.fontFrequency.has(fontKey)) {
      const existing = this.fontFrequency.get(fontKey)!
      existing.count++
      if (!existing.elements.includes(selector)) {
        existing.elements.push(selector)
      }
    } else {
      this.fontFrequency.set(fontKey, {
        count: 1,
        elements: [selector],
        category
      })
    }
  }

  private getFontCategory(element: Element): string {
    if (element.matches('h1, h2, h3, h4, h5, h6')) {
      return 'heading'
    }
    if (element.matches('p, div, span, article, section')) {
      return 'body'
    }
    return 'accent'
  }

  private processColors(): ColorInfo[] {
    const colorArray = Array.from(this.colorFrequency.entries()).map(([hex, data]) => {
      const rgb = parseColor(hex)!
      return {
        hex,
        rgb,
        frequency: data.count,
        elements: data.elements,
        category: data.category as 'background' | 'text' | 'border' | 'accent'
      }
    })

    // Group similar colors and sort by frequency
    const groupedColors = groupSimilarColors(colorArray, 25)
    
    return groupedColors.map(color => ({
      hex: color.hex,
      rgb: color.rgb,
      frequency: color.frequency,
      elements: colorArray.find(c => c.hex === color.hex)?.elements || [],
      category: colorArray.find(c => c.hex === color.hex)?.category || 'accent'
    })).slice(0, 20) // Limit to top 20 colors
  }

  private processFonts(): FontInfo[] {
    return Array.from(this.fontFrequency.entries())
      .map(([fontKey, data]) => {
        const [family, weight, size] = fontKey.split('|')
        return {
          family: family.replace(/"/g, '').split(',')[0].trim(),
          weight,
          size,
          lineHeight: '1.5', // Will be extracted properly later
          elements: data.elements,
          category: data.category as 'heading' | 'body' | 'accent'
        }
      })
      .sort((a, b) => this.fontFrequency.get(`${a.family}|${a.weight}|${a.size}`)!.count - 
                     this.fontFrequency.get(`${b.family}|${b.weight}|${b.size}`)!.count)
      .reverse()
      .slice(0, 10) // Limit to top 10 fonts
  }

  private extractSpacingFromElement(element: Element): void {
    const margin = getComputedStyleProperty(element, 'margin')
    const padding = getComputedStyleProperty(element, 'padding')
    const selector = getElementSelector(element)

    if (margin && margin !== '0px') {
      this.addSpacingToFrequency(margin, selector, 'margin')
    }

    if (padding && padding !== '0px') {
      this.addSpacingToFrequency(padding, selector, 'padding')
    }
  }

  private addSpacingToFrequency(value: string, selector: string, type: 'margin' | 'padding'): void {
    // Parse shorthand values (e.g., "10px 20px" -> ["10px", "20px"])
    const values = value.split(' ').filter(v => v && v !== '0px')
    
    values.forEach(val => {
      const pixels = parseSpacing(val)
      if (pixels > 0 && pixels < 200) { // Reasonable spacing range
        const key = `${type}|${val}`
        
        if (this.spacingFrequency.has(key)) {
          const existing = this.spacingFrequency.get(key)!
          existing.count++
          if (!existing.elements.includes(selector)) {
            existing.elements.push(selector)
          }
        } else {
          this.spacingFrequency.set(key, {
            count: 1,
            elements: [selector],
            type
          })
        }
      }
    })
  }

  private processSpacing(): SpacingInfo[] {
    return Array.from(this.spacingFrequency.entries())
      .map(([key, data]) => {
        const [type, value] = key.split('|')
        return {
          type: type as 'margin' | 'padding',
          value,
          tailwindClass: getTailwindSpacingClass(type as 'margin' | 'padding', value),
          frequency: data.count,
          elements: data.elements
        }
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 12) // Limit to top 12 spacing values
  }
}