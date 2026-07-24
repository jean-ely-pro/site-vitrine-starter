// Tailwind v4 is applied through its PostCSS plugin. Public rendering only —
// the admin ships its own styles.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
