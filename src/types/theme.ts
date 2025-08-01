export interface ColorInfo {
  hex: string
  rgb: { r: number; g: number; b: number }
  frequency: number
  elements: string[]
  category: 'background' | 'text' | 'border' | 'accent'
}

export interface FontInfo {
  family: string
  weight: string
  size: string
  lineHeight: string
  elements: string[]
  category: 'heading' | 'body' | 'accent'
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