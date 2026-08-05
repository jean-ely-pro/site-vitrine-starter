# Site Vitrine — Starter Kit

*Read this in French: [README.fr.md](./README.fr.md)*

A turnkey, professional showcase website for a craftsperson or small business — one the
**client administers themselves** from a deliberately simple back office, with no technical
skills required.

The product applies the good web practices a professional would — alt text, sufficient
contrast, a sound heading hierarchy — instead of leaving them to the owner.

## Stack

- **Next.js 16 (App Router) + Payload 3** in a **single application**. Payload mounts its
  admin on `/admin` as a Next route group — no separate server, no CORS.
- **PostgreSQL** (`@payloadcms/db-postgres`)
- **TypeScript** throughout, with Payload types generated and consumed by the front end
- **Docker / Docker Compose** for development and for the editing server
- Editorial content is present in the first server HTML response. The site handed to the
  owner is a **static snapshot**: publishing means rebuilding the site, then uploading it to
  their hosting (`pnpm export`, then `pnpm deploy`).

## Requirements

- **Node.js ≥ 20.9** and **pnpm ≥ 9** (`corepack enable` sets pnpm up)
- **Docker** and **Docker Compose** (for the database, and optionally the full stack)

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure the environment

```bash
cp .env.example .env
```

Then edit `.env` and set at least `PAYLOAD_SECRET` (a long random string, e.g.
`openssl rand -base64 32`) and `TENANT_SLUG` (see below). `.env` is git-ignored and must
never be committed.

**`TENANT_SLUG` names the client this site renders.** One database may hold several
clients: the admin knows which one from the signed-in user, but the public site has no
user, so it has to be told. Set it to the client's address (slug), exactly as entered
under Clients → Address — you create that client in step 5.

Without it the public site stops with *« TENANT_SLUG manquant… »*; with a slug no client
matches, *« Client « … » introuvable »*. Both are deliberate: a silent fallback would
serve one client's content under another's domain.

### 3. Start PostgreSQL

The recommended development setup runs the database in Docker and the app on the host:

```bash
docker compose up -d db
```

### 4. Run the app

```bash
pnpm dev
```

The site is served on <http://localhost:3000> and the admin on
<http://localhost:3000/admin>. On first launch the admin walks you through creating the
first user, who becomes the **super-admin**: without it nobody could create anything.

### 5. Create the client

Nothing renders until a client exists — the public site answers *« Client « … »
introuvable »*.

In the admin, under **Clients**, create one whose **address (slug)** matches the
`TENANT_SLUG` you set in step 2, character for character. Then create a page with the
address `accueil` and **publish** it: the public site only shows published content.

Two clients may each have their own `/accueil` — uniqueness applies to the
*(client, address)* pair, not to the address alone.

### Full stack in Docker (production-like)

To build and run the app image alongside the database — mirroring the deployment target:

```bash
docker compose up --build
```

## First steps in the admin

1. Open <http://localhost:3000/admin> and create the first user. The **password strength
   meter** shows the policy being met in real time (12+ characters, upper- and lowercase, a
   digit, and a special character); the same policy is enforced server-side.
2. Open your user page and enable **two-factor authentication**: scan the QR code with an
   authenticator app (Google Authenticator, Aegis, etc.), confirm the six-digit code, and
   store the eight backup codes.

The admin interface is entirely in French — it is the surface the end client uses.

## Documentation

| Document | Who it is for |
| --- | --- |
| [Adapter le front à un métier](./docs/front-par-metier.md) *(French)* | You are starting on the project and shaping a site's look: blocks, colours, checks. |
| [Multi-tenant (base mutualisée)](./docs/multi-tenant.md) *(French)* | You are touching access rules or isolation between clients. |

