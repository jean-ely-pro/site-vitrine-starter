import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { safeRevalidate } from '../../lib/revalidate'

const pathsFor = (slug: unknown): string[] => {
  const paths = ['/actualites', '/sitemap.xml']
  if (typeof slug === 'string' && slug.length > 0) paths.push(`/actualites/${slug}`)
  return paths
}

/** Refresh the news list, the article, and the sitemap when an article is saved. */
export const revalidateActualite: CollectionAfterChangeHook = async ({ doc }) => {
  await safeRevalidate(pathsFor(doc?.slug))
  return doc
}

/** Same on delete, so a removed article disappears from the list and sitemap. */
export const revalidateActualiteDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  await safeRevalidate(pathsFor(doc?.slug))
  return doc
}
