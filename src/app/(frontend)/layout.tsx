import type { Metadata } from 'next'
import React from 'react'

import { redirect } from 'next/navigation'

import { SiteFooter } from '../../components/site/SiteFooter'
import { SiteHeader } from '../../components/site/SiteHeader'
import { brandColorStyle } from '../../lib/colorStyle'
import { TenantNotServed } from '../../lib/currentTenant'
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
  // Un client suspendu ou archivé n'est plus servi. Traité ici plutôt que dans
  // chaque route : le layout enveloppe tout le site public, donc aucune adresse
  // n'y échappe — ni les actualités, ni les pages légales, ni une route ajoutée
  // plus tard.
  let unavailable: 'suspended' | 'archived' | null = null
  try {
    site = await getSiteGlobals()
    legalPages = await getPublishedLegalPages()
  } catch (error) {
    if (error instanceof TenantNotServed) {
      unavailable = error.status === 'archived' ? 'archived' : 'suspended'
    }
    site = null
  }

  // Redirigé vers une route plutôt que rendu ici : un layout répond 200, ce qui
  // ferait indexer « Site indisponible » comme le contenu du site. La route
  // répond 503 (ou 410 si archivé) et interdit l'indexation.
  if (unavailable) redirect(`/indisponible?etat=${unavailable}`)

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
