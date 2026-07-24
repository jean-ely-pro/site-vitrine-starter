import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'

import type { Category } from '../../../../payload-types'
import { SiteImage } from '../../../../components/site/SiteImage'
import { SERVER_URL } from '../../../../lib/constants'
import { formatFrenchDate } from '../../../../lib/formatDate'
import { buildArticleJsonLd } from '../../../../lib/jsonLd'
import { getPublishedArticle, getSiteGlobals } from '../../../../lib/queries'

export const revalidate = 3600

type Params = { slug: string }

const categoryName = (category: unknown): string | null =>
  category && typeof category === 'object' ? ((category as Category).name ?? null) : null

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const article = await getPublishedArticle(slug)
  if (!article) return {}
  const { identite } = await getSiteGlobals()

  const description = article.seo?.description || article.excerpt || identite.activityDescription || undefined
  const canonical = new URL(`/actualites/${slug}`, SERVER_URL).toString()

  return {
    title: article.seo?.title ? { absolute: article.seo.title } : article.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: article.seo?.title || article.title,
      description,
      url: canonical,
      type: 'article',
      locale: 'fr_FR',
    },
  }
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const [article, globals] = await Promise.all([getPublishedArticle(slug), getSiteGlobals()])

  if (!article) notFound()

  const cat = categoryName(article.category)
  const jsonLd = buildArticleJsonLd(article, globals.identite, SERVER_URL, `/actualites/${slug}`)

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p className="text-sm text-ink">
        <a href="/actualites" className="text-brand hover:underline">
          Actualités
        </a>
        {cat ? (
          <>
            <span> · </span>
            <span className="font-semibold text-brand">{cat}</span>
          </>
        ) : null}
        {article.publishedDate ? (
          <>
            <span> · </span>
            <time dateTime={article.publishedDate}>{formatFrenchDate(article.publishedDate)}</time>
          </>
        ) : null}
      </p>

      <h1 className="mt-3 text-4xl font-bold tracking-tight">{article.title}</h1>

      {article.image ? (
        <SiteImage
          media={article.image}
          priority
          sizes="(min-width: 768px) 768px, 100vw"
          className="mt-8 w-full rounded-lg"
        />
      ) : null}

      {article.content ? <RichText data={article.content} className="rich-text mt-8" /> : null}
    </article>
  )
}
