import type { CollectionConfig } from 'payload'

import { isSuperAdmin, superAdminOnly } from '../lib/tenantAccess'
import { guardTenantHasNoUsers, purgeTenantContent } from './hooks/purgeTenant'

/**
 * The clients hosted on this installation.
 *
 * One row per client site. Everything else — pages, media, settings — carries a
 * `tenant` field pointing here, and every access rule is expressed in terms of
 * it.
 *
 * Reserved to the agency, reads included: a client has no business knowing who
 * else is hosted, and the list of slugs would let one guess another's public
 * endpoint.
 */
export const Tenants: CollectionConfig = {
  slug: 'tenants',
  labels: {
    singular: 'Client',
    plural: 'Clients',
  },
  admin: {
    group: 'Administration',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'status'],
    description: 'Les sites hébergés sur cette installation. Réservé à l’agence.',
    // Invisible à tout ce qui n'est pas l'agence : la liste des clients
    // n'appartient à aucun d'eux. L'access `read` le refuse déjà.
    hidden: ({ user }) => !isSuperAdmin(user),
  },
  access: {
    read: superAdminOnly,
    create: superAdminOnly,
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  hooks: {
    // L'ordre compte : refuser d'abord si des comptes sont rattachés, purger
    // ensuite. Les clés étrangères étant en `ON DELETE set null`, la purge doit
    // précéder la suppression — après, les lignes ne portent plus de client et
    // deviennent introuvables.
    beforeDelete: [guardTenantHasNoUsers, purgeTenantContent],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nom du client',
      required: true,
      admin: {
        description: 'Nom affiché dans le sélecteur de client (ex. « Boulangerie du Coin »).',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Identifiant',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'Identifiant technique, en minuscules, sans accent ni espace (ex. « demo-boulanger »). ' +
          'Sert au routage et au nom du projet de publication : le changer casse les liens existants.',
      },
      validate: (value: unknown) =>
        typeof value === 'string' && /^[a-z0-9-]+$/.test(value)
          ? true
          : 'Uniquement des minuscules, des chiffres et des tirets.',
    },
    {
      name: 'status',
      type: 'select',
      label: 'État',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Actif', value: 'active' },
        { label: 'Suspendu', value: 'suspended' },
        { label: 'Archivé', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Un client suspendu ou archivé n’est plus servi publiquement, mais ses contenus ' +
          'sont conservés. Supprimer le client, en revanche, efface définitivement ses pages, ' +
          'actualités, médias, réglages et messages reçus.',
      },
    },
    {
      name: 'publicDomain',
      type: 'text',
      label: 'Adresse publique du site',
      admin: {
        description:
          'Adresse finale du site livré (ex. https://boulangerie-martin.fr). ' +
          'Alimente le sitemap et le robots.txt : la renseigner avant la première publication.',
      },
    },
  ],
}
