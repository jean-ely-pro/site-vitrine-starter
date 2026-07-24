import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { HOME_SLUG } from '../../lib/constants'
import { safeRevalidate } from '../../lib/revalidate'

const pathsFor = (slug: unknown): string[] => {
  const paths = ['/sitemap.xml']
  if (typeof slug === 'string' && slug.length > 0) {
    paths.push(slug === HOME_SLUG ? '/' : `/${slug}`)
  }
  return paths
}

/** Refresh the page's public path (and the sitemap) when it is saved. */
export const revalidatePage: CollectionAfterChangeHook = async ({ doc }) => {
  await safeRevalidate(pathsFor(doc?.slug))
  return doc
}

/** Refresh the sitemap and the removed page's path when a page is deleted. */
export const revalidatePageDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  await safeRevalidate(pathsFor(doc?.slug))
  return doc
}
