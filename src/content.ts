import { ThemeExtractor } from './utils/themeExtractor'

console.log('ThemeSnatcher content script loaded')

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'extractTheme') {
    try {
      const extractor = new ThemeExtractor()
      const theme = extractor.extractTheme()
      sendResponse({ theme, success: true })
    } catch (error) {
      console.error('Theme extraction failed:', error)
      sendResponse({ 
        theme: null, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }
  return true
})