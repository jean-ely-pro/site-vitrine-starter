import type { MetadataRoute } from 'next'

import { serverUrl } from '../lib/constants'

// Built per request: the sitemap address depends on the instance, and a
// prerendered robots.txt would ship the build-time fallback to every client.
export const dynamic = 'force-dynamic'

// Allow crawling of the public site; keep the admin out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin',
    },
    sitemap: new URL('/sitemap.xml', serverUrl()).toString(),
  }
}
