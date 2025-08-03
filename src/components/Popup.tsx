import { useState } from 'react'
import { ThemeData } from '../types/theme'
import { ThemeExporter } from '../utils/exporters'

export default function Popup() {
  const [theme, setTheme] = useState<ThemeData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState<'tailwind' | 'scss' | 'css'>('tailwind')
  const [showPreview, setShowPreview] = useState(false)
  const exporter = new ThemeExporter()

  const extractTheme = async () => {
    setIsLoading(true)
    try {
      console.log('Getting active tab...')
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      console.log('Active tab:', tab)
      
      if (!tab.id) {
        throw new Error('No active tab found')
      }

      // Check if we can access the tab (not a chrome:// page)
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
        throw new Error('Cannot extract themes from Chrome internal pages. Please navigate to a regular website.')
      }

      // Inject the content script directly with the theme extraction code
      console.log('Injecting theme extraction code...')
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Inline theme extraction function
          function extractThemeFromPage() {
            const colorData = new Map()
            const fontData = new Map()
            const elementAnalysis = new Map()
            const cssVariables = new Map()
            
            // Extract CSS custom properties from all stylesheets
            function extractCSSVariables() {
              const variables = new Map()
              
              // Get all stylesheets
              for (const sheet of document.styleSheets) {
                try {
                  const rules = sheet.cssRules || sheet.rules
                  for (const rule of rules) {
                    if (rule.type === CSSRule.STYLE_RULE) {
                      const style = rule.style
                      for (let i = 0; i < style.length; i++) {
                        const property = style[i]
                        if (property.startsWith('--')) {
                          const value = style.getPropertyValue(property).trim()
                          if (value) {
                            // Categorize variable by name patterns
                            let category = 'other'
                            let role = null
                            
                            const name = property.toLowerCase()
                            if (name.includes('color') || name.includes('bg') || name.includes('background') || 
                                name.includes('text') || name.includes('primary') || name.includes('secondary') ||
                                name.includes('accent') || name.includes('surface') || name.includes('border')) {
                              category = 'color'
                              
                              if (name.includes('primary')) role = 'primary'
                              else if (name.includes('secondary')) role = 'secondary'
                              else if (name.includes('accent')) role = 'accent'
                              else if (name.includes('background') || name.includes('bg')) role = 'background'
                              else if (name.includes('surface')) role = 'surface'
                              else if (name.includes('text')) role = 'text'
                              else if (name.includes('border')) role = 'border'
                            } else if (name.includes('font') || name.includes('family')) {
                              category = 'font'
                            } else if (name.includes('space') || name.includes('gap') || name.includes('margin') || 
                                     name.includes('padding') || name.includes('size')) {
                              category = 'spacing'
                            }
                            
                            variables.set(property, {
                              value,
                              category,
                              role,
                              selector: rule.selectorText || ':root'
                            })
                          }
                        }
                      }
                    }
                  }
                } catch (e) {
                  // Skip stylesheets we can't access (CORS)
                  console.log('Skipping stylesheet due to access restrictions')
                }
              }
              
              // Also check :root computed styles for variables
              const rootStyles = getComputedStyle(document.documentElement)
              for (let i = 0; i < rootStyles.length; i++) {
                const property = rootStyles[i]
                if (property.startsWith('--')) {
                  const value = rootStyles.getPropertyValue(property).trim()
                  if (value && !variables.has(property)) {
                    let category = 'other'
                    let role = null
                    
                    const name = property.toLowerCase()
                    if (name.includes('color') || name.includes('bg') || name.includes('background') || 
                        name.includes('text') || name.includes('primary') || name.includes('secondary') ||
                        name.includes('accent') || name.includes('surface') || name.includes('border')) {
                      category = 'color'
                      
                      if (name.includes('primary')) role = 'primary'
                      else if (name.includes('secondary')) role = 'secondary'
                      else if (name.includes('accent')) role = 'accent'
                      else if (name.includes('background') || name.includes('bg')) role = 'background'
                      else if (name.includes('surface')) role = 'surface'
                      else if (name.includes('text')) role = 'text'
                      else if (name.includes('border')) role = 'border'
                    } else if (name.includes('font') || name.includes('family')) {
                      category = 'font'
                    } else if (name.includes('space') || name.includes('gap') || name.includes('margin') || 
                             name.includes('padding') || name.includes('size')) {
                      category = 'spacing'
                    }
                    
                    variables.set(property, {
                      value,
                      category,
                      role,
                      selector: ':root'
                    })
                  }
                }
              }
              
              return variables
            }
            
            console.log('Extracting CSS variables...')
            const extractedVariables = extractCSSVariables()
            console.log('Found CSS variables:', extractedVariables.size)
            
            // Get all visible elements
            const elements = Array.from(document.querySelectorAll('*')).filter(el => {
              const style = window.getComputedStyle(el)
              const rect = el.getBoundingClientRect()
              return style.display !== 'none' && 
                     style.visibility !== 'hidden' && 
                     rect.width > 0 && rect.height > 0 &&
                     rect.width > 1 && rect.height > 1 // Ignore tiny elements
            })
            
            console.log('Found elements:', elements.length)
            
            // First pass: Analyze specific element types to understand the page structure
            const buttons = elements.filter(el => 
              el.tagName.toLowerCase() === 'button' || 
              el.matches('[role="button"], .btn, .button, input[type="button"], input[type="submit"]') ||
              (el.tagName.toLowerCase() === 'a' && el.matches('.btn, .button'))
            )
            
            const headings = elements.filter(el => 
              ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(el.tagName.toLowerCase())
            )
            
            const links = elements.filter(el => 
              el.tagName.toLowerCase() === 'a' && !el.matches('.btn, .button')
            )
            
            const navElements = elements.filter(el => 
              el.closest('nav, .nav, .navbar, .navigation, header, .header') ||
              el.matches('nav, .nav, .navbar, .navigation, header, .header')
            )
            
            const cardElements = elements.filter(el => 
              el.matches('.card, .panel, .box, article, .post, .item') ||
              (el.children.length > 2 && window.getComputedStyle(el).border !== 'none')
            )
            
            console.log('Element analysis:', {
              buttons: buttons.length,
              headings: headings.length,
              links: links.length,
              navElements: navElements.length,
              cardElements: cardElements.length
            })
            
            // Extract colors with detailed context analysis
            elements.forEach(element => {
              const style = window.getComputedStyle(element)
              const tagName = element.tagName.toLowerCase()
              const rect = element.getBoundingClientRect()
              
              // Determine element role with more precision
              const isHeading = headings.includes(element)
              const isButton = buttons.includes(element)
              const isLink = links.includes(element)
              const isNavigation = navElements.includes(element)
              const isCard = cardElements.includes(element)
              const isBackground = ['body', 'html', 'main'].includes(tagName) || 
                                 element.matches('.bg, .background, .container, .wrapper') ||
                                 rect.width > window.innerWidth * 0.8 // Large elements likely backgrounds
              
              // Text colors with context
              const textColor = style.color
              if (textColor && 
                  textColor !== 'rgba(0, 0, 0, 0)' && 
                  textColor !== 'rgb(0, 0, 0)' && 
                  textColor !== 'transparent' &&
                  !textColor.includes('inherit') &&
                  textColor !== 'currentColor' &&
                  textColor !== 'initial' &&
                  textColor !== 'unset') {
                const key = textColor
                const existing = colorData.get(key) || { count: 0, contexts: new Set(), category: 'text' }
                existing.count++
                
                if (isHeading) existing.contexts.add('heading')
                else if (isButton) existing.contexts.add('button')
                else if (isLink) existing.contexts.add('link')
                else if (isNavigation) existing.contexts.add('navigation')
                else existing.contexts.add('body')
                
                colorData.set(key, existing)
              }
              
              // Background colors with context
              const bgColor = style.backgroundColor
              if (bgColor && 
                  bgColor !== 'rgba(0, 0, 0, 0)' && 
                  bgColor !== 'transparent' &&
                  !bgColor.includes('inherit') &&
                  bgColor !== 'currentColor' &&
                  bgColor !== 'initial' &&
                  bgColor !== 'unset') {
                const key = bgColor
                const existing = colorData.get(key) || { count: 0, contexts: new Set(), category: 'background' }
                existing.count++
                
                if (isButton) existing.contexts.add('button')
                else if (isCard) existing.contexts.add('card')
                else if (isNavigation) existing.contexts.add('navigation')
                else if (isBackground) existing.contexts.add('page')
                else existing.contexts.add('surface')
                
                colorData.set(key, existing)
              }
              
              // Fonts with better categorization
              const fontFamily = style.fontFamily
              const fontSize = style.fontSize
              const fontWeight = style.fontWeight
              if (fontFamily) {
                const fontKey = `${fontFamily}|${fontWeight}|${fontSize}`
                const existing = fontData.get(fontKey) || { count: 0, contexts: new Set() }
                existing.count++
                
                if (isHeading) existing.contexts.add('heading')
                else if (isButton) existing.contexts.add('button')
                else if (isNavigation) existing.contexts.add('navigation')
                else existing.contexts.add('body')
                
                fontData.set(fontKey, existing)
              }
            })
            
            // Helper functions
            function parseRgb(color: any) {
              if (color.startsWith('rgb')) {
                const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
                if (match) {
                  return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) }
                }
              }
              return { r: 0, g: 0, b: 0 }
            }
            
            function rgbToHex(color: any) {
              if (color.startsWith('#')) return color // Already hex
              
              // Handle rgb() format
              const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
              if (rgbMatch) {
                const r = parseInt(rgbMatch[1])
                const g = parseInt(rgbMatch[2])
                const b = parseInt(rgbMatch[3])
                return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
              }
              
              // Handle rgba() format
              const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/)
              if (rgbaMatch) {
                const r = parseInt(rgbaMatch[1])
                const g = parseInt(rgbaMatch[2])
                const b = parseInt(rgbaMatch[3])
                return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
              }
              
              // Skip modern CSS color formats that can't be easily converted
              if (color.includes('oklch') || 
                  color.includes('hsl') || 
                  color.includes('lab') || 
                  color.includes('lch') ||
                  color.includes('color(') ||
                  color.includes('var(') ||
                  color === 'currentColor' ||
                  color === 'inherit' ||
                  color === 'initial' ||
                  color === 'unset' ||
                  color === 'transparent') {
                return null // Skip these colors
              }
              
              return color // Return as-is for named colors like 'red', 'blue', etc.
            }
            
            // Smart color categorization
            function categorizeColors() {
              const sortedColors = Array.from(colorData.entries())
                .map(([color, data]) => ({
                  hex: rgbToHex(color), // Always convert to hex
                  rgb: parseRgb(color),
                  frequency: data.count,
                  contexts: Array.from(data.contexts),
                  category: data.category,
                  elements: []
                }))
                .filter(color => color.hex !== null) // Filter out unsupported color formats
                .sort((a, b) => b.frequency - a.frequency)
              
              // Assign semantic roles
              const categorized: any = {
                primary: null,
                secondary: null,
                accent: null,
                background: null,
                surface: null,
                text: null,
                textSecondary: null,
                button: null
              }
              
              // Find primary button/accent color
              const buttonColors = sortedColors.filter(c => c.contexts.includes('button'))
              if (buttonColors.length > 0) categorized.button = buttonColors[0]
              
              // Find background colors
              const bgColors = sortedColors.filter(c => c.category === 'background')
              if (bgColors.length > 0) {
                categorized.background = bgColors[0]
                if (bgColors.length > 1) categorized.surface = bgColors[1]
              }
              
              // Find text colors
              const textColors = sortedColors.filter(c => c.category === 'text')
              if (textColors.length > 0) {
                categorized.text = textColors[0]
                if (textColors.length > 1) categorized.textSecondary = textColors[1]
              }
              
              // Find primary brand color (often used in headings/navigation)
              const brandColors = sortedColors.filter(c => 
                c.contexts.includes('heading') || c.contexts.includes('navigation')
              )
              if (brandColors.length > 0) categorized.primary = brandColors[0]
              
              return Object.entries(categorized)
                .filter(([, color]) => color !== null)
                .map(([role, color]: any) => ({ ...color, role }))
            }
            
            // Smart font categorization
            function categorizeFonts() {
              const sortedFonts = Array.from(fontData.entries())
                .map(([fontKey, data]) => {
                  const [family, weight, size] = fontKey.split('|')
                  return {
                    family: family.replace(/"/g, '').split(',')[0].trim(),
                    weight,
                    size,
                    lineHeight: '1.5',
                    frequency: data.count,
                    contexts: Array.from(data.contexts),
                    elements: []
                  }
                })
                .sort((a, b) => b.frequency - a.frequency)
              
              // Assign semantic roles
              const headingFonts = sortedFonts.filter(f => f.contexts.includes('heading'))
              const bodyFonts = sortedFonts.filter(f => f.contexts.includes('body'))
              
              const result: any[] = []
              if (headingFonts.length > 0) {
                result.push({ ...headingFonts[0], category: 'heading', role: 'heading' })
              }
              if (bodyFonts.length > 0) {
                result.push({ ...bodyFonts[0], category: 'body', role: 'body' })
              }
              
              // Add other unique fonts
              sortedFonts.slice(0, 8).forEach(font => {
                if (!result.some(f => f.family === font.family)) {
                  result.push({ 
                    ...font, 
                    category: font.contexts.includes('heading') ? 'heading' : 'body',
                    role: 'accent'
                  })
                }
              })
              
              return result.slice(0, 6)
            }
            
            const colors = categorizeColors()
            const fonts = categorizeFonts()
            
            // Process CSS variables and add them to colors with high priority
            const cssVariableColors = []
            for (const [name, data] of extractedVariables) {
              if (data.category === 'color') {
                // Convert CSS value to hex if it's a recognizable color
                let hexValue = data.value
                if (data.value.startsWith('rgb(')) {
                  const rgbMatch = data.value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
                  if (rgbMatch) {
                    const r = parseInt(rgbMatch[1])
                    const g = parseInt(rgbMatch[2])
                    const b = parseInt(rgbMatch[3])
                    hexValue = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
                  }
                } else if (data.value.startsWith('#')) {
                  hexValue = data.value
                } else if (data.value.match(/^[a-zA-Z]+$/)) {
                  // Named colors - keep as is for now
                  hexValue = data.value
                }
                
                // Only add if it's a valid color format
                if (hexValue.startsWith('#') || hexValue.match(/^[a-zA-Z]+$/)) {
                  cssVariableColors.push({
                    hex: hexValue,
                    rgb: parseColor(hexValue),
                    frequency: 1000, // High priority for CSS variables
                    elements: [data.selector],
                    category: data.role === 'text' ? 'text' : 
                             data.role === 'background' ? 'background' : 
                             data.role === 'border' ? 'border' : 'accent',
                    role: data.role,
                    contexts: [name.replace('--', '')],
                    cssVariable: name
                  })
                }
              }
            }
            
            // Merge CSS variable colors with extracted colors, prioritizing variables
            const allColors = [...cssVariableColors, ...colors]
            
            return {
              colors: allColors,
              fonts,
              spacing: [],
              components: [],
              timestamp: Date.now(),
              url: window.location.href,
              isDarkMode: false
            }
          }
          
          return extractThemeFromPage()
        }
      })
      
      console.log('Theme extraction result:', result)
      
      if (result?.result) {
        setTheme(result.result as ThemeData)
      } else {
        throw new Error('Failed to extract theme data')
      }
    } catch (error) {
      console.error('Error extracting theme:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to extract theme: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  const generateExport = (): string => {
    if (!theme) return ''
    
    switch (exportFormat) {
      case 'tailwind':
        return exporter.exportTailwindConfig(theme)
      case 'scss':
        return exporter.exportSCSSVariables(theme)
      case 'css':
        return exporter.exportCSSCustomProperties(theme)
      default:
        return ''
    }
  }

  const copyToClipboard = async () => {
    const exportedCode = generateExport()
    try {
      await navigator.clipboard.writeText(exportedCode)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const downloadFile = () => {
    const exportedCode = generateExport()
    const extensions = { tailwind: 'js', scss: 'scss', css: 'css' }
    const extension = extensions[exportFormat]
    const filename = `theme-variables.${extension}`
    
    const blob = new Blob([exportedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Helper function to ensure good contrast
  const ensureContrast = (textColor: string, backgroundColor: string): string => {
    const contrast = getContrastRatio(textColor, backgroundColor)
    if (contrast < 4.5) {
      // If contrast is poor, use a high-contrast alternative
      const bgLuminance = getLuminance(backgroundColor)
      return bgLuminance > 0.5 ? '#000000' : '#ffffff'
    }
    return textColor
  }

  // Helper function to get appropriate button text color
  const getButtonTextColor = (buttonBgColor: string): string => {
    const luminance = getLuminance(buttonBgColor)
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  // Helper function to calculate luminance
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color)
    if (!rgb) return 0.5
    
    const { r, g, b } = rgb
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  // Helper function to calculate contrast ratio
  const getContrastRatio = (color1: string, color2: string): number => {
    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    return (brightest + 0.05) / (darkest + 0.05)
  }

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">TS</div>
            <h1 className="title">ThemeSnatcher</h1>
          </div>
          <button
            onClick={extractTheme}
            disabled={isLoading}
            className="extract-btn"
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Analyzing...
              </>
            ) : (
              'Snatch Theme'
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {/* Export Format Selection */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Export Format</h3>
            <div className="format-selector">
              {['tailwind', 'scss', 'css'].map((format) => (
                <button
                  key={format}
                  onClick={() => setExportFormat(format as 'tailwind' | 'scss' | 'css')}
                  className={`format-btn ${exportFormat === format ? 'active' : ''}`}
                >
                  {format === 'tailwind' ? 'Tailwind' : format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {theme && (
          <>
            {/* Colors Section */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  Colors <span className="count-badge">{theme.colors.length}</span>
                </h3>
              </div>
              <div className="colors-grid">
                {theme.colors.slice(0, 18).map((color, index) => (
                  <div key={index}>
                    <div
                      className="color-swatch"
                      style={{ backgroundColor: color.hex }}
                      title={`${color.role || color.category} - ${color.hex} (used ${color.frequency} times)`}
                    />
                    <div className="color-info">
                      <div className="color-hex">{color.hex}</div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                        {color.role || color.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {theme.colors.length > 18 && (
                <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#64748b' }}>
                  +{theme.colors.length - 18} more colors
                </div>
              )}
            </div>

            {/* Fonts Section */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  Typography <span className="count-badge">{theme.fonts.length}</span>
                </h3>
              </div>
              <div className="font-list">
                {theme.fonts.slice(0, 5).map((font, index) => (
                  <div key={index} className="font-item">
                    <div className="font-name" style={{ 
                      fontFamily: font.family?.replace(/['"]/g, '') || 
                                 '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      {font.family?.replace(/['"]/g, '') || 'System Font'}
                    </div>
                    <div className="font-details">
                      <span className="font-tag">{font.weight}</span>
                      <span className="font-tag">{font.size}</span>
                    </div>
                  </div>
                ))}
              </div>
              {theme.fonts.length > 5 && (
                <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#64748b' }}>
                  +{theme.fonts.length - 5} more fonts
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="card">
              <div className="actions">
                <div className="action-row">
                  <button onClick={copyToClipboard} className="btn-primary">
                    📋 Copy Code
                  </button>
                  <button onClick={downloadFile} className="btn-secondary">
                    💾 Download
                  </button>
                </div>
                <button 
                  onClick={() => setShowPreview(!showPreview)}
                  className="btn-outline"
                >
                  {showPreview ? '🙈 Hide Preview' : '👁️ Show Preview'}
                </button>
              </div>
            </div>
          </>
        )}

        {!theme && !isLoading && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🎨</div>
              <h3 className="empty-title">Ready to Snatch!</h3>
              <p className="empty-text">Navigate to any website and click "Snatch Theme" to extract its design system</p>
            </div>
          </div>
        )}

        {/* Enhanced Preview with Visual Colors */}
        {theme && showPreview && (
          <div className="preview-panel">
            <div className="preview-header">
              <h4 className="preview-title">Visual Preview</h4>
              <button 
                onClick={() => setShowPreview(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>
            
            <div className="preview-content">
              {/* Color Palette Preview */}
              <div className="preview-section">
                <h5 className="section-title">Color Palette</h5>
                <div className="color-strip">
                  {theme.colors.slice(0, 10).map((color, index) => (
                    <div
                      key={index}
                      className="color-chip"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    />
                  ))}
                </div>
              </div>

              {/* Component Preview */}
              <div className="preview-section">
                <h5 className="section-title">Component Preview</h5>
                <div className="component-preview">
                  {/* Card Component using extracted theme */}
                  <div 
                    className="preview-card"
                    style={{ 
                      backgroundColor: theme.colors.find(c => c.cssVariable && (c.role === 'surface' || c.role === 'background'))?.hex || 
                                     theme.colors.find(c => c.role === 'surface')?.hex || 
                                     theme.colors.find(c => c.role === 'background')?.hex || 
                                     '#ffffff',
                      border: `1px solid ${theme.colors.find(c => c.cssVariable && c.role === 'border')?.hex || 
                                          theme.colors.find(c => c.role === 'text')?.hex || '#e5e7eb'}20`,
                      borderRadius: '8px',
                      padding: '16px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h3 
                      style={{ 
                        fontFamily: theme.fonts.find(f => f.role === 'heading')?.family?.replace(/['"]/g, '') || 
                                   theme.fonts[0]?.family?.replace(/['"]/g, '') || 
                                   '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: theme.fonts.find(f => f.role === 'heading')?.weight || '600',
                        fontSize: '16px',
                        color: ensureContrast(
                          theme.colors.find(c => c.cssVariable && c.role === 'primary')?.hex ||
                          theme.colors.find(c => c.role === 'primary')?.hex || 
                          theme.colors.find(c => c.cssVariable && c.role === 'text')?.hex ||
                          theme.colors.find(c => c.role === 'text')?.hex || 
                          '#1f2937',
                          theme.colors.find(c => c.cssVariable && (c.role === 'surface' || c.role === 'background'))?.hex || 
                          theme.colors.find(c => c.role === 'surface')?.hex || '#ffffff'
                        ),
                        margin: '0 0 8px 0'
                      }}
                    >
                      {theme.colors.find(c => c.role === 'primary') ? 'Brand Header' : 'Sample Card'}
                    </h3>
                    <p 
                      style={{ 
                        fontFamily: theme.fonts.find(f => f.role === 'body')?.family?.replace(/['"]/g, '') || 
                                   theme.fonts[0]?.family?.replace(/['"]/g, '') || 
                                   '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontSize: '14px',
                        color: ensureContrast(
                          theme.colors.find(c => c.cssVariable && c.role === 'textSecondary')?.hex ||
                          theme.colors.find(c => c.role === 'textSecondary')?.hex || 
                          theme.colors.find(c => c.cssVariable && c.role === 'text')?.hex ||
                          theme.colors.find(c => c.role === 'text')?.hex || 
                          '#6b7280',
                          theme.colors.find(c => c.cssVariable && (c.role === 'surface' || c.role === 'background'))?.hex || 
                          theme.colors.find(c => c.role === 'surface')?.hex || '#ffffff'
                        ),
                        margin: '0 0 12px 0',
                        lineHeight: '1.5'
                      }}
                    >
                      This preview uses the actual {theme.colors.length} colors and {theme.fonts.length} fonts extracted from the website to show how they work together.
                    </p>
                    <button
                      style={{
                        backgroundColor: theme.colors.find(c => c.cssVariable && c.role === 'button')?.hex ||
                                       theme.colors.find(c => c.role === 'button')?.hex || 
                                       theme.colors.find(c => c.cssVariable && c.role === 'primary')?.hex ||
                                       theme.colors.find(c => c.role === 'primary')?.hex || 
                                       '#3b82f6',
                        color: getButtonTextColor(
                          theme.colors.find(c => c.cssVariable && c.role === 'button')?.hex ||
                          theme.colors.find(c => c.role === 'button')?.hex || 
                          theme.colors.find(c => c.cssVariable && c.role === 'primary')?.hex ||
                          theme.colors.find(c => c.role === 'primary')?.hex || 
                          '#3b82f6'
                        ),
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: theme.fonts.find(f => f.role === 'heading')?.family?.replace(/['"]/g, '') || 
                                   theme.fonts[0]?.family?.replace(/['"]/g, '') || 
                                   '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {theme.colors.find(c => c.role === 'button') ? 'Call to Action' : 'Button'}
                    </button>
                  </div>

                  {/* Navigation Bar Preview */}
                  <div 
                    className="preview-nav"
                    style={{ 
                      backgroundColor: theme.colors[1]?.hex || '#f9fafb',
                      border: `1px solid ${theme.colors[2]?.hex || '#e5e7eb'}`,
                      borderRadius: '6px',
                      padding: '8px 12px',
                      marginTop: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span 
                      style={{ 
                        fontFamily: theme.fonts[0]?.family?.replace(/['"]/g, '') || 
                                   '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: '600',
                        fontSize: '12px',
                        color: ensureContrast(
                          theme.colors[3]?.hex || '#374151',
                          theme.colors[1]?.hex || '#f9fafb'
                        )
                      }}
                    >
                      Navigation
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {theme.colors.slice(0, 3).map((color, index) => (
                        <div
                          key={index}
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: color.hex
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography Preview */}
              <div className="preview-section">
                <h5 className="section-title">Typography Sample</h5>
                <div className="font-preview">
                  {theme.fonts.slice(0, 3).map((font, index) => (
                    <div
                      key={index}
                      className="font-preview-item"
                      style={{ 
                        fontFamily: font.family?.replace(/['"]/g, '') || 
                                   '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: font.weight,
                        fontSize: font.size === '16px' ? '14px' : '12px',
                        color: '#334155'
                      }}
                    >
                      {font.family} - Sample text
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Preview */}
              <div className="preview-section">
                <h5 className="section-title">Code Export ({exportFormat})</h5>
                <div className="code-preview">
                  <pre>
                    {generateExport().slice(0, 600)}
                    {generateExport().length > 600 && '\n...\n// Truncated for preview'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}