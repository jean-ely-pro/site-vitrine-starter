import type { GlobalAfterChangeHook } from 'payload'

import { safeRevalidate } from '../../lib/revalidate'

/**
 * Site-wide globals (identity, colours, contact, hours, social, menu, footer)
 * appear on every page, so a change to any of them revalidates all pages.
 */
export const revalidateSite: GlobalAfterChangeHook = async ({ doc }) => {
  await safeRevalidate(['/sitemap.xml'], true)
  return doc
}
