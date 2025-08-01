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
            const colors = new Map()
            const fonts = new Map()
            
            // Get all visible elements
            const elements = Array.from(document.querySelectorAll('*')).filter(el => {
              const style = window.getComputedStyle(el)
              const rect = el.getBoundingClientRect()
              return style.display !== 'none' && 
                     style.visibility !== 'hidden' && 
                     rect.width > 0 && rect.height > 0
            })
            
            console.log('Found elements:', elements.length)
            
            // Extract colors and fonts
            elements.forEach(element => {
              const style = window.getComputedStyle(element)
              
              // Colors
              const color = style.color
              const bgColor = style.backgroundColor
              if (color && color !== 'rgba(0, 0, 0, 0)') {
                colors.set(color, (colors.get(color) || 0) + 1)
              }
              if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
                colors.set(bgColor, (colors.get(bgColor) || 0) + 1)
              }
              
              // Fonts
              const fontFamily = style.fontFamily
              const fontSize = style.fontSize
              const fontWeight = style.fontWeight
              if (fontFamily) {
                const fontKey = `${fontFamily}|${fontWeight}|${fontSize}`
                fonts.set(fontKey, (fonts.get(fontKey) || 0) + 1)
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
            
            function rgbToHex(rgb: any) {
              const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
              if (match) {
                const r = parseInt(match[1])
                const g = parseInt(match[2])
                const b = parseInt(match[3])
                return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
              }
              return rgb
            }
            
            // Convert to arrays
            const colorArray = Array.from(colors.entries())
              .map(([color, freq]) => ({
                hex: color.startsWith('rgb') ? rgbToHex(color) : color,
                rgb: parseRgb(color),
                frequency: freq,
                elements: [],
                category: 'text'
              }))
              .sort((a, b) => b.frequency - a.frequency)
              .slice(0, 20)
            
            const fontArray = Array.from(fonts.entries())
              .map(([fontKey]) => {
                const [family, weight, size] = fontKey.split('|')
                return {
                  family: family.replace(/"/g, '').split(',')[0].trim(),
                  weight,
                  size,
                  lineHeight: '1.5',
                  elements: [],
                  category: 'body'
                }
              })
              .slice(0, 10)
            
            return {
              colors: colorArray,
              fonts: fontArray,
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
                      title={`${color.hex} (used ${color.frequency} times)`}
                    />
                    <div className="color-info">
                      <div className="color-hex">{color.hex}</div>
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
                    <div className="font-name" style={{ fontFamily: font.family }}>
                      {font.family}
                    </div>
                    <div className="font-details">
                      <span className="font-tag">{font.weight}</span>
                      <span className="font-tag">{font.size}</span>
                    </div>
                    <div className="font-sample" style={{ fontFamily: font.family }}>
                      The quick brown fox jumps over the lazy dog
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

              {/* Typography Preview */}
              <div className="preview-section">
                <h5 className="section-title">Typography Sample</h5>
                <div className="font-preview">
                  {theme.fonts.slice(0, 3).map((font, index) => (
                    <div
                      key={index}
                      className="font-preview-item"
                      style={{ 
                        fontFamily: font.family,
                        fontWeight: font.weight,
                        fontSize: font.size === '16px' ? '14px' : '12px'
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