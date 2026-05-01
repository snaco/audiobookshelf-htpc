/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        dark: '#0a0a0a',
        darker: '#050505',
        surface: '#1a1a1a',
        surfaceHighlight: '#2a2a2a',
      },
      fontSize: {
        'htpc-sm': '1.25rem',
        'htpc-base': '1.5rem',
        'htpc-lg': '2rem',
        'htpc-xl': '2.5rem',
        'htpc-2xl': '3rem',
        'htpc-3xl': '4rem',
      },
      spacing: {
        'htpc-1': '0.5rem',
        'htpc-2': '1rem',
        'htpc-3': '1.5rem',
        'htpc-4': '2rem',
        'htpc-6': '3rem',
        'htpc-8': '4rem',
      }
    },
  },
  plugins: [],
}
