

export default {
  darkMode: 'class',
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        royal: '#1E3A8A',
        gold: '#D4AF37',
        sand: '#F3EFE6',
        offwhite: '#FAFAF7',
        navy: '#0F172A',
        // Dark mode tokens
        midnight: '#0B1120',
        slate: {
          card: '#1A2236',
          border: '#243049',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '25px',
        '3xl': '32px',
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0,0,0,0.05)',
        'soft-dark': '0 8px 30px rgba(0,0,0,0.4)',
        'glow': '0 0 20px rgba(212, 168, 90, 0.4)',
        'glow-strong': '0 0 30px rgba(212, 168, 90, 0.6)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}

