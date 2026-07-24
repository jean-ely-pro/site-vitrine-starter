import type { MetadataRoute } from 'next'

import { SERVER_URL } from '../lib/constants'

// Allow crawling of the public site; keep the admin out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin',
    },
    sitemap: new URL('/sitemap.xml', SERVER_URL).toString(),
  }
}
