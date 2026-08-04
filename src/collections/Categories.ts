import type { CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'
import { tenantRead, tenantWrite } from '../lib/tenantAccess'

/**
 * News categories, managed by the client. Kept minimal — a name and an
 * auto-generated slug — so adding a rubric is a one-field action.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Catégorie',
    plural: 'Catégories',
  },
  admin: {
    group: 'Contenus',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
    description: 'Les rubriques de vos actualités (ex. « Événements », « Nouveautés »).',
  },
  access: {
    // Was public: a category list gave nothing away with one database per
    // client. Mutualised it would name every client's editorial structure.
    read: tenantRead,
    create: tenantWrite,
    update: tenantWrite,
    delete: tenantWrite,
  },
  indexes: [{ fields: ['tenant', 'slug'], unique: true }],
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nom',
      admin: {
        description: 'Le nom de la rubrique, affiché sur les actualités qui lui sont rattachées.',
      },
    },
    slugField({
      source: 'name',
      label: 'Adresse de la rubrique',
      description: 'Rempli automatiquement d’après le nom. Utilisé dans l’adresse des pages.',
    }),
  ],
}
