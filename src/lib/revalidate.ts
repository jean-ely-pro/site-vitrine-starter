/**
 * Revalidate public paths after a content change, so edits go live without a
 * full rebuild. next/cache is imported lazily and failures are swallowed: the
 * Payload CLI (generate:types / generate:importmap) loads the config outside any
 * Next request scope, where revalidation neither applies nor should throw.
 */
export const safeRevalidate = async (paths: string[], revalidateAllPages = false): Promise<void> => {
  try {
    const { revalidatePath } = await import('next/cache')
    for (const path of paths) revalidatePath(path)
    // A layout-level revalidation refreshes every page under the root layout —
    // used when a site-wide global (colours, menu, footer…) changes.
    if (revalidateAllPages) revalidatePath('/', 'layout')
  } catch {
    // Not in a Next request context — nothing to revalidate.
  }
}
