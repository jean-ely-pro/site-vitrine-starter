import type { Block } from 'payload'

/** A contact form the owner can drop onto any page (e.g. a "Contact" page). */
export const ContactFormBlock: Block = {
  slug: 'contactForm',
  labels: { singular: 'Formulaire de contact', plural: 'Formulaires de contact' },
  imageAltText: 'Formulaire de contact',
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Titre',
      defaultValue: 'Écrivez-nous',
      admin: { description: 'Affiché en Titre 2 au-dessus du formulaire.' },
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Texte d’introduction',
      admin: { description: 'Optionnel. Une phrase invitant à écrire.' },
    },
    {
      name: 'privacyPage',
      type: 'relationship',
      relationTo: 'legal-pages',
      label: 'Page « politique de confidentialité »',
      admin: {
        description:
          'La page légale vers laquelle pointe le lien de consentement (créez-la dans « Pages légales »).',
      },
    },
  ],
}
