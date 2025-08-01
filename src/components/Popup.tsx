import { useState } from 'react'

interface ThemeData {
  colors: string[]
  fonts: string[]
  timestamp: number
}

export default function Popup() {
  const [theme, setTheme] = useState<ThemeData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState<'tailwind' | 'scss' | 'css'>('tailwind')

  const extractTheme = async () => {
    setIsLoading(true)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const response = await chrome.tabs.sendMessage(tab.id!, { action: 'extractTheme' })
      setTheme(response.theme)
    } catch (error) {
      console.error('Error extracting theme:', error)
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
            <h3 className="text-sm font-medium text-gray-700 mb-2">Colors</h3>
            <div className="grid grid-cols-4 gap-2">
              {theme.colors.map((color, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-600 mt-1">{color}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Fonts</h3>
            <div className="space-y-1">
              {theme.fonts.map((font, index) => (
                <div key={index} className="text-sm text-gray-600 px-2 py-1 bg-gray-50 rounded">
                  {font}
                </div>
              ))}
            </div>
          </div>

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