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
    <div className="w-80 p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-900">ThemeSnatcher</h1>
        <button
          onClick={extractTheme}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Snatching...' : 'Snatch theme'}
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Export Format:</label>
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'tailwind' | 'scss' | 'css')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="tailwind">Tailwind Config</option>
          <option value="scss">SCSS Variables</option>
          <option value="css">CSS Custom Properties</option>
        </select>
      </div>

      {theme && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Colors ({theme.colors.length})</h3>
            <div className="grid grid-cols-4 gap-2">
              {theme.colors.slice(0, 12).map((color, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: color.hex }}
                    title={`${color.hex} (${color.frequency} uses)`}
                  />
                  <span className="text-xs text-gray-600 mt-1">{color.hex}</span>
                  <span className="text-xs text-gray-400">{color.category}</span>
                </div>
              ))}
            </div>
            {theme.colors.length > 12 && (
              <p className="text-xs text-gray-500 mt-2">+{theme.colors.length - 12} more colors</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Fonts ({theme.fonts.length})</h3>
            <div className="space-y-1">
              {theme.fonts.slice(0, 6).map((font, index) => (
                <div key={index} className="text-sm text-gray-600 px-2 py-1 bg-gray-50 rounded">
                  <div className="font-medium">{font.family}</div>
                  <div className="text-xs text-gray-500">
                    {font.weight} • {font.size} • {font.category}
                  </div>
                </div>
              ))}
            </div>
            {theme.fonts.length > 6 && (
              <p className="text-xs text-gray-500 mt-2">+{theme.fonts.length - 6} more fonts</p>
            )}
          </div>

          {theme.spacing.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Spacing ({theme.spacing.length})</h3>
              <div className="grid grid-cols-2 gap-2">
                {theme.spacing.slice(0, 8).map((spacing, index) => (
                  <div key={index} className="text-xs text-gray-600 px-2 py-1 bg-gray-50 rounded">
                    <div className="font-medium">{spacing.tailwindClass}</div>
                    <div className="text-xs text-gray-500">{spacing.value} ({spacing.frequency}x)</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {theme.components.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Components ({theme.components.length})</h3>
              <div className="space-y-1">
                {theme.components.slice(0, 4).map((component, index) => (
                  <div key={index} className="text-xs text-gray-600 px-2 py-1 bg-gray-50 rounded">
                    <div className="font-medium capitalize">{component.type}</div>
                    <div className="text-xs text-gray-500">
                      {component.styles.borderRadius && `radius: ${component.styles.borderRadius}`}
                      {component.styles.boxShadow && component.styles.boxShadow !== 'none' && ` • shadow`}
                      {` • ${component.frequency}x`}
                    </div>
                  </div>
                ))}
              </div>
              {theme.components.length > 4 && (
                <p className="text-xs text-gray-500 mt-2">+{theme.components.length - 4} more components</p>
              )}
            </div>
          )}

          {theme.isDarkMode !== undefined && (
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${theme.isDarkMode ? 'bg-gray-800' : 'bg-yellow-400'}`}></span>
              {theme.isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </div>
          )}

          <div className="pt-2 border-t border-gray-200 space-y-2">
            <div className="flex gap-2">
              <button 
                onClick={copyToClipboard}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Copy to Clipboard
              </button>
              <button 
                onClick={downloadFile}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Download
              </button>
            </div>
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>
      )}

      {!theme && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Click "Extract Theme" to analyze the current page</p>
        </div>
      )}

      {theme && showPreview && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-700">Preview ({exportFormat})</h4>
            <button 
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-xs text-gray-600 max-h-32 overflow-y-auto">
            {generateExport().slice(0, 500)}
            {generateExport().length > 500 && '...'}
          </pre>
        </div>
      )}
    </div>
  )
}