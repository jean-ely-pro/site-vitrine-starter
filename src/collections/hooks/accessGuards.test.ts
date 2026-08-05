import { describe, expect, it } from 'vitest'

import {
  guardLastAdmin,
  guardTenantEscalation,
  preventLastAdminDelete,
} from './accessGuards'

/**
 * Privilege escalation at account creation.
 *
 * Field-level `access.update` on `role` covers edits, not creation — a hole the
 * analysed repository left open. These tests describe what a client's
 * administrator must not be able to do when creating an account.
 */

const call = (args: {
  data: Record<string, unknown>
  user: unknown
  existingUsers?: number
  operation?: string
}) =>
  (guardTenantEscalation as unknown as (a: unknown) => Promise<Record<string, unknown>>)({
    data: args.data,
    operation: args.operation ?? 'create',
    req: {
      user: args.user,
      payload: {
        count: async () => ({ totalDocs: args.existingUsers ?? 5 }),
      },
    },
  })

const superAdmin = { id: 1, role: 'super-admin' }
const boulangerAdmin = { id: 2, role: 'admin', tenants: [{ tenant: 10 }] }

describe('création du premier compte', () => {
  it('devient super-administrateur, sans authentification', async () => {
    // Sinon une installation neuve n'a personne pour se connecter.
    const data = await call({ data: { email: 'a@b.c' }, user: null, existingUsers: 0 })
    expect(data.role).toBe('super-admin')
  })

  it('ne s’applique plus dès qu’un compte existe', async () => {
    await expect(call({ data: { email: 'a@b.c' }, user: null, existingUsers: 1 })).rejects.toThrow(
      /Authentification requise/,
    )
  })
})

describe('escalade de privilèges', () => {
  it('un administrateur de client ne peut pas créer de super-administrateur', async () => {
    await expect(
      call({ data: { email: 'x@y.z', role: 'super-admin' }, user: boulangerAdmin }),
    ).rejects.toThrow(/Seul un super-administrateur/)
  })

  it("il ne peut pas rattacher un compte au client d'un autre", async () => {
    await expect(
      call({ data: { email: 'x@y.z', role: 'editor', tenants: [11] }, user: boulangerAdmin }),
    ).rejects.toThrow(/vos propres clients/i)
  })

  it('il peut créer un éditeur sur son propre client', async () => {
    const data = await call({
      data: { email: 'x@y.z', role: 'editor', tenants: [10] },
      user: boulangerAdmin,
    })
    expect(data.role).toBe('editor')
  })

  it('un compte créé sans client hérite de celui de son créateur', async () => {
    // Un compte orphelin serait invisible pour l'administrateur qui l'a créé.
    const data = await call({ data: { email: 'x@y.z', role: 'editor' }, user: boulangerAdmin })
    expect(data.tenants).toEqual([10])
  })

  it("le super-admin de l'agence n'est pas contraint", async () => {
    const data = await call({
      data: { email: 'x@y.z', role: 'super-admin', tenants: [11] },
      user: superAdmin,
    })
    expect(data.role).toBe('super-admin')
  })
})

describe('portée du garde', () => {
  it('ne s’applique qu’à la création', async () => {
    // Les modifications sont couvertes par l'access du champ `role`.
    const data = await call({
      data: { role: 'super-admin' },
      user: boulangerAdmin,
      operation: 'update',
    })
    expect(data.role).toBe('super-admin')
  })
})

/**
 * Le garde « dernier administrateur », par client.
 *
 * Il a été écrit quand chaque client avait sa propre base : compter les
 * administrateurs de toute l'installation revenait alors à compter ceux du
 * client. Mutualisé, ce raccourci se retourne dans les deux sens — d'où ces
 * tests, qui décrivent les deux échecs.
 */

// Capture le `where` envoyé à `count`, et répond ce que le test veut.
type Hook = (a: unknown) => Promise<Record<string, any>>

const guardWith = (total: number) => {
  const queries: Array<Record<string, any>> = []
  return {
    req: {
      payload: {
        count: async (args: Record<string, any>) => {
          queries.push(args)
          return { totalDocs: total }
        },
        findByID: async () => ({ id: 7, role: 'admin', tenants: [{ tenant: 10 }] }),
      },
    },
    queries,
  }
}

// Le filtre tenant tel qu'il apparaît dans la requête, ou undefined.
const tenantFilter = (query: Record<string, any> | undefined) =>
  (query?.where?.and ?? []).find((c: Record<string, any>) => c.tenants)?.tenants?.in

