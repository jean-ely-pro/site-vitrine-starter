import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fr } from '@payloadcms/translations/languages/fr'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Actualites } from './collections/Actualites'
import { Categories } from './collections/Categories'
import { LegalPages } from './collections/LegalPages'
import { Media } from './collections/Media'
import { Messages } from './collections/Messages'
import { Pages } from './collections/Pages'
import { Tenants } from './collections/Tenants'
import { Users } from './collections/Users'
import { tenantSingleton } from './lib/tenantSingleton'
import { isSuperAdmin } from './lib/tenantAccess'
import { migrations } from './migrations'
import { Contact } from './globals/Contact'
import { Couleurs } from './globals/Couleurs'
import { Horaires } from './globals/Horaires'
import { Identite } from './globals/Identite'
import { Menu } from './globals/Menu'
import { PiedDePage } from './globals/PiedDePage'
import { Reseaux } from './globals/Reseaux'
import { Sauvegardes } from './globals/Sauvegardes'
import { Diagnostic } from './globals/Diagnostic'
import { backupEndpoints } from './endpoints/backups'
import { diagnosticEndpoint } from './endpoints/diagnostic'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * The client-owned settings sections. Each is stored once per tenant.
 *
 * Listed in one place because the same list drives both the collections built
 * from them and the plugin configuration below: a section added to one and not
 * the other would silently escape tenant scoping.
 */
const TENANT_SETTINGS = [Identite, Couleurs, Contact, Horaires, Reseaux, Menu, PiedDePage]

// Origins allowed to call the API cross-origin. In the static model the public
// site lives on the client's host and its contact form posts here, so that
// host's origin must be listed (comma-separated in PUBLIC_SITE_ORIGINS).
const corsOrigins = (
  process.env.PUBLIC_SITE_ORIGINS ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  'http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// Email is optional: configured only when SMTP settings are provided. Without
// them, Payload writes mail to the console — fine for development, and contact
// submissions still succeed (the notification is best-effort).
const email = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.SMTP_FROM || 'no-reply@localhost',
      defaultFromName: process.env.SMTP_FROM_NAME || 'Site Vitrine',
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      },
    })
  : undefined

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— Administration du site',
    },
  },
  // The back office is French-only: the end user is a non-technical
  // small-business owner. Locking supportedLanguages avoids exposing a
  // language switcher and any partially translated strings.
  i18n: {
    supportedLanguages: { fr },
    fallbackLanguage: 'fr',
  },
  collections: [
    Pages,
    Actualites,
    Categories,
    LegalPages,
    Media,
    Messages,
    Users,
    Tenants,
    // A Payload global holds one document for the whole database, which
    // mutualised would give every client the same identity, colours and
    // opening hours. These seven become one document per tenant, reusing their
    // existing field definitions untouched.
    ...TENANT_SETTINGS.map(tenantSingleton),
  ],
  // Sauvegardes and Diagnostic stay true globals: they describe the
  // installation itself — backup schedule, health of the server — not any one
  // client's site.
  globals: [Sauvegardes, Diagnostic],
  plugins: [
    multiTenantPlugin({
      tenantsSlug: 'tenants',
      tenantSelectorLabel: 'Client actif',
      // Only the agency switches between clients; everyone else is pinned to
      // the tenants attached to their account.
      userHasAccessToAllTenants: (user) => isSuperAdmin(user),
      collections: {
        pages: {},
        actualites: {},
        categories: {},
        'legal-pages': {},
        media: {},
        messages: {},
        // One settings document per client, enforced by the plugin.
        ...Object.fromEntries(TENANT_SETTINGS.map((g) => [g.slug, { isGlobal: true }])),
      },
    }),
  ],
  // The client's static site posts its contact form here from another origin.
  cors: corsOrigins,
  endpoints: [...backupEndpoints, diagnosticEndpoint],
  // Automatic backups: on boot and hourly, create a backup if one is due for the
  // configured frequency. A single long-lived server, so an interval is enough.
  onInit: async (payload) => {
    const globalKey = globalThis as { __backupSchedulerStarted?: boolean }
    if (globalKey.__backupSchedulerStarted || process.env.DISABLE_BACKUP_SCHEDULER === 'true') return
    globalKey.__backupSchedulerStarted = true

    const tick = async () => {
      try {
        const { listBackups, createBackup, backupToolingAvailable } = await import('./lib/backup')
        if (!(await backupToolingAvailable())) return
        const settings = await payload.findGlobal({ slug: 'sauvegardes' })
        const frequency = (settings as { frequency?: string }).frequency ?? 'daily'
        if (frequency === 'manual') return
        const dueMs = frequency === 'weekly' ? 7 * 864e5 : 864e5
        const last = (await listBackups())[0]?.createdAt
        if (!last || Date.now() - new Date(last).getTime() >= dueMs) {
          await createBackup()
          payload.logger.info('Sauvegarde automatique créée.')
        }
      } catch (err) {
        payload.logger.error({ err }, 'Planificateur de sauvegarde')
      }
    }

    void tick()
    // unref so the interval never keeps a CLI process (generate:types) alive.
    setInterval(() => void tick(), 60 * 60 * 1000).unref()
  },
  ...(email ? { email } : {}),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // See DATABASE_PUSH in .env.example. Left undefined, the adapter keeps its
    // defaults (push in dev, migrations in prod).
    push: process.env.DATABASE_PUSH ? process.env.DATABASE_PUSH === 'true' : undefined,
    // Bundled migrations, run automatically on a fresh database in production —
    // the standalone image cannot push a schema (that needs the dev toolchain).
    prodMigrations: migrations,
  }),
  // sharp powers image processing (resize / WebP-AVIF conversion in later lots).
  sharp,
})
