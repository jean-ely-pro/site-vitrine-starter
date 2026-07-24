import type { CollectionConfig } from 'payload'

import { blockDisabledLogin, guardLastAdmin, preventLastAdminDelete } from './hooks/accessGuards'
import { enforcePasswordPolicy } from './hooks/enforcePasswordPolicy'
import { stampPasswordChange } from './hooks/passwordChange'
import { twoFactorDisable, twoFactorSetup, twoFactorVerify } from './endpoints/twoFactor'

const isAdmin = (req: { user?: { role?: string } | null }): boolean => req.user?.role === 'admin'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Utilisateur',
    plural: 'Accès et utilisateurs',
  },
  auth: {
    // Brute-force guard on the login form (M3).
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 minutes
    tokenExpiration: 60 * 60 * 8, // 8 hours
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'twoFactorEnabled', 'disabled'],
    group: 'Administration',
    description:
      'Les accès à l’administration. Créez un accès pour un collaborateur, ou révoquez-le sans le supprimer.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => isAdmin(req),
    update: ({ req, id }) => isAdmin(req) || req.user?.id === id,
    delete: ({ req }) => isAdmin(req),
    admin: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeValidate: [enforcePasswordPolicy],
    beforeChange: [guardLastAdmin, stampPasswordChange],
    beforeLogin: [blockDisabledLogin],
    beforeDelete: [preventLastAdminDelete],
  },
  endpoints: [twoFactorSetup, twoFactorVerify, twoFactorDisable],
  fields: [
    // Live strength meter — reads the password field in the same form.
    {
      name: 'passwordStrength',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/PasswordStrength#PasswordStrength',
        },
      },
    },
    {
      name: 'name',
      type: 'text',
      label: 'Nom',
      admin: {
        description: 'Nom affiché de la personne qui administre le site.',
      },
    },
    {
      name: 'role',
      type: 'select',
      label: 'Rôle',
      required: true,
      defaultValue: 'admin',
      options: [
        { label: 'Administrateur', value: 'admin' },
        { label: 'Éditeur', value: 'editor' },
      ],
      admin: {
        description: 'L’administrateur gère les accès ; l’éditeur gère uniquement les contenus.',
      },
    },
    {
      name: 'disabled',
      type: 'checkbox',
      label: 'Accès révoqué',
      defaultValue: false,
      access: {
        // Only an administrator can revoke or restore an access.
        update: ({ req }) => isAdmin(req),
      },
      admin: {
        position: 'sidebar',
        description:
          'Coché, cette personne ne peut plus se connecter, sans perdre son compte. Décochez pour réactiver.',
      },
    },
    {
      name: 'passwordChangedAt',
      type: 'date',
      label: 'Dernier changement de mot de passe',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Mis à jour automatiquement. Sert au diagnostic de sécurité.',
      },
    },
    // --- Two-factor authentication (TOTP) ---
    {
      name: 'twoFactorSetup',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/TwoFactorSetup#TwoFactorSetup',
        },
      },
    },
    {
      name: 'twoFactorEnabled',
      type: 'checkbox',
      label: 'Double authentification active',
      defaultValue: false,
      admin: {
        readOnly: true,
        description: 'Se règle via le bouton d’activation ci-dessus, pas à la main.',
      },
    },
    {
      name: 'twoFactorSecret',
      type: 'text',
      hidden: true,
    },
    {
      name: 'twoFactorBackupCodes',
      type: 'json',
      hidden: true,
    },
  ],
}
