export function getComputedStyleProperty(element: Element, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property)
}

export function getAllElements(): Element[] {
  return Array.from(document.querySelectorAll('*'))
}

export function getKeyElements(): Element[] {
  const selectors = [
    'h1, h2, h3, h4, h5, h6',
    'p, span, div, a',
    'button, input, select, textarea',
    'nav, header, footer, main, section, article',
    '[class*="btn"], [class*="button"]',
    '[class*="card"], [class*="panel"]',
    '[class*="nav"], [class*="menu"]',
    '[class*="header"], [class*="hero"]',
    '[class*="content"], [class*="container"]'
  ]
  
  const elements = new Set<Element>()
  
  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach(el => elements.add(el))
  }
  
  return Array.from(elements)
}

export function getElementSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`
  }
  
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim())
    if (classes.length > 0) {
      return `.${classes[0]}`
    }
  }
  
  return element.tagName.toLowerCase()
}

export function isVisibleElement(element: Element): boolean {
  const style = window.getComputedStyle(element)
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.getBoundingClientRect().width > 0 &&
         element.getBoundingClientRect().height > 0
}

export function isContentElement(element: Element): boolean {
  return !element.matches('script, style, meta, link, title, head')
}

export function filterDesignElements(elements: Element[]): Element[] {
  return elements.filter(el => 
    isVisibleElement(el) && 
    isContentElement(el) &&
    !el.closest('script, style, noscript, iframe')
  )
}