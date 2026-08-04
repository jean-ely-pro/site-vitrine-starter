import { describe, expect, it } from 'vitest'

import {
  isSuperAdmin,
  isTenantAdmin,
  scopeToTenants,
  scopeUsersToTenants,
  hiddenFromEditors,
  superAdminOnly,
  tenantSettingsWrite,
  tenantIdsForUser,
  tenantRead,
  tenantReadPublished,
  tenantWrite,
  userCanAccessTenant,
} from './tenantAccess'

/**
 * These tests are the safety net that replaces per-client databases.
 *
 * With one database per client, isolation was guaranteed by the infrastructure.
 * Mutualised, it holds only as long as no access function returns an
 * unrestricted `true`. Each test below states a way a client's data could leak
 * to another; if one fails, that leak is real.
 */

const req = (user: unknown) => ({ req: { user } }) as never

const superAdmin = { id: 1, role: 'super-admin' }
const boulanger = { id: 2, role: 'admin', tenants: [{ tenant: 10 }] }
const boulangerEditor = { id: 3, role: 'editor', tenants: [{ tenant: 10 }] }
const orphan = { id: 4, role: 'admin', tenants: [] }

describe('rôles', () => {
  it('distingue le super-admin des administrateurs de client', () => {
    expect(isSuperAdmin(superAdmin)).toBe(true)
    expect(isSuperAdmin(boulanger)).toBe(false)
    // Un admin de client reste un admin : il gère SON tenant.
    expect(isTenantAdmin(boulanger)).toBe(true)
    expect(isTenantAdmin(boulangerEditor)).toBe(false)
  })

  it('ne prend pas un rôle inventé pour un super-admin', () => {
    expect(isSuperAdmin({ role: 'superadmin' })).toBe(false)
    expect(isSuperAdmin({ role: 'super_admin' })).toBe(false)
    expect(isSuperAdmin({ role: 'admin' })).toBe(false)
    expect(isSuperAdmin(null)).toBe(false)
    expect(isSuperAdmin(undefined)).toBe(false)
    expect(isSuperAdmin('super-admin')).toBe(false)
  })
})

describe('lecture des tenants rattachés', () => {
  it('accepte les formes que Payload peut renvoyer', () => {
    // La profondeur de peuplement change la forme ; n'en lire qu'une seule
    // donnerait une liste vide, donc un utilisateur enfermé dehors.
    expect(tenantIdsForUser({ tenants: [10] })).toEqual([10])
    expect(tenantIdsForUser({ tenants: [{ tenant: 10 }] })).toEqual([10])
    expect(tenantIdsForUser({ tenants: [{ tenant: { id: 10 } }] })).toEqual([10])
    expect(tenantIdsForUser({ tenants: ['10'] })).toEqual(['10'])
  })

  it('ignore les entrées vides sans planter', () => {
    expect(tenantIdsForUser({ tenants: null })).toEqual([])
    expect(tenantIdsForUser({})).toEqual([])
    expect(tenantIdsForUser(null)).toEqual([])
  })

  it('compare les identifiants sans se soucier du type', () => {
    // Postgres renvoie des nombres, une URL des chaînes : un test strict
    // refuserait l'accès à un utilisateur légitime.
    expect(userCanAccessTenant(boulanger, '10')).toBe(true)
    expect(userCanAccessTenant(boulanger, 10)).toBe(true)
    expect(userCanAccessTenant(boulanger, 11)).toBe(false)
  })
})

describe('cloisonnement', () => {
  it("le super-admin n'est pas filtré", () => {
    expect(scopeToTenants(superAdmin)).toBe(true)
  })

  it('un utilisateur de client est réduit à ses tenants', () => {
    expect(scopeToTenants(boulanger)).toEqual({ tenant: { in: [10] } })
    // Un éditeur est cloisonné exactement comme son administrateur : le rôle
    // décide de ce qu'il peut faire, le tenant de ce qu'il peut voir.
    expect(scopeToTenants(boulangerEditor)).toEqual({ tenant: { in: [10] } })
  })

  it('un utilisateur sans tenant ne voit rien', () => {
    // `false`, et non un filtre vide : `{ in: [] }` n'est pas fiablement vide
    // selon l'adaptateur, et laisserait passer toute la base.
    expect(scopeToTenants(orphan)).toBe(false)
    expect(scopeToTenants({ role: 'editor' })).toBe(false)
  })

  it('aucune fonction de contenu ne rend un `true` non filtré à un client', () => {
    // La faille exacte du dépôt analysé : `Boolean(req.user)` autorisait
    // GET /api/pages?limit=500 sur les documents d'un autre client.
    for (const access of [tenantRead, tenantWrite, tenantReadPublished]) {
      for (const user of [boulanger, boulangerEditor, orphan]) {
        expect(access(req(user))).not.toBe(true)
      }
    }
  })
})

