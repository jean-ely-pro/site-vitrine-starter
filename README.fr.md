# Site Vitrine — Starter Kit

*Read this in English: [README.md](./README.md)*

Un site vitrine professionnel, livré clé en main à un artisan ou une TPE, que **le client
lui-même** administre depuis un back-office volontairement simple, sans aucune compétence
technique.

Le produit applique les bonnes pratiques du web à la place du client — textes alternatifs,
contrastes suffisants, hiérarchie des titres saine — au lieu de les lui laisser.

## Stack

- **Next.js 16 (App Router) + Payload 3** dans **une seule application**. Payload monte son
  admin sur `/admin` comme un route group Next — pas de serveur séparé, pas de CORS.
- **PostgreSQL** (`@payloadcms/db-postgres`)
- **TypeScript** partout, types Payload générés et consommés par le front
- **Docker / Docker Compose** pour le développement et pour le serveur d'édition
- Le contenu éditorial est présent dès la première réponse HTML du serveur. Le site remis au
  client est un **instantané statique** : publier, c'est reconstruire le site puis le déposer
  sur son hébergement (`pnpm export` puis `pnpm deploy`).

## Prérequis

- **Node.js ≥ 20.9** et **pnpm ≥ 9** (`corepack enable` installe pnpm)
- **Docker** et **Docker Compose** (pour la base de données, et éventuellement toute la stack)

## Démarrage

### 1. Installer les dépendances

```bash
pnpm install
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
```

Éditez ensuite `.env` et renseignez au moins `PAYLOAD_SECRET` (une longue chaîne aléatoire,
par ex. `openssl rand -base64 32`) et `TENANT_SLUG` (voir ci-dessous). Le fichier `.env` est
ignoré par git et ne doit jamais être committé.

**`TENANT_SLUG` désigne le client que ce site affiche.** Une même base peut contenir
plusieurs clients : l'administration sait lequel montrer grâce au compte connecté, mais le
site public n'a pas de compte — il faut donc le lui dire. Renseignez l'adresse (le
« slug ») du client, exactement telle que saisie dans Clients → Adresse ; ce client est
créé à l'étape 5.

Sans cette variable, le site public s'arrête sur « TENANT_SLUG manquant… » ; avec un slug
qui ne correspond à aucun client, sur « Client « … » introuvable ». Les deux erreurs sont
volontaires : un repli silencieux publierait le contenu d'un client sous le domaine d'un
autre.

### 3. Démarrer PostgreSQL

Le montage recommandé en développement fait tourner la base dans Docker et l'application sur
la machine hôte :

```bash
docker compose up -d db
```

### 4. Lancer l'application

```bash
pnpm dev
```

Le site est servi sur <http://localhost:3000> et l'admin sur
<http://localhost:3000/admin>. Au premier lancement, l'admin vous guide pour créer le
premier utilisateur, qui devient **super-admin** : sans lui, personne ne pourrait rien
créer.

### 5. Créer le client

Rien ne s'affiche tant qu'aucun client n'existe : le site public répond « Client « … »
introuvable ».

Dans l'admin, sous **Clients**, créez-en un dont l'**adresse (slug)** est identique au
`TENANT_SLUG` renseigné à l'étape 2, au caractère près. Créez ensuite une page d'adresse
`accueil` et **publiez-la** : le site public ne montre que le contenu publié.

Deux clients peuvent chacun avoir leur `/accueil` — l'unicité porte sur le couple
*(client, adresse)*, pas sur l'adresse seule.

### Stack complète dans Docker (proche de la production)

Pour construire et lancer l'image de l'application avec la base de données — au plus près de
la cible de déploiement :

```bash
docker compose up --build
```

## Premiers pas dans l'admin

1. Ouvrez <http://localhost:3000/admin> et créez le premier utilisateur. L'**indicateur de
   force du mot de passe** montre en temps réel le respect de la politique (12 caractères
   minimum, majuscule et minuscule, un chiffre et un caractère spécial) ; la même règle est
   appliquée côté serveur.
2. Ouvrez votre page utilisateur et activez la **double authentification** : scannez le QR
   code avec une application d'authentification (Google Authenticator, Aegis, etc.),
   confirmez le code à six chiffres, puis conservez les huit codes de secours.

L'interface d'administration est entièrement en français — c'est la surface qu'utilise le
client final.

## Documentation

| Document | Pour qui |
| --- | --- |
| [Adapter le front à un métier](./docs/front-par-metier.md) | Vous démarrez sur le projet et devez façonner l'apparence d'un site : blocs, couleurs, vérifications. |
| [Multi-tenant (base mutualisée)](./docs/multi-tenant.md) | Vous touchez aux règles d'accès ou à l'isolation entre clients. |

## Scripts utiles

