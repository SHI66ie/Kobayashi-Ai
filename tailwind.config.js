/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px', // Extra small screens
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      colors: {
        'toyota-red': '#EB0A1E',
        'racing-blue': '#0066CC',
        'track-gray': '#2A2A2A',
      },
      fontFamily: {
        'racing': ['Orbitron', 'monospace'],
      },
      fontSize: {
        '2xs': '0.625rem',
        '3xs': '0.5rem',
      },
      minWidth: {
        '44': '11rem',
        '48': '12rem',
        '52': '13rem',
      },
      minHeight: {
        '44': '11rem',
        '48': '12rem',
      },
    },
  },
  plugins: [],
}
