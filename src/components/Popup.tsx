import { useState } from 'react'
import { ThemeData } from '../types/theme'

export default function Popup() {
  const [theme, setTheme] = useState<ThemeData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState<'tailwind' | 'scss' | 'css'>('tailwind')

  const extractTheme = async () => {
    setIsLoading(true)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const response = await chrome.tabs.sendMessage(tab.id!, { action: 'extractTheme' })
      
      if (response.success) {
        setTheme(response.theme)
      } else {
        console.error('Theme extraction failed:', response.error)
        alert(`Failed to extract theme: ${response.error}`)
      }
    } catch (error) {
      console.error('Error extracting theme:', error)
      alert('Failed to extract theme. Make sure you\'re on a valid webpage.')
    } finally {
      setIsLoading(false)
    }
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
          {isLoading ? 'Extracting...' : 'Extract Theme'}
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

          <div className="pt-2 border-t border-gray-200">
            <button className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {!theme && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Click "Extract Theme" to analyze the current page</p>
        </div>
      )}
    </div>
  )
}