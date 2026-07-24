import type { Field } from 'payload'

/**
 * Per-page search-engine settings. When left blank, the public site falls back
 * to the page title and the company activity description, so a page is never
 * shipped without a title and description. The live character counter and the
 * Google result preview are added as an admin component in a later step.
 */
export const seoField: Field = {
  name: 'seo',
  type: 'group',
  label: 'Référencement (SEO)',
  admin: {
    description: 'Comment cette page apparaît dans les résultats de recherche Google.',
  },
  fields: [
    {
      name: 'seoPreview',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/SeoPreview#SeoPreview',
        },
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Titre pour Google',
      admin: {
        description:
          'Le titre affiché dans les résultats de recherche et l’onglet du navigateur. Idéalement 50 à 60 caractères. Par défaut : le titre de la page.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description pour Google',
      maxLength: 165,
      admin: {
        description:
          'Le texte affiché sous le titre dans Google. Visez environ 155 caractères. Par défaut : la description de votre activité.',
      },
    },
  ],
}
