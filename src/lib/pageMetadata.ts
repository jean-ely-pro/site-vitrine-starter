import type { Metadata } from 'next'

import type { Identite, Page } from '../payload-types'

/**
 * Per-page SEO. The page's own SEO title/description win; otherwise we fall back
 * to the page title and the company activity description, so no page ships
 * without a unique <title> and a meta description.
 */
export const buildPageMetadata = (
  page: Page,
  identite: Identite,
  serverUrl: string,
  path: string,
): Metadata => {
  const description = page.seo?.description || identite.activityDescription || undefined
  const canonical = new URL(path, serverUrl).toString()

  return {
    // An explicit SEO title is used as-is; otherwise the page title flows through
    // the site-wide "%s — Company" template for a unique, branded title.
    title: page.seo?.title ? { absolute: page.seo.title } : page.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: page.seo?.title || page.title,
      description,
      url: canonical,
      type: 'website',
      locale: 'fr_FR',
    },
  }
}
