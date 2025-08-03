export interface ColorInfo {
  hex: string
  rgb: { r: number; g: number; b: number }
  frequency: number
  elements: string[]
  category: 'background' | 'text' | 'border' | 'accent'
  role?: 'primary' | 'secondary' | 'accent' | 'background' | 'surface' | 'text' | 'textSecondary' | 'button' | 'border'
  contexts?: string[]
  cssVariable?: string // The original CSS variable name if extracted from CSS
}

export interface FontInfo {
  family: string
  weight: string
  size: string
  lineHeight: string
  elements: string[]
  category: 'heading' | 'body' | 'accent'
  role?: 'heading' | 'body' | 'accent'
  contexts?: string[]
}

export interface SpacingInfo {
  type: 'margin' | 'padding'
  value: string
  tailwindClass: string
  frequency: number
  elements: string[]
}

export interface ComponentInfo {
  type: 'button' | 'card' | 'form' | 'nav' | 'hero' | 'container'
  selector: string
  styles: {
    borderRadius?: string
    boxShadow?: string
    border?: string
    backgroundColor?: string
    padding?: string
    margin?: string
  }
  frequency: number
}

export interface ThemeData {
  colors: ColorInfo[]
  fonts: FontInfo[]
  spacing: SpacingInfo[]
  components: ComponentInfo[]
  timestamp: number
  url: string
  isDarkMode?: boolean
}

export interface ExtractedTheme {
  primaryColors: ColorInfo[]
  secondaryColors: ColorInfo[]
  textColors: ColorInfo[]
  backgroundColors: ColorInfo[]
  headingFonts: FontInfo[]
  bodyFonts: FontInfo[]
  spacing: SpacingInfo[]
}