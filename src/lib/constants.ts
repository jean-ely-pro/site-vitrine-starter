// The page shown at the site root. The owner creates a normal page with this
// slug; it is served at "/" (and not repeated in the /[slug] sitemap entries).
export const HOME_SLUG = 'accueil'

/**
 * Public address of the site, for canonicals, JSON-LD, the sitemap and robots.
 *
 * Read at request time, on purpose. `NEXT_PUBLIC_*` variables are inlined into
 * the bundle when the image is built, and the image is shared by every client —
 * so a build-time value would bake one client's address into everyone's site.
 * `SERVER_URL` (no `NEXT_PUBLIC_` prefix) stays a real environment variable and
 * follows the instance it runs in.
 *
 * A function rather than a constant: a module-level constant is evaluated once
 * at import, which lets a prerender freeze the fallback into the output — the
 * exact failure this replaces, where robots.txt advertised localhost:3000.
 *
 * Server-only. A client component cannot read this; it needs a
 * `NEXT_PUBLIC_` variable or a prop (see components/admin/SeoPreview.tsx).
 */
export const serverUrl = () =>
  process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
