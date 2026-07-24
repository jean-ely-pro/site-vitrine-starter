import type { Block } from 'payload'

import { restrictedRichText } from '../fields/richText'

/** A block of text next to an image — the workhorse of "À propos" pages. */
export const TextImage: Block = {
  slug: 'textImage',
  labels: { singular: 'Texte + image', plural: 'Texte + image' },
  imageAltText: 'Texte + image',
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Titre de la section',
      admin: { description: 'Optionnel. Affiché en Titre 2 au-dessus du texte.' },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Texte',
      editor: restrictedRichText,
      admin: { description: 'Le paragraphe. Vous pouvez ajouter des sous-titres (Titre 2, Titre 3) et des listes.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
      admin: { description: 'L’image affichée à côté du texte.' },
    },
    {
      name: 'imagePosition',
      type: 'select',
      label: 'Position de l’image',
      defaultValue: 'right',
      options: [
        { label: 'À droite du texte', value: 'right' },
        { label: 'À gauche du texte', value: 'left' },
      ],
    },
  ],
}
