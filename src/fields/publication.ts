import type { Field } from 'payload'

/**
 * Publication state shown in the sidebar: a stored timestamp of when the
 * document last went online, plus a clear "En ligne depuis…" / "Brouillon"
 * indicator. Pairs with the stampPublishedAt hook.
 */
export const publicationFields: Field[] = [
  {
    name: 'publishedAt',
    type: 'date',
    // Kept in the form (so the indicator can read it) but not shown as an input.
    admin: { hidden: true },
  },
  {
    name: 'publicationStatus',
    type: 'ui',
    admin: {
      position: 'sidebar',
      components: { Field: '/components/admin/PublicationStatus#PublicationStatus' },
    },
  },
]
