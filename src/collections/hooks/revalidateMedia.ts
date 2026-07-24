import type { CollectionAfterChangeHook } from 'payload'

import { safeRevalidate } from '../../lib/revalidate'

/**
 * A media file can appear on any page, and we do not track which pages use
 * which image, so replacing a file refreshes every page. This is what makes
 * "replace an image and the site updates" work without a rebuild.
 */
export const revalidateMedia: CollectionAfterChangeHook = async ({ doc }) => {
  await safeRevalidate([], true)
  return doc
}
