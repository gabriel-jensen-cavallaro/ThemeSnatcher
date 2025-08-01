console.log('ThemeSnatcher background script loaded')

chrome.runtime.onInstalled.addListener(() => {
  console.log('ThemeSnatcher extension installed')
})