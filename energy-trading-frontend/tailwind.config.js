module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': 'hsl(0, 0, 0)',
        'bg': 'hsl(0, 0, 5)',
        'bg-light': 'hsl(0, 0, 10)'
      }
    },
  },
  plugins: [],
}