describe('dernier administrateur, par client', () => {
  it('compte uniquement les administrateurs du même client', async () => {
    const { req, queries } = guardWith(1)
    await (guardLastAdmin as unknown as Hook)({
      data: { role: 'editor' },
      originalDoc: { id: 7, role: 'admin', disabled: false, tenants: [{ tenant: 10 }] },
      operation: 'update',
      req,
    })
    // Sans ce filtre, l'administrateur d'un autre client ferait nombre et
    // laisserait celui-ci se retirer son propre accès.
    expect(tenantFilter(queries[0])).toEqual([10])
  })

  it("refuse de retirer le dernier administrateur d'un client", async () => {
    const { req } = guardWith(0)
    await expect(
      (guardLastAdmin as unknown as Hook)({
        data: { role: 'editor' },
        originalDoc: { id: 7, role: 'admin', disabled: false, tenants: [{ tenant: 10 }] },
        operation: 'update',
        req,
      }),
    ).rejects.toThrow(/dernier administrateur actif de ce client/)
  })

  it("laisse faire tant qu'il en reste un chez ce client", async () => {
    const { req } = guardWith(1)
    const data = await (guardLastAdmin as unknown as Hook)({
      data: { role: 'editor' },
      originalDoc: { id: 7, role: 'admin', disabled: false, tenants: [{ tenant: 10 }] },
      operation: 'update',
      req,
    })
    expect(data.role).toBe('editor')
  })

  it('traite le super-admin comme un administrateur actif', async () => {
    // L'ignorer refuserait une modification légitime : le rôle est au-dessus
    // d'`admin`, pas à côté.
    const { req, queries } = guardWith(1)
    await (guardLastAdmin as unknown as Hook)({
      data: { disabled: true },
      originalDoc: { id: 1, role: 'super-admin', disabled: false, tenants: [] },
      operation: 'update',
      req,
    })
    // Le comptage par rôle interroge `role.in` ; le garde du dernier
    // super-admin interroge `role.equals`. On cherche le premier, sans
    // supposer lequel des deux part en premier.
    const parRole = queries.find((q) => q.where.and[0].role?.in)
    expect(parRole?.where.and[0].role.in).toContain('super-admin')
  })

  it('protège aussi la suppression, par client', async () => {
    const { req, queries } = guardWith(0)
    await expect((preventLastAdminDelete as unknown as Hook)({ id: 7, req })).rejects.toThrow(
      /dernier administrateur actif de ce client/,
    )
    expect(tenantFilter(queries[0])).toEqual([10])
  })

  it('voit tous les comptes, pas seulement ceux que l’acteur peut lister', async () => {
    // Le garde protège d'un enfermement dehors : filtré par les droits de
    // l'acteur, il compterait moins d'administrateurs qu'il n'en existe.
    const { req, queries } = guardWith(1)
    await (guardLastAdmin as unknown as Hook)({
      data: { role: 'editor' },
      originalDoc: { id: 7, role: 'admin', disabled: false, tenants: [{ tenant: 10 }] },
      operation: 'update',
      req,
    })
    expect(queries[0].overrideAccess).toBe(true)
  })
})

/**
 * L'enfermement vécu en conditions réelles : premier compte créé, super-admin,
 * rattaché à aucun client. Rétrogradé en `admin`, il ne pouvait plus rien voir
 * ni rien créer — pas même le client qui l'aurait sorti de là.
 */
describe('dernier super-administrateur', () => {
  // Répond selon le rôle interrogé : le garde du dernier super-admin filtre sur
  // `role.equals`, le comptage général sur `role.in`.
  const compteur = (superAdmins: number, admins: number) => ({
    payload: {
      count: async (args: Record<string, any>) => ({
        totalDocs: args.where.and[0].role?.equals === 'super-admin' ? superAdmins : admins,
      }),
      findByID: async () => ({ id: 1, role: 'super-admin', tenants: [] }),
    },
  })

  it('refuse la rétrogradation du dernier, même vers administrateur', async () => {
    // `admin` compte comme rôle d'administrateur : sans garde dédié, la perte
    // passait inaperçue. Elle est pourtant totale, le compte n'ayant aucun
    // client d'où tirer des droits.
    await expect(
      (guardLastAdmin as unknown as Hook)({
        data: { role: 'admin' },
        originalDoc: { id: 1, role: 'super-admin', disabled: false, tenants: [] },
        operation: 'update',
        req: compteur(0, 5),
      }),
    ).rejects.toThrow(/dernier super-administrateur actif/)
  })

  it('refuse aussi sa désactivation', async () => {
    await expect(
      (guardLastAdmin as unknown as Hook)({
        data: { disabled: true },
        originalDoc: { id: 1, role: 'super-admin', disabled: false, tenants: [] },
        operation: 'update',
        req: compteur(0, 5),
      }),
    ).rejects.toThrow(/dernier super-administrateur actif/)
  })

  it('laisse faire tant qu’il en reste un autre', async () => {
    const data = await (guardLastAdmin as unknown as Hook)({
      data: { role: 'admin' },
      originalDoc: { id: 1, role: 'super-admin', disabled: false, tenants: [{ tenant: 10 }] },
      operation: 'update',
      req: compteur(1, 5),
    })
    expect(data.role).toBe('admin')
  })

  it('ne gêne pas les modifications sans rapport avec le rôle', async () => {
    const data = await (guardLastAdmin as unknown as Hook)({
      data: { email: 'nouvelle@adresse.fr' },
      originalDoc: { id: 1, role: 'super-admin', disabled: false, tenants: [] },
      operation: 'update',
      req: compteur(0, 5),
    })
    expect(data.email).toBe('nouvelle@adresse.fr')
  })
})

describe('création d’un accès sans client rattaché', () => {
  it('refuse plutôt que de créer un compte orphelin', async () => {
    // Le repli qui rattache au client du créateur n'a rien à copier : le
    // compte naîtrait rattaché à rien, donc invisible pour tout le monde.
    await expect(
      (guardTenantEscalation as unknown as Hook)({
        data: { email: 'b@exemple.fr', role: 'admin' },
        operation: 'create',
        req: {
          user: { id: 1, role: 'admin', tenants: [] },
          payload: { count: async () => ({ totalDocs: 1 }) },
        },
      }),
    ).rejects.toThrow(/Aucun client n’est rattaché à votre compte/)
  })
})
