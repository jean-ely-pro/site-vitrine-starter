# Adapter le front à un métier

Tu vas façonner l'apparence d'un site vitrine pour un métier donné — boulanger,
serrurier, fleuriste. Tu travailles sur ta machine, avec ta propre base ; ton
travail est ensuite repris sur l'installation de l'agence pour publier le site
réel.

Ce que tu livres est du **code** : des blocs et des styles. Pas le contenu de ta
base locale, qui ne sert qu'à voir ce que tu fais.

Installe d'abord le projet en suivant le [README](../README.fr.md) : dépendances,
base de données, premier lancement.

---

## 1. Ce dont tu as besoin avant de commencer

Trois choses, dans cet ordre.

### Le secret de signature

`PAYLOAD_SECRET` signe les jetons de connexion. Génère-le, ne l'invente pas :

```bash
openssl rand -base64 32
```

Sous Windows, `openssl` est fourni avec Git : la commande fonctionne dans **Git
Bash**. Si ton terminal ne le trouve pas, Node fait la même chose :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Tu obtiens une ligne de ce genre — la tienne sera différente :

    kJ8vQ2mR7xNpL4wZ1yT6cB9aD3eF5gH0iK2lM4nO6pQ=

Ne reprends pas celui d'un camarade. S'il change, toutes les sessions sautent ;
s'il est devinable, n'importe qui peut se fabriquer une session d'administrateur.

### Le client que ton site affiche

`TENANT_SLUG` dit à quel client appartient le site rendu. Le site public n'a
aucun compte connecté d'où le déduire : il faut le lui indiquer.

```ini
TENANT_SLUG=boulanger
```

Laisse `TENANT_FROM_HEADER` vide : elle ne concerne que l'installation
mutualisée de l'agence, où un seul serveur affiche tous les clients.

### Le client, dans l'admin

Rien ne s'affiche tant qu'il n'existe pas. Dans **Clients**, crée-en un dont
l'adresse est **exactement** ton `TENANT_SLUG`, puis une page d'adresse
`accueil` que tu **publies** — le site public ne montre que le contenu publié.

---

## 2. Où se trouve le front

| fichier | rôle |
|---|---|
| [`src/components/site/BlockRenderer.tsx`](../src/components/site/BlockRenderer.tsx) | le rendu de tous les blocs — le fichier que tu modifieras le plus |
| [`src/blocks/`](../src/blocks/) | la définition des champs de chaque bloc |
| [`src/components/site/PageView.tsx`](../src/components/site/PageView.tsx) | l'assemblage d'une page |
| [`src/components/site/SiteHeader.tsx`](../src/components/site/SiteHeader.tsx) · [`SiteFooter.tsx`](../src/components/site/SiteFooter.tsx) | en-tête et pied de page |
| [`src/app/(frontend)/styles.css`](../src/app/(frontend)/styles.css) | les styles globaux |

Sept blocs existent : `hero`, `textImage`, `services`, `hours`,
`contactDetails`, `contactForm`, `callToAction`.

### Un bloc a deux moitiés

- sa **définition** (`src/blocks/Hero.ts`) décrit les champs que le client
  remplit dans l'admin ;
- son **rendu** (`BlockRenderer.tsx`) décrit à quoi ça ressemble sur le site.

Les deux sont reliées par un aiguillage, à la fin de `BlockRenderer.tsx` :

```tsx
switch (block.blockType) {
  case 'hero':      return <HeroBlock … />
  case 'textImage': return <TextImageBlock … />
  …
}
```

Modifier l'apparence sans toucher aux champs : tu ne touches qu'au rendu.
Ajouter une information que le client doit saisir : il faut les deux.

---

## 3. Adapter un bloc existant

Le cas le plus courant. Exemple : un serrurier veut afficher un numéro
d'urgence dans son Hero.

**1.** Ajoute le champ dans [`src/blocks/Hero.ts`](../src/blocks/Hero.ts) :

```ts
{
  name: 'urgence',
  type: 'text',
  label: 'Numéro d’urgence',
  admin: { description: 'Affiché en évidence. Laisser vide pour masquer.' },
}
```

**2.** Régénère les types :

```bash
pnpm generate:types
```

**3.** Affiche-le dans `HeroBlock`, côté rendu :

```tsx
{block.urgence && (
  <p className="mt-4 text-lg font-bold text-brand">
    Urgence 24h/24 : {block.urgence}
  </p>
)}
```

**4.** Recharge l'admin, remplis le champ, publie, regarde le site.

