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
  margin: string
  padding: string
  elements: string[]
}

export interface ThemeData {
  colors: ColorInfo[]
  fonts: FontInfo[]
  spacing: SpacingInfo[]
  timestamp: number
  url: string
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