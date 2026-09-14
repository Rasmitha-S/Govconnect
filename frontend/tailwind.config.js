/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // GovTech Design System Standard Colors
        gov: {
          primary: '#123B6D',      // Deep Government Blue
          'primary-dark': '#0B2A4A', // Dark Navy
          secondary: '#087F8C',    // Professional Teal
          accent: '#F4A340',       // Warm Saffron
          success: '#198754',      // Success Green
          warning: '#D99000',      // Warning Amber
          error: '#C0392B',        // Error / Danger Red
          bg: '#F5F7FA',           // Light Neutral Background
          surface: '#FFFFFF',      // Card / Panel Surface
          'text-primary': '#172033', // Deep Slate
          'text-secondary': '#5B667A', // Muted Slate
          border: '#DDE3EA',       // Subtle Border
          
          // Backward-compatibility aliases
          navy: '#0B2A4A',
          blue: '#123B6D',
          lightBlue: '#1D70B8',
          sky: '#EBF3FA',
          slate: '#172033',
          muted: '#5B667A',
          card: '#FFFFFF',
          emerald: '#198754',
          amber: '#D99000',
          rose: '#C0392B',
          saffron: '#F4A340',
          teal: '#087F8C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'gov-sm': '0 1px 2px 0 rgba(23, 32, 51, 0.05)',
        'gov': '0 1px 3px 0 rgba(23, 32, 51, 0.08), 0 1px 2px -1px rgba(23, 32, 51, 0.08)',
        'gov-md': '0 4px 8px -2px rgba(23, 32, 51, 0.08), 0 2px 4px -2px rgba(23, 32, 51, 0.06)',
        'gov-lg': '0 12px 20px -4px rgba(23, 32, 51, 0.09), 0 4px 6px -2px rgba(23, 32, 51, 0.05)',
      },
      borderRadius: {
        'gov': '12px',
      }
    },
  },
  plugins: [],
}
