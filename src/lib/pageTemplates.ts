/**
 * Page templates. A new page can start from a model instead of a blank canvas,
 * so the owner sees a real structure to edit rather than an empty screen. The
 * text is placeholder copy in French, meant to be replaced.
 */

// Minimal valid Lexical state holding a single paragraph.
const paragraph = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
        ],
      },
    ],
  },
})

export type PageTemplate = 'blank' | 'services' | 'about' | 'pricing'

export const PAGE_TEMPLATE_OPTIONS: { label: string; value: PageTemplate }[] = [
  { label: 'Page vierge', value: 'blank' },
  { label: 'Modèle Services', value: 'services' },
  { label: 'Modèle À propos', value: 'about' },
  { label: 'Modèle Tarifs', value: 'pricing' },
]

// Each template returns the blocks to pre-fill the page layout with.
const templates: Record<Exclude<PageTemplate, 'blank'>, () => unknown[]> = {
  services: () => [
    {
      blockType: 'hero',
      heading: 'Nos services',
      subheading: 'Présentez en une phrase ce que vous proposez.',
      cta: { label: 'Nous contacter', action: 'phone' },
    },
    {
      blockType: 'services',
      heading: 'Nos prestations',
      intro: 'Décrivez brièvement vos principales prestations.',
      cards: [
        { title: 'Première prestation', description: 'Décrivez cette prestation en une ou deux phrases.' },
        { title: 'Deuxième prestation', description: 'Décrivez cette prestation en une ou deux phrases.' },
        { title: 'Troisième prestation', description: 'Décrivez cette prestation en une ou deux phrases.' },
      ],
    },
    {
      blockType: 'callToAction',
      heading: 'Un projet en tête ?',
      text: 'Contactez-nous pour en discuter.',
      button: { label: 'Nous appeler', action: 'phone' },
    },
  ],
  about: () => [
    {
      blockType: 'hero',
      heading: 'À propos',
      subheading: 'Quelques mots sur qui vous êtes.',
    },
    {
      blockType: 'textImage',
      heading: 'Notre histoire',
      content: paragraph('Racontez votre parcours, vos valeurs et ce qui vous distingue.'),
      imagePosition: 'right',
    },
    {
      blockType: 'contactDetails',
      heading: 'Nous rencontrer',
      intro: 'Retrouvez nos coordonnées ci-dessous.',
    },
  ],
  pricing: () => [
    {
      blockType: 'hero',
      heading: 'Nos tarifs',
      subheading: 'Des prix clairs, sans surprise.',
    },
    {
      blockType: 'services',
      heading: 'Nos formules',
      intro: 'Présentez vos formules ou vos gammes de prix.',
      cards: [
        { title: 'Formule de base', description: 'Ce que comprend cette formule, et son prix.' },
        { title: 'Formule intermédiaire', description: 'Ce que comprend cette formule, et son prix.' },
        { title: 'Formule complète', description: 'Ce que comprend cette formule, et son prix.' },
      ],
    },
    {
      blockType: 'callToAction',
      heading: 'Besoin d’un devis ?',
      text: 'Demandez un devis personnalisé et gratuit.',
      button: { label: 'Demander un devis', action: 'email' },
    },
  ],
}

export const getTemplateBlocks = (template: PageTemplate): unknown[] =>
  template === 'blank' ? [] : templates[template]()
