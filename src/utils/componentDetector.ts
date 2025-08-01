import { ComponentInfo } from '../types/theme'
import { getComputedStyleProperty, getElementSelector } from './domUtils'

export class ComponentDetector {
  private componentFrequency = new Map<string, { count: number; styles: any }>()

  detectComponents(): ComponentInfo[] {
    this.componentFrequency.clear()
    
    this.detectButtons()
    this.detectCards()
    this.detectForms()
    this.detectNavigation()
    this.detectHeroSections()
    this.detectContainers()
    
    return this.processComponents()
  }

  private detectButtons(): void {
    const buttonSelectors = [
      'button',
      'input[type="button"]',
      'input[type="submit"]',
      '[role="button"]',
      '[class*="btn"]',
      '[class*="button"]',
      'a[class*="btn"]'
    ]
    
    buttonSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        if (this.isVisibleElement(element)) {
          this.analyzeComponent(element, 'button')
        }
      })
    })
  }

  private detectCards(): void {
    const cardSelectors = [
      '[class*="card"]',
      '[class*="panel"]',
      '[class*="tile"]',
      'article',
      '[class*="box"]'
    ]
    
    cardSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        if (this.isVisibleElement(element) && this.hasCardLikeStyles(element)) {
          this.analyzeComponent(element, 'card')
        }
      })
    })
  }

  private detectForms(): void {
    const formElements = document.querySelectorAll('form, [class*="form"]')
    formElements.forEach(element => {
      if (this.isVisibleElement(element)) {
        this.analyzeComponent(element, 'form')
      }
    })
  }

  private detectNavigation(): void {
    const navSelectors = [
      'nav',
      '[class*="nav"]',
      '[class*="menu"]',
      '[role="navigation"]',
      'header nav',
      '[class*="navbar"]'
    ]
    
    navSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        if (this.isVisibleElement(element)) {
          this.analyzeComponent(element, 'nav')
        }
      })
    })
  }

  private detectHeroSections(): void {
    const heroSelectors = [
      '[class*="hero"]',
      '[class*="banner"]',
      '[class*="jumbotron"]',
      'header[class*="main"]',
      'section:first-of-type'
    ]
    
    heroSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        if (this.isVisibleElement(element) && this.hasHeroLikeStyles(element)) {
          this.analyzeComponent(element, 'hero')
        }
      })
    })
  }

  private detectContainers(): void {
    const containerSelectors = [
      '[class*="container"]',
      '[class*="wrapper"]',
      '[class*="content"]',
      'main',
      '[class*="layout"]'
    ]
    
    containerSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        if (this.isVisibleElement(element) && this.hasContainerLikeStyles(element)) {
          this.analyzeComponent(element, 'container')
        }
      })
    })
  }

  private analyzeComponent(element: Element, type: ComponentInfo['type']): void {
    const styles = {
      borderRadius: getComputedStyleProperty(element, 'border-radius'),
      boxShadow: getComputedStyleProperty(element, 'box-shadow'),
      border: getComputedStyleProperty(element, 'border'),
      backgroundColor: getComputedStyleProperty(element, 'background-color'),
      padding: getComputedStyleProperty(element, 'padding'),
      margin: getComputedStyleProperty(element, 'margin')
    }

    // Create a key based on similar styles
    const styleKey = `${type}|${styles.borderRadius}|${styles.boxShadow}|${styles.backgroundColor}`
    
    if (this.componentFrequency.has(styleKey)) {
      this.componentFrequency.get(styleKey)!.count++
    } else {
      this.componentFrequency.set(styleKey, {
        count: 1,
        styles: { ...styles, type, selector: getElementSelector(element) }
      })
    }
  }

  private hasCardLikeStyles(element: Element): boolean {
    const borderRadius = getComputedStyleProperty(element, 'border-radius')
    const boxShadow = getComputedStyleProperty(element, 'box-shadow')
    const border = getComputedStyleProperty(element, 'border')
    
    return borderRadius !== '0px' || 
           boxShadow !== 'none' || 
           (border !== 'none' && border !== '0px none')
  }

  private hasHeroLikeStyles(element: Element): boolean {
    const rect = element.getBoundingClientRect()
    return rect.height > 200 && rect.width > 300
  }

  private hasContainerLikeStyles(element: Element): boolean {
    const maxWidth = getComputedStyleProperty(element, 'max-width')
    const margin = getComputedStyleProperty(element, 'margin')
    
    return maxWidth !== 'none' || margin.includes('auto')
  }

  private isVisibleElement(element: Element): boolean {
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           rect.width > 0 &&
           rect.height > 0
  }

  private processComponents(): ComponentInfo[] {
    return Array.from(this.componentFrequency.entries())
      .map(([, data]) => ({
        type: data.styles.type,
        selector: data.styles.selector,
        styles: {
          borderRadius: data.styles.borderRadius !== '0px' ? data.styles.borderRadius : undefined,
          boxShadow: data.styles.boxShadow !== 'none' ? data.styles.boxShadow : undefined,
          border: data.styles.border !== 'none' && data.styles.border !== '0px none' ? data.styles.border : undefined,
          backgroundColor: data.styles.backgroundColor,
          padding: data.styles.padding,
          margin: data.styles.margin
        },
        frequency: data.count
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15)
  }
}