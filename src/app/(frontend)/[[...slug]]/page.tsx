import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { LegalPageView } from '../../../components/site/LegalPageView'
import { PageView } from '../../../components/site/PageView'
import { HOME_SLUG, serverUrl } from '../../../lib/constants'
import { buildPageMetadata } from '../../../lib/pageMetadata'
import {
  getPublishedLegalPage,
  getPublishedPage,
  getPublishedPages,
  getSiteGlobals,
} from '../../../lib/queries'

/**
 * Statically rendered and cached, then refreshed on demand when the owner saves
 * (see the revalidation hooks), with an hourly fallback.
 *
 * Except on a mutualised instance, where the client is named by a request
 * header: reading it makes the route dynamic, and a prerendered page would
 * either freeze one client's content for everyone or fail with
 * DYNAMIC_SERVER_USAGE. There, every request renders — which is also what the
 * static export needs, since it snapshots each client in turn.
 */
// Next.js exige une valeur littérale ici : elle ne peut pas dépendre de la
// configuration. force-dynamic convient aux deux modèles — une instance
// mutualisée en a besoin (le client vient d'un en-tête de requête), et une
// instance dédiée n'y perd rien, puisque le site livré est un export statique
// et que l'édition n'a pas à être mise en cache.
export const dynamic = 'force-dynamic'

type Params = { slug?: string[] }

// "/" and "/accueil" both resolve to the home page; its canonical address is "/".
const resolveSlug = (segments?: string[]) => segments?.[0] ?? HOME_SLUG
const pathFor = (slug: string) => (slug === HOME_SLUG ? '/' : `/${slug}`)

export async function generateStaticParams() {
  // Sur une instance mutualisée, prérendre reviendrait à figer les pages d'un
  // seul client pour tout le monde : le client n'est connu qu'à la requête.
  if (process.env.TENANT_FROM_HEADER === 'true') return []
  try {
    const pages = await getPublishedPages()
    return pages
      .filter((page) => page.slug && page.slug !== HOME_SLUG)
      .map((page) => ({ slug: [page.slug as string] }))
  } catch {
    // No database reachable — this is the case when building the Docker image.
    // Prerender nothing; each page renders on its first request and is cached
    // from then on, so the build never depends on a running database.
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug: segments } = await params
  const slug = resolveSlug(segments)

  const page = await getPublishedPage(slug)
  if (page) {
    const { identite } = await getSiteGlobals()
    return buildPageMetadata(page, identite, serverUrl(), pathFor(slug))
  }

  const legal = await getPublishedLegalPage(slug)
  if (legal) {
    return {
      title: legal.title || undefined,
      alternates: { canonical: new URL(pathFor(slug), serverUrl()).toString() },
    }
  }

  return {}
}

export default async function SitePage({ params }: { params: Promise<Params> }) {
  const { slug: segments } = await params
  const slug = resolveSlug(segments)
  const isHome = !segments || segments.length === 0

  const page = await getPublishedPage(slug)
  if (page) {
    const globals = await getSiteGlobals()
    return <PageView page={page} globals={globals} serverUrl={serverUrl()} />
  }

  // Legal pages live in their own collection but share these clean URLs.
  const legal = await getPublishedLegalPage(slug)
  if (legal) return <LegalPageView page={legal} />

  // A brand-new site has no home page yet: guide the owner instead of 404ing.
  if (isHome) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold">Bienvenue</h1>
        <p className="mt-4">
          Votre site est prêt. Pour afficher une page d’accueil, créez une page avec l’adresse
          « accueil » depuis l’espace d’administration, puis publiez-la.
        </p>
        <p className="mt-4">
          <a href="/admin" className="font-semibold text-brand underline">
            Accéder à l’espace d’administration
          </a>
        </p>
      </div>
    )
  }

  notFound()
}
