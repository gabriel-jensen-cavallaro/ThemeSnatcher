import { ColorInfo } from '../types/theme'
import { parseColor, getColorDistance } from './colorUtils'

export class SmartFilter {
  private adSelectors = [
    '[class*="ad"]',
    '[class*="advertisement"]',
    '[class*="sponsor"]',
    '[class*="promo"]',
    '[id*="ad"]',
    '[data-ad]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]'
  ]

  private nonDesignSelectors = [
    'img',
    'video',
    'canvas',
    'svg',
    'picture',
    '[class*="icon"]',
    '[class*="emoji"]',
    'code',
    'pre'
  ]

  filterDesignColors(colors: ColorInfo[], _elements: Element[]): ColorInfo[] {
    return colors.filter(color => {
      // Filter out colors from ads
      if (this.isFromAd(color)) return false
      
      // Filter out colors from images/media
      if (this.isFromMedia(color)) return false
      
      // Filter out very low frequency colors (likely noise)
      if (color.frequency < 2) return false
      
      // Filter out colors that are too similar to common browser defaults
      if (this.isBrowserDefault(color)) return false
      
      // Keep colors that appear to be intentional design choices
      return this.isIntentionalDesignColor(color)
    })
  }

  prioritizeDesignElements(elements: Element[]): Element[] {
    return elements
      .filter(el => !this.isAdElement(el))
      .filter(el => !this.isMediaElement(el))
      .filter(el => this.isDesignRelevant(el))
      .sort((a, b) => this.getDesignPriority(b) - this.getDesignPriority(a))
  }

  detectDarkMode(): boolean {
    const body = document.body
    const html = document.documentElement
    
    // Check background colors
    const bodyBg = window.getComputedStyle(body).backgroundColor
    const htmlBg = window.getComputedStyle(html).backgroundColor
    
    const backgrounds = [bodyBg, htmlBg].filter(bg => bg && bg !== 'transparent')
    
    for (const bg of backgrounds) {
      const color = parseColor(bg)
      if (color) {
        const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000
        if (brightness < 128) return true
      }
    }

    // Check for dark mode classes
    const darkModeClasses = ['dark', 'dark-mode', 'theme-dark', 'night-mode']
    const hasClass = darkModeClasses.some(cls => 
      body.classList.contains(cls) || html.classList.contains(cls)
    )
    
    return hasClass
  }

  private isFromAd(color: ColorInfo): boolean {
    return color.elements.some(selector => {
      const element = document.querySelector(selector)
      return element && this.isAdElement(element)
    })
  }

  private isFromMedia(color: ColorInfo): boolean {
    return color.elements.some(selector => {
      const element = document.querySelector(selector)
      return element && this.isMediaElement(element)
    })
  }

  private isAdElement(element: Element): boolean {
    // Check if element or its parents match ad selectors
    return this.adSelectors.some(selector => {
      try {
        return element.matches(selector) || element.closest(selector)
      } catch {
        return false
      }
    })
  }

  private isMediaElement(element: Element): boolean {
    return this.nonDesignSelectors.some(selector => {
      try {
        return element.matches(selector)
      } catch {
        return false
      }
    })
  }

  private isDesignRelevant(element: Element): boolean {
    // Prioritize semantic and commonly styled elements
    const importantSelectors = [
      'h1, h2, h3, h4, h5, h6',
      'p, span, div',
      'button, input, select, textarea',
      'nav, header, footer, main, section, article',
      '[class*="btn"]', '[class*="button"]',
      '[class*="card"]', '[class*="panel"]',
      '[class*="nav"]', '[class*="menu"]'
    ]

    return importantSelectors.some(selector => {
      try {
        return element.matches(selector)
      } catch {
        return false
      }
    })
  }

  private getDesignPriority(element: Element): number {
    let priority = 0
    
    // Higher priority for interactive elements
    if (element.matches('button, input, select, textarea, a')) priority += 10
    
    // Higher priority for headings
    if (element.matches('h1, h2, h3, h4, h5, h6')) priority += 8
    
    // Higher priority for navigation
    if (element.matches('nav, [class*="nav"], [class*="menu"]')) priority += 7
    
    // Higher priority for cards/panels
    if (element.matches('[class*="card"], [class*="panel"]')) priority += 6
    
    // Higher priority for semantic elements
    if (element.matches('header, footer, main, section, article')) priority += 5
    
    // Bonus for having design-related classes
    const designKeywords = ['btn', 'button', 'card', 'panel', 'nav', 'menu', 'hero', 'banner']
    designKeywords.forEach(keyword => {
      if (element.className.includes(keyword)) priority += 2
    })
    
    return priority
  }

  private isBrowserDefault(color: ColorInfo): boolean {
    const commonDefaults = [
      '#000000', // Black
      '#ffffff', // White  
      '#0000ee', // Default link blue
      '#551a8b', // Default visited link purple
      '#008000', // Default active link green
      'rgb(0, 0, 238)', // Default link blue (rgb)
      'rgb(85, 26, 139)', // Default visited purple (rgb)
    ]
    
    return commonDefaults.includes(color.hex.toLowerCase())
  }

  private isIntentionalDesignColor(color: ColorInfo): boolean {
    // Colors with high frequency are likely intentional
    if (color.frequency >= 5) return true
    
    // Colors used in multiple categories are likely intentional
    const categories = new Set()
    color.elements.forEach(selector => {
      if (selector.includes('button') || selector.includes('btn')) categories.add('interactive')
      if (selector.includes('nav') || selector.includes('menu')) categories.add('navigation')
      if (selector.includes('card') || selector.includes('panel')) categories.add('content')
      if (selector.includes('h1') || selector.includes('h2')) categories.add('heading')
    })
    
    if (categories.size >= 2) return true
    
    // Colors that are not very close to white/black are more likely intentional
    const whiteDistance = getColorDistance(color.rgb, { r: 255, g: 255, b: 255 })
    const blackDistance = getColorDistance(color.rgb, { r: 0, g: 0, b: 0 })
    
    return whiteDistance > 50 && blackDistance > 50
  }
}