## Useful scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server (Next + Payload) |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` from the collections |
| `pnpm generate:importmap` | Rebuild the admin import map after adding a custom component |
| `pnpm migrate` | Run pending database migrations |
| `pnpm migrate:create` | Generate a migration from the current schema |
| `pnpm export` | Snapshot the running public site into a static `out/` |
| `pnpm deploy` | Upload `out/` to the client's shared hosting (SFTP/FTP) |
| `pnpm test` | Run the unit tests (Vitest) |
| `pnpm test:a11y` | Run the accessibility check against a running server (axe-core) |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PAYLOAD_SECRET` | Secret used to sign authentication tokens. **Required.** |
| `DATABASE_URI` | PostgreSQL connection string. |
| `TENANT_SLUG` | Address (slug) of the client this instance renders. **Required** — the public site has no signed-in user to infer it from. |
| `TENANT_FROM_HEADER` | `true` only on a mutualised installation, where one instance serves every client and each request names its own via `X-Tenant-Slug`. Leave empty on a dedicated instance: the header comes from the network, and honouring it would let a crafted request pick a client. |
| `NEXT_PUBLIC_SERVER_URL` | Public site URL (absolute links, sitemap, share previews). |
| `DATABASE_PUSH` | `true` syncs the schema on boot in development. In production the schema comes from migrations, not push (push needs the dev toolchain, absent from the standalone image). |

### Migrations (production)

Schema changes are versioned as migrations in `src/migrations/`. They are bundled into the
build and run automatically on a fresh database in production (`prodMigrations`), so a
standalone deployment creates its own schema. After changing collections/fields, generate a
migration with `pnpm migrate:create` and commit it.

## Project structure

```
src/
  app/
    (payload)/     Admin UI and REST/GraphQL API (Payload route group)
    (frontend)/    Public site (server-rendered shell)
  collections/     Users, Media, and their hooks/endpoints
  components/admin/ Custom admin field components (password meter, 2FA)
  payload.config.ts
```

## The site model (Lot 1)

The owner builds the public site from the admin, without touching URLs or code:

- **Settings** live in one place: identity, brand colours, contact, opening hours, and
  social links. Colours flow into the public site as CSS variables; opening hours feed the
  structured data.
- **Pages** are assembled from predefined blocks (hero, text + image, services, hours,
  contact, call-to-action) — no free-form builder, so the layout cannot break. A new page can
  start from a **Services**, **About**, or **Pricing** template. The rich-text editor exposes
  only Titre 2 / Titre 3; the single `<h1>` is owned by the system.
- **Navigation** — the menu and footer link to pages by reference, so creating a page and
  adding it to the menu is one action.
- **Publishing** — pages are draft or published; only published pages are public. Saving a
  page or a global refreshes the affected pages on the editing server right away; the owner's
  site changes at the next publish.
- **SEO** — each page has a unique title and meta description (with a live Google preview and
  a ~155-character counter), a `LocalBusiness` JSON-LD built from the settings, and the site
  serves `sitemap.xml` and `robots.txt`. No third-party resources are loaded on the public
  site.

## Roadmap

Work proceeds one lot at a time.

- **Lot 0 — Socle** (done): an app that starts, a French admin you log into, a password
  policy, and 2FA.
- **Lot 1 — Pages and public rendering** (done): settings, pages from templates, menu and
  footer, server rendering, per-page SEO, `LocalBusiness` JSON-LD, `sitemap.xml` /
  `robots.txt`.
- **Lot 2 — Media library** (done): drag-and-drop upload, crop and focal point, automatic
  WebP sizes served as responsive `srcset`, weight/format/dimensions with an over-threshold
  warning, folders and tags.
- **Lot 3 — News** (done): an `actualites` collection with client-managed categories,
  draft/published status and dates, a `/actualites` list and `/actualites/<slug>` article
  pages with clean metadata and `BlogPosting` JSON-LD.
- **Lot 4 — Contact form** (done): a contact-form block, a private `messages` inbox
  (read/unread), a non-pre-checked consent box, honeypot + per-IP rate limiting, an optional
  notification e-mail, and a "send a test message" button. Built for the static model — the
  form posts to the central server's endpoint (CORS), no third-party service.
- **Lot 5 — Legal, access, diagnostics & backups** (done): legal pages generated from Identité
  (legal notice, privacy, terms), editable and auto-linked in the footer; access management
  with revoke (without deletion), roles, and last-admin protection; a security diagnostic
  dashboard; and automatic + manual database backups (pg_dump) with download and restore.
- **Lot 6 — Guardrails** (done): a live contrast checker in the colour settings (warns below
  4.5:1), a non-blocking alert on vague link labels, an unsaved-changes guard, and an
  automated accessibility test on the public pages (`pnpm test:a11y`, axe-core).
- **Static export & deploy** (done): `pnpm export` snapshots the public site into a
  self-contained static bundle (media self-hosted, no third-party request); `pnpm deploy`
  uploads it to the client's shared hosting over SFTP/FTP.
- Next: structured appearance customization.

## License

Private / proprietary. All rights reserved.