> **Lance `pnpm generate:types` après chaque modification d'un bloc.** Sans
> cela, TypeScript ignore ton champ et signale une erreur sur quelque chose qui
> existe pourtant. C'est la cause n°1 de perte de temps sur ce projet.

Garde le `&&` : sans lui, un client qui laisse le champ vide obtient « Urgence
24h/24 : » suivi de rien.

---

## 4. Créer un bloc

Quatre gestes, dans cet ordre :

1. `src/blocks/MonBloc.ts` — pars d'un bloc existant, change son `slug` et ses
   champs
2. [`src/collections/Pages.ts`](../src/collections/Pages.ts) — ajoute-le à la
   liste `blocks: [...]`
3. `BlockRenderer.tsx` — écris son composant, ajoute son `case`
4. `pnpm generate:types`

Oublie le 2 : le bloc n'apparaît pas dans l'admin. Oublie le 3 : la page plante
à l'affichage.

---

## 5. Couleurs et identité

Ne code jamais une couleur en dur. Le client choisit les siennes dans
**Réglages → Couleurs**, et elles deviennent des variables CSS.

```tsx
<div className="bg-brand text-canvas">   {/* suit le client */}
<div className="bg-blue-600 text-white"> {/* figé, à éviter */}
```

Quatre couleurs sont exposées : `brand`, `brand-secondary`, `canvas` et `ink` —
utilisables avec n'importe quel préfixe Tailwind (`bg-`, `text-`, `border-`…).
Voir [`styles.css`](../src/app/(frontend)/styles.css).

C'est ce qui permet au même code de servir un fleuriste en vert et un serrurier
en bleu.

---

## 6. Vérifier ton travail

```bash
pnpm exec tsc --noEmit   # types : doit être silencieux
pnpm test                # tests
pnpm test:a11y           # accessibilité (serveur lancé)
```

Puis à l'œil : un seul `<h1>` par page, un contraste suffisant, un texte
alternatif sur chaque image, un affichage correct sur mobile.

Le client ne saura pas qu'un contraste est insuffisant ou qu'une image n'a pas
d'alternative textuelle : le produit applique ces règles à sa place.

---

## 7. Ce qui se passe ensuite

Ton front part sur une branche, en pull request. Une fois fusionnée, l'image est
reconstruite, et le client est créé sur l'installation de l'agence :

```bash
node scripts/tenant-add.mjs boulanger    # dépôt central
```

Le gérant saisit alors son contenu réel, et le site est publié en fichiers
statiques : pas de base, pas d'exécution côté serveur. Le CMS ne sert qu'à le
fabriquer.

Tu n'as donc ni image à pousser, ni export à livrer, ni client à créer : ta pull
request suffit. Transmets avec elle le `TENANT_SLUG` que tu as employé — le
client créé côté agence doit porter le même — et la liste des blocs ajoutés.

La suite, côté formateur, est décrite dans
[`flux-apprenant.md`](../../site-vitrine-central/docs/flux-apprenant.md).

---

## Pannes courantes

| message | cause | geste |
|---|---|---|
| « TENANT_SLUG manquant » | ligne absente de `.env` | ajoute `TENANT_SLUG=ton-slug` |
| « Client « … » introuvable » | aucun client avec ce slug | crée-le dans l'admin, adresse **identique** |
| page « Bienvenue » | pas de page `accueil` publiée | crée-la, puis **publie-la** |
| champ absent de l'admin après édition d'un bloc | types périmés | `pnpm generate:types` |
| erreur TypeScript sur un champ qui existe | types périmés | `pnpm generate:types` |
| bloc absent de l'admin | non déclaré dans `Pages.ts` | ajoute-le à `blocks: [...]` |
| « Le champ suivant n'est pas valide : slug » | adresse déjà prise chez ce client | changes-en |
| la base refuse la connexion | conteneur arrêté | `docker compose up -d db` |

---

## Deux choses à savoir sur le reste

**Publier n'est pas enregistrer.** Le site public ne montre que le contenu
publié. Beaucoup de « ça ne s'affiche pas » viennent de là.

**L'isolation entre clients tient au code.** Une seule base héberge tous les
clients : c'est [`src/lib/tenantAccess.ts`](../src/lib/tenantAccess.ts) qui les
sépare, plus l'infrastructure. Si tu touches à ces fonctions, lis d'abord
[`multi-tenant.md`](./multi-tenant.md) — l'administration peut sembler
parfaitement cloisonnée pendant que l'API livre tout.
