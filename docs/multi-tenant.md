# Multi-tenant (base mutualisée)

Une seule installation héberge plusieurs sites clients. Chaque contenu porte un champ
`tenant` qui désigne son propriétaire, et chaque règle d'accès est écrite en fonction de lui.

Cette implémentation reprend trois éléments du travail de
[pascal-fortunati](https://github.com/pascal-fortunati/plateforme-vitrine) — la conversion
des globals en documents par client, la configuration du plugin, et l'unicité composite des
slugs. Les règles d'accès, absentes de sa version, ont été écrites ici.

## Ce que ce choix change

Avant, chaque client avait **sa base et son conteneur**. L'isolation était garantie par
l'infrastructure : une erreur dans une règle d'accès ne pouvait rien faire fuiter, puisqu'il
n'y avait rien d'autre dans la base.

Désormais **tous les clients partagent une base**. L'isolation devient une propriété du
code, tenue par un seul fichier : [`src/lib/tenantAccess.ts`](../src/lib/tenantAccess.ts).

| | Une base par client | Base mutualisée |
|---|---|---|
| Isolation | garantie par l'infrastructure | garantie par le code |
| Conséquence d'un `access` fautif | aucune | fuite entre clients |
| Mémoire | ~110 Mio par client | ~110 Mio au total |
| Restaurer un seul client | `pg_restore` de sa base | extraction par `tenant` |

Le gain est réel, le risque aussi. C'est pourquoi les règles d'accès sont testées
(`src/lib/tenantAccess.test.ts`).

## La règle

**Une fonction d'accès ne retourne jamais `true` pour une collection appartenant à un
client.** Elle retourne un filtre `Where` désignant les tenants autorisés :

```ts
export const scopeToTenants = (user: unknown): true | false | Where => {
  if (isSuperAdmin(user)) return true
  const ids = tenantIdsForUser(user)
  if (ids.length === 0) return false
  return { tenant: { in: ids } }
}
```

Payload applique ce filtre à la lecture **et** à la ligne visée par une modification ou une
suppression : il ne se contente pas de masquer, il empêche d'écrire.

### Pourquoi le plugin ne suffit pas

Le plugin multi-tenant filtre l'**interface d'administration** (`baseListFilter`). Il ne
sécurise **pas** l'API REST : `GET /api/pages?limit=500` n'obéit qu'à `access.read`. Une
règle laissée à `Boolean(req.user)` expose donc les données de tous les clients à tout
utilisateur connecté, alors même que l'admin paraît correctement cloisonné.

C'est le piège principal de cette architecture, et la raison des tests.

## Les rôles

| Rôle | Portée | Peut |
|---|---|---|
| `super-admin` | tous les clients | créer des clients, attribuer les rôles, tout voir |
| `admin` | son ou ses clients | contenus, réglages, médias, et gérer son équipe |
| `editor` | son ou ses clients | contenus et médias uniquement |

Un `admin` est l'administrateur **de son client**, pas de l'installation. Seul le
`super-admin` traverse les clients.

Deux gardes empêchent l'escalade :

- le champ `role` n'est modifiable que par un `super-admin` (`access.update` sur le champ) ;
- `guardTenantEscalation` couvre la **création**, que l'accès au champ ne couvre pas : un
  `admin` ne peut ni créer un `super-admin`, ni rattacher un compte au client d'un autre.

Le premier compte d'une installation neuve devient `super-admin` automatiquement — sans
quoi personne ne pourrait se connecter.

## Les réglages par client

Les sept sections de réglages (identité, couleurs, contact, horaires, réseaux, menu, pied
de page) étaient des *globals* Payload : un seul document pour toute la base. Mutualisées,
elles donneraient à tous les clients la même identité.

`tenantSingleton()` les convertit en collections d'un document par client **sans modifier
les fichiers `globals/*.ts`**, dont les définitions de champs sont réutilisées telles
quelles. La contrainte est garantie en base par un index UNIQUE sur `tenant_id`.

`Sauvegardes` et `Diagnostic` restent de vrais globals : ils décrivent l'installation, pas
un site.

## Unicité des adresses

Le slug était unique dans toute la base. Deux clients voulant chacun une page `/contact` se
seraient bloqués mutuellement. L'unicité est désormais composite :

```ts
indexes: [{ fields: ['tenant', 'slug'], unique: true }]
```

## Migration

`20260804_212643_multi_tenant` ajoute la table `tenants`, la liaison `users_tenants`, et une
colonne `tenant_id` indexée sur les treize tables concernées.

Appliquée et vérifiée sur une base vierge. **Sur une base existante**, les documents déjà
présents auront `tenant_id = NULL` : ils seront invisibles pour tout le monde, y compris
leur propriétaire. Rattacher les données à un tenant avant de servir l'installation.

## Limites connues

- **Suppression d'un client.** Les clés étrangères sont en `ON DELETE set null` (défaut
  Payload) : supprimer un tenant ne supprime pas ses contenus, il les rend orphelins avec
  `tenant_id = NULL`. Ces documents échappent alors au filtrage. Enjeu RGPD pour
  `messages`, qui contient les adresses e-mail des visiteurs. Prévoir une purge explicite
  avant suppression.
- **Pas de test d'intégration bout-en-bout.** Les règles d'accès sont testées
  unitairement ; la vérification qu'un utilisateur du client A ne peut pas lire une page du
  client B *via l'API HTTP réelle* reste à écrire.
- **Sauvegardes.** `pg_dump` couvre désormais tous les clients à la fois ; restaurer un
  seul client demande une extraction par `tenant`, non implémentée.
- **Le central.** `provision.mjs`, la passerelle et `publish.mjs` raisonnent encore en « une
  instance par client » et n'ont pas été adaptés.
