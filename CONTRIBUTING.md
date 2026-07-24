# Contribuer au starter

Merci de votre intérêt. Ici, la clarté et le respect des contraintes du produit priment sur
la vitesse. Ce guide explique **comment le code est organisé** et **comment y ajouter quelque
chose sans casser les garanties du produit** — même s'il s'agit de votre première
contribution.

## Le produit en une phrase

Un site vitrine livré clé en main à un artisan ou une TPE, que **le client lui-même**
administre depuis un back-office volontairement simple, sans aucune compétence technique.
Deux conséquences pour tout changement de code :

1. **L'outil applique les bonnes pratiques à la place du client.** Textes alternatifs,
   contrastes, hiérarchie des titres : le client ne doit pas pouvoir produire un site
   inaccessible. Un contributeur ne retire jamais un garde-fou pour se simplifier la vie.
2. **Le client ne peut pas casser son site.** Pas d'éditeur libre : les blocs sont prédéfinis,
   l'éditeur de texte se limite à Titre 2 / Titre 3, le `<h1>` est géré par le système.

## Démarrage

Prérequis : **Node ≥ 20.9**, **pnpm ≥ 9** (`corepack enable`), **Docker**.

```bash
pnpm install
cp .env.example .env          # renseignez au moins PAYLOAD_SECRET
docker compose up -d db       # base PostgreSQL
pnpm dev                      # http://localhost:3000  (admin sur /admin)
```

Voir le [README](./README.fr.md) pour le détail (variables d'environnement, migrations, stack
complète en Docker).

## Architecture du code

Une seule application : Next.js (App Router) monte l'admin Payload sur `/admin` comme un route
group. Pas de serveur séparé, pas de CORS. Le site public est un **instantané statique**
exporté vers l'hébergement du client ; l'admin, lui, tourne côté agence.

```
src/
  app/
    (payload)/        Admin Payload + API REST/GraphQL (route group ; ne pas éditer à la main)
    (frontend)/       Site public rendu côté serveur : pages, /actualites, sitemap, robots
  payload.config.ts   Point d'entrée : enregistre globals, collections, blocs, endpoints
  globals/            Réglages uniques du site (Identité, Couleurs, Contact, Horaires, Menu…)
  collections/        Contenus multiples (Pages, Actualités, Médias, Messages, Users…)
    hooks/            Effets serveur : revalidation, application de modèle, garde-fous d'accès
    endpoints/        Endpoints custom d'une collection (contact, 2FA)
  blocks/             Blocs de contenu réutilisables assemblés dans une page
  fields/             Champs réutilisables (couleur hex, SEO, slug, richText bridé, publication)
  components/
    admin/            Composants React du back-office (contraste live, statut de publication…)
    site/             Composants du rendu public (rendu de blocs, image, en-tête, pied de page)
  lib/                Logique pure et utilitaires (contraste, horaires, liens, JSON-LD…) + tests
  migrations/         Migrations de schéma versionnées (intégrées au build, jouées en prod)
scripts/              Export statique, déploiement SFTP/FTP, audit d'accessibilité
```

Règle de dépendance : `lib/` ne dépend de rien du reste ; `fields/`, `blocks/`, `globals/` et
`collections/` s'appuient sur `lib/` ; `payload.config.ts` assemble le tout. Le rendu public
(`app/(frontend)/`, `components/site/`) lit les données via `lib/queries.ts` et n'importe
jamais de logique d'admin.

## Où intervenir selon ce que vous ajoutez

- **Un nouveau bloc de contenu** → créez `src/blocks/MonBloc.ts` (config Payload) puis
  enregistrez-le dans les pages et dans `components/site/BlockRenderer.tsx` pour son rendu.
  Un bloc ne rend jamais de `<h1>` et n'introduit pas de ressource tierce.
- **Un champ de réglage** → ajoutez-le au global concerné dans `src/globals/`. Le texte d'aide
  dit **où le contenu sort**, pas ce qu'il est (« Ce nom apparaît dans le menu », pas « Champ
  texte, 60 caractères »).
- **Un contenu multiple** → nouvelle collection dans `src/collections/`, enregistrée dans
  `payload.config.ts`, avec un hook de revalidation si elle apparaît sur le site public.
- **Un contrôle d'admin custom** → composant dans `components/admin/`, branché comme champ ou
  vue ; après ajout, régénérez l'import map (`pnpm generate:importmap`).
- **De la logique** (calcul, formatage, validation) → dans `src/lib/`, avec un test à côté
  (`*.test.ts`). Gardez-la pure pour qu'elle soit testable sans Payload.

**Toute modification du schéma** (champ, collection, global) impose une migration :
`pnpm generate:types` puis `pnpm migrate:create`, et on committe la migration générée. Une
base de production vierge se construit à partir de ces migrations.

## Contraintes non négociables

Elles viennent d'un audit réel du prototype. Un changement qui les enfreint ne sera pas
intégré, même s'il « marche ».

- **Accessibilité** — contraste du texte **≥ 4,5:1**. **Interdiction des utilitaires
  `opacity-*` sur du texte** (cause d'échecs mesurés) : un gris discret se définit par un token
  de couleur validé. `alt` obligatoire sur les images, un seul `<h1>` par page, hiérarchie de
  titres sans saut de niveau, `<main>` et lien d'évitement présents.
- **Rendu et SEO** — le contenu éditorial est présent dans le **premier HTML serveur** (certains
  robots d'indexation n'exécutent pas le JS). Un `<title>` et une méta-description **uniques par page**,
  `<html lang="fr">`, JSON-LD `LocalBusiness`, `sitemap.xml` et `robots.txt`. Le hero est une
  vraie `<img>` (jamais un `background-image`).
- **RGPD** — **aucune ressource tierce sur le site public** : pas de CDN d'images, pas de
  Google Fonts distant. Tout est auto-hébergé. Case de consentement du formulaire **non
  pré-cochée**.
- **Conversion** — téléphone et e-mail **cliquables** (`tel:` / `mailto:`).
- **Performance** — `width`/`height` sur chaque `<img>`, `loading="lazy"` hors hero, conversion
  WebP/AVIF automatique.

En cas de doute sur une décision produit, **posez la question dans la pull request** plutôt que
de supposer. Si une exigence semble irréalisable, **dites-le** plutôt que de la contourner en
silence.

## Langue

- **Interface d'administration, libellés, messages, textes d'aide : en français.**
- **Code, noms de variables, commentaires : en anglais.**

## Hors périmètre

Ne pas construire, même si l'idée est bonne : statistiques/Matomo, avis clients,
newsletter, assistant conversationnel intégré, prise de rendez-vous, paiement, e-commerce. Ces briques
dépassent la promesse d'un simple site vitrine.

## Branches, commits et pull requests

- Travaillez sur une **branche depuis `main`** (une branche = un changement cohérent).
- Messages de commit **en français, à l'impératif** et clairs (« Ajoute le bloc Horaires »,
  pas « wip »). Un commit = un changement cohérent ; consultez `git log` pour le style.
- La pull request **décrit ce qui change et comment le tester** à la main (ex. « créé une
  actualité, publiée, visible sur /actualites »). Elle est prête quand l'application démarre,
  le parcours concerné fonctionne et le `README` est à jour si le comportement visible a changé.

## Vérifier avant de proposer un changement

```bash
pnpm build          # doit passer (inclut la vérification TypeScript)
pnpm test           # tests unitaires (Vitest)
pnpm test:a11y      # audit d'accessibilité sur le rendu public (axe-core, serveur démarré)
```

Aucune question n'est bête ici : c'est aussi un projet d'apprentissage.
