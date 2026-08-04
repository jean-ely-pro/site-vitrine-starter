import type { CollectionConfig } from 'payload'

import { CallToAction } from '../blocks/CallToAction'
import { ContactBlock } from '../blocks/ContactBlock'
import { ContactFormBlock } from '../blocks/ContactForm'
import { guardrailFields } from '../fields/guardrails'
import { publicationFields } from '../fields/publication'
import { stampPublishedAt } from './hooks/stampPublishedAt'
import { Hero } from '../blocks/Hero'
import { Hours } from '../blocks/Hours'
import { Services } from '../blocks/Services'
import { TextImage } from '../blocks/TextImage'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'
import { PAGE_TEMPLATE_OPTIONS } from '../lib/pageTemplates'
import { applyTemplate } from './hooks/applyTemplate'
import { revalidatePage, revalidatePageDelete } from './hooks/revalidatePage'
import { tenantReadPublished, tenantWrite } from '../lib/tenantAccess'

/**
 * Public pages. The owner builds a page from predefined blocks (no free-form
 * page builder, so the site cannot be broken), gives it a web address, sets its
 * SEO, and publishes it. Drafts vs. published is Payload's built-in status,
 * which gives the explicit publication state the training relies on.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  admin: {
    group: 'Contenus',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description: 'Les pages de votre site. Créez-en une, ajoutez-la au menu, puis publiez-la.',
  },
  versions: {
    drafts: {
      autosave: false,
    },
    maxPerDoc: 10,
  },
  access: {
    // The public site only sees published pages; signed-in staff see drafts too,
    // but only for the clients they belong to.
    read: tenantReadPublished,
    create: tenantWrite,
    update: tenantWrite,
    delete: tenantWrite,
  },
  // Two clients may both want a page at /contact, so the slug is unique per
  // tenant rather than across the whole database.
  indexes: [{ fields: ['tenant', 'slug'], unique: true }],
  hooks: {
    beforeChange: [applyTemplate, stampPublishedAt],
    afterChange: [revalidatePage],
    afterDelete: [revalidatePageDelete],
  },
  fields: [
    ...guardrailFields,
    ...publicationFields,
    {
      name: 'title',
      type: 'text',
      label: 'Titre de la page',
      required: true,
      admin: {
        description: 'Le titre principal de la page (affiché en haut et proposé pour le menu).',
      },
    },
    slugField(),
    {
      name: 'template',
      type: 'select',
      label: 'Modèle de départ',
      defaultValue: 'blank',
      options: PAGE_TEMPLATE_OPTIONS,
      admin: {
        position: 'sidebar',
        description:
          'Choisi à la création pour pré-remplir la page. Modifier ce champ ensuite ne change pas le contenu déjà en place.',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Contenu de la page',
      labels: { singular: 'Bloc', plural: 'Blocs' },
      blocks: [Hero, TextImage, Services, Hours, ContactBlock, ContactFormBlock, CallToAction],
      admin: {
        description: 'Ajoutez, réordonnez et remplissez les blocs qui composent la page.',
      },
    },
    seoField,
  ],
}
