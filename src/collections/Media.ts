import type { CollectionConfig } from 'payload'

import { revalidateMedia } from './hooks/revalidateMedia'
import { tenantRead, tenantWrite } from '../lib/tenantAccess'

// Modern, well-supported format; sharp produces it for every generated size so
// the public site serves light images whatever the owner uploads.
const webp = { format: 'webp' as const, options: { quality: 78 } }

/**
 * Media library. Uploads are drag-and-drop and replacing a file is built into
 * the Payload admin; this config adds the rest of Lot 2: cropping and a focal
 * point, automatic WebP sizes, folders and tags to organise, and a required
 * alt at upload time (the accessibility baseline that never goes away).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Média',
    plural: 'Médiathèque',
  },
  admin: {
    group: 'Contenus',
    description:
      'Vos images. Glissez-déposez pour en ajouter, recadrez si besoin ; le site génère automatiquement des versions optimisées.',
  },
  // Group media into folders in the admin.
  folders: true,
  access: {
    // `read: () => true` was correct with one database per client — the public
    // site must fetch images. Mutualised it would expose every client's media
    // library to anyone, signed in or not. Anonymous callers are the static
    // export, which names its tenant; signed-in users see their own tenants.
    read: tenantRead,
    create: tenantWrite,
    update: tenantWrite,
    delete: tenantWrite,
  },
  upload: {
    // Editing tools in the admin.
    crop: true,
    focalPoint: true,
    // Strip camera metadata (orientation is baked in by the resize).
    withMetadata: false,
    // Responsive sizes, all WebP. The public site picks the right one via srcset.
    imageSizes: [
      { name: 'thumbnail', width: 400, formatOptions: webp },
      { name: 'card', width: 768, formatOptions: webp },
      { name: 'feature', width: 1200, formatOptions: webp },
      { name: 'wide', width: 1920, formatOptions: webp },
    ],
  },
  hooks: {
    afterChange: [revalidateMedia],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Texte alternatif',
      admin: {
        description:
          'Décrit l’image pour les personnes malvoyantes et s’affiche si l’image ne se charge pas. Obligatoire.',
      },
    },
    {
      name: 'fileInfo',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/MediaFileInfo#MediaFileInfo',
        },
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Légende',
      admin: {
        description: 'Texte optionnel affiché sous l’image sur le site.',
      },
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      label: 'Étiquettes',
      admin: {
        description: 'Mots-clés pour retrouver l’image (ex. « boutique », « équipe »). Optionnel.',
      },
    },
  ],
}
