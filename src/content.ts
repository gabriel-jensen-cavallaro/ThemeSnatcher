import { ThemeExtractor } from './utils/themeExtractor'

console.log('ThemeSnatcher content script loaded')

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Content script received message:', request)
  
  if (request.action === 'extractTheme') {
    try {
      console.log('Starting theme extraction...')
      const extractor = new ThemeExtractor()
      const theme = extractor.extractTheme()
      console.log('Theme extracted successfully:', theme)
      sendResponse({ theme, success: true })
    } catch (error) {
      console.error('Theme extraction failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error details:', errorMessage)
      sendResponse({ 
        theme: null, 
        success: false, 
        error: errorMessage
      })
    }
  }
  return true
})