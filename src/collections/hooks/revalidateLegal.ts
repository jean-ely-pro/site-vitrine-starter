import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { safeRevalidate } from '../../lib/revalidate'

// Legal pages are linked in the footer of every page, so a change refreshes all
// pages (layout) plus the legal page's own path.
const revalidate = async (slug: unknown) => {
  const paths = ['/sitemap.xml']
  if (typeof slug === 'string' && slug.length > 0) paths.push(`/${slug}`)
  await safeRevalidate(paths, true)
}

export const revalidateLegal: CollectionAfterChangeHook = async ({ doc }) => {
  await revalidate(doc?.slug)
  return doc
}

export const revalidateLegalDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  await revalidate(doc?.slug)
  return doc
}
