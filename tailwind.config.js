/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./www/**/*.{html,js}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quantico', 'sans-serif']
      }
    }
  },
  plugins: [
    // Add custom variants for iOS and Android
    function ({ addVariant }) {
      addVariant('ios', ':where(.ios) &');
      addVariant('android', ':where(.android) &');
    }
  ],
}
