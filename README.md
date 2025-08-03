# ThemeSnatcher

A Chrome extension that extracts design system variables (colors, fonts, spacing) from any website and exports them as ready-to-use code in multiple formats.

## ✨ Features

- **🎨 Color Extraction**: Automatically identifies and categorizes colors by role (primary, secondary, background, text, etc.)
- **📝 Typography Analysis**: Extracts font families, weights, and sizes with context-aware categorization
- **🔍 CSS Variable Detection**: Intelligently parses CSS custom properties from stylesheets
- **📱 Visual Preview**: Shows how extracted colors and fonts work together
- **📤 Multiple Export Formats**: Generate code for Tailwind CSS, SCSS variables, or CSS custom properties
- **⚡ One-Click Operation**: Extract entire design systems with a single button click

## 🚀 Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## 📖 How to Use

1. Navigate to any website whose design system you want to extract
2. Click the ThemeSnatcher extension icon in your browser toolbar
3. Click "Snatch Theme" to analyze the current page
4. Review the extracted colors and typography in the popup
5. Choose your preferred export format (Tailwind, SCSS, or CSS)
6. Copy the generated code or download it as a file

## 🎯 What Gets Extracted

### Colors
- **Smart categorization** by role (primary, secondary, accent, background, text, etc.)
- **CSS variable detection** with original variable names preserved
- **Context analysis** to understand where colors are used (buttons, navigation, headings, etc.)
- **Frequency analysis** to identify the most important colors

### Typography
- **Font families** with fallback stacks
- **Font weights and sizes**
- **Role-based categorization** (heading, body, accent fonts)
- **Usage context** (where each font is applied)

### Export Formats

#### Tailwind CSS Config
```javascript
export default {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        background: '#ffffff'
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body: ['Roboto', 'sans-serif']
      }
    }
  }
}
```

#### SCSS Variables
```scss
// Colors
$primary: #3b82f6;
$secondary: #64748b;
$background: #ffffff;

// Typography
$font-heading: Inter, sans-serif;
$font-heading-weight: 600;
$font-heading-size: 24px;
```

#### CSS Custom Properties
```css
:root {
  --primary: #3b82f6;
  --secondary: #64748b;
  --background: #ffffff;
  --font-heading: Inter, sans-serif;
  --font-heading-weight: 600;
  --font-heading-size: 24px;
}
```

## 🔧 Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

### Project Structure
```
src/
├── components/         # React components
│   └── Popup.tsx      # Main popup interface
├── types/             # TypeScript type definitions
│   └── theme.ts       # Theme data structures
├── utils/             # Utility functions
│   ├── exporters.ts   # Code generation for different formats
│   ├── themeExtractor.ts
│   └── ...
├── manifest.json      # Extension manifest
├── popup.html        # Popup HTML template
└── background.ts     # Background service worker
```

## 🎨 Use Cases

- **Design System Migration**: Quickly extract existing design tokens when moving to a new framework
- **Brand Analysis**: Understand the design language of competitor websites
- **Design Consistency**: Audit color and typography usage across different pages
- **Development Acceleration**: Jump-start new projects with proven design patterns
- **Learning**: Reverse-engineer professional design systems

## ⚠️ Limitations

- Cannot extract themes from Chrome internal pages (`chrome://` URLs)
- Some websites with heavy CSS-in-JS or dynamic styling may have limited extraction
- Complex color functions (gradients, calc(), etc.) are simplified to their computed values
- Requires appropriate permissions to access the current tab

## 🛡️ Privacy

ThemeSnatcher only analyzes the visual styling of web pages you visit when you explicitly click "Snatch Theme". No data is collected, stored remotely, or transmitted to external servers. All analysis happens locally in your browser.

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---