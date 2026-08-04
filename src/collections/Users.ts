import type { CollectionConfig, Where } from 'payload'

import {
  hiddenFromEditors,
  isSuperAdmin,
  isTenantAdmin,
  scopeToTenants,
  superAdminOnlyField,
} from '../lib/tenantAccess'
import { guardTenantEscalation } from './hooks/accessGuards'

import { blockDisabledLogin, guardLastAdmin, preventLastAdminDelete } from './hooks/accessGuards'
import { enforcePasswordPolicy } from './hooks/enforcePasswordPolicy'
import { stampPasswordChange } from './hooks/passwordChange'
import { twoFactorDisable, twoFactorSetup, twoFactorVerify } from './endpoints/twoFactor'

const isAdmin = (req: { user?: { role?: string } | null }): boolean =>
  req.user?.role === 'admin' || req.user?.role === 'super-admin'

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
    // Un éditeur n'a pas à voir l'annuaire des comptes ; l'access `read`
    // ci-dessous est ce qui le refuse réellement.
    hidden: hiddenFromEditors,
    description:
      'Les accès à l’administration. Créez un accès pour un collaborateur, ou révoquez-le sans le supprimer.',
  },
  access: {
    // Accounts are scoped like content: without this, any editor could list
    // every client's users — e-mails and roles included — and an admin of one
    // client could modify or delete an account belonging to another.
    read: ({ req }): boolean | Where => {
      if (!req.user) return false
      if (isSuperAdmin(req.user)) return true
      // Always allow reading one's own account: otherwise a user cannot open
      // their own profile to change a password.
      const own: Where = { id: { equals: req.user.id } }
      // An editor sees only themselves — the list of a client's accounts, with
      // their e-mails and roles, is the owner's business.
      if (!isTenantAdmin(req.user)) return own
      const scope = scopeToTenants(req.user)
      if (scope === false) return own
      if (scope === true) return true
      return { or: [scope, own] }
    },
    create: ({ req }) => isAdmin(req),
    update: ({ req, id }) => {
      if (!req.user) return false
      if (isSuperAdmin(req.user)) return true
      if (req.user.id === id) return true
      if (!isAdmin(req)) return false
      // A client admin manages their own team, never another client's.
      return scopeToTenants(req.user)
    },
    delete: ({ req }) => {
      if (!req.user) return false
      if (isSuperAdmin(req.user)) return true
      if (!isAdmin(req)) return false
      return scopeToTenants(req.user)
    },
    admin: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeValidate: [enforcePasswordPolicy],
    beforeChange: [guardTenantEscalation, guardLastAdmin, stampPasswordChange],
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
        { label: 'Super-administrateur (agence)', value: 'super-admin' },
        { label: 'Administrateur', value: 'admin' },
        { label: 'Éditeur', value: 'editor' },
      ],
      access: {
        // Only the agency may hand out a role. Without this, a client admin
        // could promote themselves to super-admin and reach every other client.
        update: superAdminOnlyField,
      },
      admin: {
        description:
          'Le super-administrateur (agence) gère tous les clients ; ' +
          'l’administrateur gère les accès de son client ; l’éditeur gère uniquement les contenus.',
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
