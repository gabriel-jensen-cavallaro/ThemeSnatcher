console.log('ThemeSnatcher content script loaded')

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'extractTheme') {
    const theme = extractThemeFromPage()
    sendResponse({ theme })
  }
  return true
})

function extractThemeFromPage() {
  return {
    colors: ['#000000', '#ffffff'],
    fonts: ['Arial', 'sans-serif'],
    timestamp: Date.now()
  }
}