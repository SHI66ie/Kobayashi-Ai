/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'toyota-red': '#EB0A1E',
        'racing-blue': '#0066CC',
        'track-gray': '#2A2A2A',
      },
      fontFamily: {
        'racing': ['Orbitron', 'monospace'],
      },
    },
  },
  plugins: [],
}