| Commande | Rôle |
| --- | --- |
| `pnpm dev` | Démarre le serveur de développement (Next + Payload) |
| `pnpm build` | Build de production |
| `pnpm start` | Sert le build de production |
| `pnpm generate:types` | Régénère `src/payload-types.ts` à partir des collections |
| `pnpm generate:importmap` | Reconstruit l'import map de l'admin après ajout d'un composant custom |
| `pnpm migrate` | Applique les migrations de base en attente |
| `pnpm migrate:create` | Génère une migration à partir du schéma actuel |
| `pnpm export` | Fige le site public (serveur démarré) dans un dossier statique `out/` |
| `pnpm deploy` | Dépose `out/` sur l'hébergement mutualisé du client (SFTP/FTP) |
| `pnpm test` | Lance les tests unitaires (Vitest) |
| `pnpm test:a11y` | Lance le test d'accessibilité sur un serveur démarré (axe-core) |

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `PAYLOAD_SECRET` | Secret utilisé pour signer les jetons d'authentification. **Obligatoire.** |
| `DATABASE_URI` | Chaîne de connexion PostgreSQL. |
| `TENANT_SLUG` | Adresse (slug) du client que cette instance affiche. **Obligatoire** — le site public n'a aucun compte connecté d'où le déduire. |
| `TENANT_FROM_HEADER` | `true` uniquement sur une installation mutualisée, où une seule instance sert tous les clients, chaque requête nommant le sien par `X-Tenant-Slug`. À laisser vide sur une instance dédiée : l'en-tête vient du réseau, et l'honorer permettrait à une requête forgée de choisir son client. |
| `NEXT_PUBLIC_SERVER_URL` | URL publique du site (liens absolus, sitemap, aperçus de partage). |
| `DATABASE_PUSH` | `true` synchronise le schéma au démarrage en développement. En production, le schéma vient des migrations, pas du push (le push nécessite l'outillage de dev, absent de l'image standalone). |

### Migrations (production)

Les changements de schéma sont versionnés dans `src/migrations/`. Elles sont intégrées au
build et exécutées automatiquement sur une base vierge en production (`prodMigrations`) : un
déploiement standalone crée donc son propre schéma. Après avoir modifié les collections ou
les champs, générez une migration avec `pnpm migrate:create` et committez-la.

## Structure du projet

```
src/
  app/
    (payload)/     Interface d'admin et API REST/GraphQL (route group Payload)
    (frontend)/    Site public (coquille rendue côté serveur)
  collections/     Users, Media, et leurs hooks/endpoints
  components/admin/ Composants de champ d'admin custom (indicateur de force, 2FA)
  payload.config.ts
```

## Le modèle du site (Lot 1)

Le client construit le site public depuis l'admin, sans jamais toucher aux URL ni au code :

- **Les réglages** sont regroupés : identité, couleurs de la marque, contact, horaires et
  réseaux sociaux. Les couleurs alimentent le site public via des variables CSS ; les
  horaires alimentent les données structurées.
- **Les pages** s'assemblent à partir de blocs prédéfinis (bannière, texte + image, services,
  horaires, contact, appel à l'action) — pas d'éditeur libre, la mise en page ne peut pas
  casser. Une nouvelle page peut démarrer d'un modèle **Services**, **À propos** ou
  **Tarifs**. L'éditeur de texte n'offre que Titre 2 / Titre 3 ; le `<h1>` unique est géré par
  le système.
- **La navigation** — le menu et le pied de page pointent vers les pages par référence :
  créer une page et l'ajouter au menu est une seule action.
- **La publication** — une page est en brouillon ou publiée ; seules les pages publiées sont
  visibles. Enregistrer une page ou un réglage rafraîchit aussitôt les pages concernées sur le
  serveur d'édition ; le site du client, lui, change à la publication suivante.
- **Le référencement** — chaque page a un titre et une méta-description uniques (aperçu Google
  en direct, compteur ~155 caractères), un JSON-LD `LocalBusiness` construit depuis les
  réglages, et le site sert `sitemap.xml` et `robots.txt`. Aucune ressource tierce n'est
  chargée sur le site public.

## Feuille de route

Le travail avance un lot à la fois.

- **Lot 0 — Socle** (fait) : une application qui démarre, un admin français où l'on se
  connecte, une politique de mot de passe et la 2FA.
- **Lot 1 — Pages et rendu public** (fait) : réglages, pages depuis des modèles, menu et pied
  de page, rendu serveur, référencement par page, JSON-LD `LocalBusiness`, `sitemap.xml`
  / `robots.txt`.
- **Lot 2 — Médiathèque** (fait) : upload glisser-déposer, recadrage et point focal, tailles
  WebP automatiques servies en `srcset` responsive, poids/format/dimensions avec alerte de
  seuil, dossiers et étiquettes.
- **Lot 3 — Actualités** (fait) : collection `actualites` avec catégories gérables par le
  client, statut brouillon/publié et date, liste `/actualites` et pages d'article
  `/actualites/<slug>` avec métadonnées propres et JSON-LD `BlogPosting`.
- **Lot 4 — Formulaire de contact** (fait) : bloc formulaire, boîte de réception `messages`
  privée (lu/non lu), case de consentement non pré-cochée, honeypot + limite de débit par IP,
  e-mail de notification optionnel et bouton « message test ». Pensé pour le modèle statique :
  le formulaire poste vers l'endpoint du serveur central (CORS), sans service tiers.
- **Lot 5 — Légal, accès, diagnostic & sauvegardes** (fait) : pages légales générées depuis
  l'Identité (mentions, confidentialité, CGU), éditables et liées automatiquement au pied de
  page ; gestion des accès avec révocation (sans suppression), rôles et protection du dernier
  admin ; un écran de diagnostic de sécurité ; et des sauvegardes automatiques + manuelles de
  la base (pg_dump) avec téléchargement et restauration.
- **Lot 6 — Garde-fous** (fait) : contrôle de contraste en direct dans les couleurs (alerte
  sous 4,5:1), alerte non bloquante sur les libellés de lien vagues, garde-fou sur les
  modifications non enregistrées, et test d'accessibilité automatisé sur les pages publiques
  (`pnpm test:a11y`, axe-core).
- **Export statique & déploiement** (fait) : `pnpm export` fige le site public en un bundle
  statique autonome (images auto-hébergées, aucune requête tierce) ; `pnpm deploy` le dépose
  sur l'hébergement mutualisé du client en SFTP/FTP.
- Ensuite : la personnalisation d'apparence.

## Licence

Privé / propriétaire. Tous droits réservés.
