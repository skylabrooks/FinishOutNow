/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // New "Soft Professional" Brand Palette
        brand: {
          primary: '#1e293b',   // Slate 800 - Deep, professional foundation
          secondary: '#0f766e', // Teal 700 - Growth and stability
          accent: '#6366f1',    // Indigo 500 - Soft modern highlights
          surface: '#ffffff',   // Pure white for cards
          background: '#f8fafc',// Slate 50 - Very soft, cool light gray
          text: {
            primary: '#0f172a', // Slate 900 - Softer than pure black
            secondary: '#64748b', // Slate 500 - Readable secondary text
            muted: '#94a3b8',   // Slate 400 - De-emphasized text
          }
        },
        // Semantic Status Colors (Softened)
        status: {
          success: '#10b981', // Emerald 500
          warning: '#f59e0b', // Amber 500
          error: '#ef4444',   // Red 500
          info: '#3b82f6',    // Blue 500
        },
        // Mapping existing color references to new palette for backward compatibility
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b', // Primary Brand Color
          900: '#0f172a',
          950: '#020617',
        },
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e', // Secondary Brand Color
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        }
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
      }
    },
  },
  plugins: [],
}