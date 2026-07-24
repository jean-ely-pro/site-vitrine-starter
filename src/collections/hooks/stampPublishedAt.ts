import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Record when a document was last put online, so the admin can show "En ligne
 * depuis…". Set whenever the document is saved as published.
 */
export const stampPublishedAt: CollectionBeforeChangeHook = ({ data }) => {
  if (data._status === 'published') {
    return { ...data, publishedAt: new Date().toISOString() }
  }
  return data
}