describe('accès anonyme (site public statique)', () => {
  it('ne voit que le contenu publié, jamais les brouillons', () => {
    expect(tenantReadPublished(req(null))).toEqual({ _status: { equals: 'published' } })
  })

  it("n'a aucun accès aux collections sans cycle de publication", () => {
    // Messages contient les e-mails des visiteurs : jamais lisible sans compte.
    expect(tenantRead(req(null))).toBe(false)
    expect(tenantWrite(req(null))).toBe(false)
  })

  it("ne peut rien écrire, même sur un tenant nommé", () => {
    expect(tenantWrite(req(null))).toBe(false)
  })
})

describe('réservé à l’agence', () => {
  it("seul le super-admin atteint les enregistrements de tenants", () => {
    expect(superAdminOnly(req(superAdmin))).toBe(true)
    // Sinon un client pourrait se rattacher au tenant d'un autre.
    expect(superAdminOnly(req(boulanger))).toBe(false)
    expect(superAdminOnly(req(boulangerEditor))).toBe(false)
    expect(superAdminOnly(req(null))).toBe(false)
  })
})

describe('périmètre d’un éditeur', () => {
  it('ne peut pas modifier les réglages du site', () => {
    // Le nom de l'entreprise et la couleur de marque appartiennent au gérant :
    // un rédacteur écrit du contenu, il ne redéfinit pas l'identité.
    expect(tenantSettingsWrite(req(boulangerEditor))).toBe(false)
    // Le gérant, lui, y accède — borné à son propre client.
    expect(tenantSettingsWrite(req(boulanger))).toEqual({ tenant: { in: [10] } })
    expect(tenantSettingsWrite(req(superAdmin))).toBe(true)
  })

  it('conserve l’écriture des contenus', () => {
    // Le masquage ne doit pas déborder : un éditeur qui ne peut plus rédiger
    // n'a plus de raison d'exister.
    expect(tenantWrite(req(boulangerEditor))).toEqual({ tenant: { in: [10] } })
  })

  it('est masqué de la navigation, gérant et agence non', () => {
    expect(hiddenFromEditors({ user: boulangerEditor })).toBe(true)
    expect(hiddenFromEditors({ user: boulanger })).toBe(false)
    expect(hiddenFromEditors({ user: superAdmin })).toBe(false)
    // Un visiteur sans compte n'atteint pas l'admin, mais la valeur doit rester
    // défensive : masqué par défaut.
    expect(hiddenFromEditors({ user: null })).toBe(true)
  })

  it('le masquage ne remplace jamais l’access', () => {
    // `admin.hidden` retire l'entrée de la barre latérale, pas la route ni
    // l'API : c'est l'access qui refuse, le masquage ne fait qu'accompagner.
    expect(hiddenFromEditors({ user: boulangerEditor })).toBe(true)
    expect(tenantSettingsWrite(req(boulangerEditor))).toBe(false)
  })
})

describe('chemin du champ tenant', () => {
  it('un contenu porte un tenant, un compte en porte un tableau', () => {
    // Un document de contenu a un champ `tenant` ; le plugin range ceux d'un
    // compte sous `tenants.tenant`. Filtrer un compte sur `tenant` déclenche
    // « Cannot find field for path at tenant » — une 500, pas un refus : la
    // page casse au lieu de fuir, mais elle casse.
    expect(scopeToTenants(boulanger)).toEqual({ tenant: { in: [10] } })
    expect(scopeUsersToTenants(boulanger)).toEqual({ 'tenants.tenant': { in: [10] } })
  })

  it('les deux refusent pareillement un compte sans client', () => {
    expect(scopeToTenants(orphan)).toBe(false)
    expect(scopeUsersToTenants(orphan)).toBe(false)
  })

  it("l'agence n'est filtrée dans aucun des deux cas", () => {
    expect(scopeToTenants(superAdmin)).toBe(true)
    expect(scopeUsersToTenants(superAdmin)).toBe(true)
  })
})
