import type { Metadata } from 'next'

import type { Category } from '../../../payload-types'
import { SiteImage } from '../../../components/site/SiteImage'
import { serverUrl } from '../../../lib/constants'
import { formatFrenchDate } from '../../../lib/formatDate'
import { getPublishedArticles, getSiteGlobals } from '../../../lib/queries'

// Rendered per request (not prerendered at build): it reads the current list of
// articles, and the image must build without a database.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { identite } = await getSiteGlobals()
  const canonical = new URL('/actualites', serverUrl()).toString()
  return {
    title: 'Actualités',
    description: `Toutes les actualités de ${identite.companyName || 'notre établissement'}.`,
    alternates: { canonical },
    openGraph: { title: 'Actualités', url: canonical, type: 'website', locale: 'fr_FR' },
  }
}

const categoryName = (category: unknown): string | null =>
  category && typeof category === 'object' ? ((category as Category).name ?? null) : null

export default async function ActualitesPage() {
  const articles = await getPublishedArticles()

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tight">Actualités</h1>

      {articles.length === 0 ? (
        <p className="mt-6">Aucune actualité pour le moment.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => {
            const cat = categoryName(article.category)
            return (
              <article key={article.id} className="flex flex-col overflow-hidden rounded-lg border border-black/10">
                {article.image ? (
                  <a href={`/actualites/${article.slug}`} tabIndex={-1} aria-hidden="true">
                    <SiteImage
                      media={article.image}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="aspect-video w-full object-cover"
                    />
                  </a>
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-sm text-ink">
                    {cat ? <span className="font-semibold text-brand">{cat}</span> : null}
                    {cat && article.publishedDate ? <span> · </span> : null}
                    {article.publishedDate ? (
                      <time dateTime={article.publishedDate}>{formatFrenchDate(article.publishedDate)}</time>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold">
                    <a href={`/actualites/${article.slug}`} className="hover:text-brand">
                      {article.title}
                    </a>
                  </h2>
                  {article.excerpt ? <p className="mt-2 flex-1">{article.excerpt}</p> : null}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
