/**
 * Turn a page title into a URL-safe slug: lower-cased, accents stripped,
 * non-alphanumeric runs collapsed to single hyphens. Kept dependency-free.
 */
export const slugify = (input: string): string =>
  input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // drop combining diacritics (é -> e)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
