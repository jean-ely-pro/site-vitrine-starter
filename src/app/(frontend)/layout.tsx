import type { Metadata } from 'next'
import React from 'react'

import { SiteFooter } from '../../components/site/SiteFooter'
import { SiteHeader } from '../../components/site/SiteHeader'
import { brandColorStyle } from '../../lib/colorStyle'
import { serverUrl } from '../../lib/constants'
import { getPublishedLegalPages, getSiteGlobals } from '../../lib/queries'

import './styles.css'

// Site-wide metadata. Per-page titles slot into the template, so every page has
// a unique <title>; the default description comes from the company identity.
export async function generateMetadata(): Promise<Metadata> {
  try {
    const { identite } = await getSiteGlobals()
    return {
      metadataBase: new URL(serverUrl()),
      title: {
        default: identite.companyName || 'Site vitrine',
        template: `%s — ${identite.companyName || 'Site vitrine'}`,
      },
      description: identite.activityDescription || undefined,
    }
  } catch {
    // No database (e.g. building the Docker image) — a safe default.
    return { metadataBase: new URL(serverUrl()), title: 'Site vitrine' }
  }
}

// Public site root layout. Document language is French — never inherit "en".
export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  // Resilient to a missing database: when the image builds without one, the
  // shell renders minimally rather than failing the build. The full header and
  // footer come back as soon as the data is reachable at request time.
  let site: Awaited<ReturnType<typeof getSiteGlobals>> | null = null
  let legalPages: Awaited<ReturnType<typeof getPublishedLegalPages>> = []
  try {
    site = await getSiteGlobals()
    legalPages = await getPublishedLegalPages()
  } catch {
    site = null
  }

  const year = new Date().getFullYear()

  return (
    <html lang="fr">
      <body>
        {site ? (
          <style dangerouslySetInnerHTML={{ __html: brandColorStyle(site.couleurs) }} />
        ) : null}
        <a href="#contenu" className="skip-link">
          Aller au contenu
        </a>
        {site ? <SiteHeader identite={site.identite} menu={site.menu} /> : null}
        <main id="contenu">{children}</main>
        {site ? (
          <SiteFooter
            identite={site.identite}
            piedDePage={site.piedDePage}
            reseaux={site.reseaux}
            legalPages={legalPages}
            year={year}
          />
        ) : null}
      </body>
    </html>
  )
}
