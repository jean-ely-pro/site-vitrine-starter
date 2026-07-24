/**
 * Export the public site as a static snapshot.
 *
 * The app is not statically exportable (it hosts the Payload admin/API), so this
 * crawls the public routes of a RUNNING server, rewrites media URLs to a local
 * path, and copies the build assets and media into `out/`. The result is a
 * self-contained static site — no Node, no database, no third-party request —
 * ready to upload to shared hosting.
 *
 *   pnpm build && pnpm start        # in one terminal (the source server)
 *   pnpm export                     # in another
 *
 * Env: EXPORT_SOURCE_URL (default http://localhost:3000), EXPORT_OUT_DIR (out).
 */
import { cp, mkdir, readFile, rm, writeFile } from 'fs/promises'
import path from 'path'

const SOURCE = (process.env.EXPORT_SOURCE_URL || 'http://localhost:3000').replace(/\/$/, '')
const OUT = process.env.EXPORT_OUT_DIR || 'out'
const ROOT = process.cwd()

const log = (...a) => console.log(...a)

const fetchText = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.text()
}

// Turn a public path into the file to write (clean URLs via directory/index.html).
const fileFor = (pathname) => {
  if (pathname === '/' || pathname === '') return path.join(OUT, 'index.html')
  return path.join(OUT, pathname.replace(/^\//, ''), 'index.html')
}

const writeFileEnsured = async (file, data) => {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, data)
}

const run = async () => {
  log(`Export depuis ${SOURCE} → ${OUT}/`)
  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  // 1. Discover public URLs from the sitemap.
  const sitemapXml = await fetchText(`${SOURCE}/sitemap.xml`)
  const paths = [...new Set([...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname))]
  if (!paths.includes('/')) paths.unshift('/')
  log(`  ${paths.length} page(s) à figer`)

  // 2. Snapshot each page; collect the media it references.
  const mediaFiles = new Set()
  for (const pathname of paths) {
    let html = await fetchText(`${SOURCE}${pathname}`)
    for (const m of html.matchAll(/\/api\/media\/file\/([^"'()\s?]+)/g)) mediaFiles.add(m[1])
    // Serve media from a plain static path instead of the dynamic API route.
    html = html.replaceAll('/api/media/file/', '/media/')
    await writeFileEnsured(fileFor(pathname), html)
  }
  log(`  ${mediaFiles.size} fichier(s) média référencés`)

  // 3. Download the referenced media into out/media/.
  await mkdir(path.join(OUT, 'media'), { recursive: true })
  for (const name of mediaFiles) {
    const res = await fetch(`${SOURCE}/api/media/file/${name}`)
    if (!res.ok) {
      log(`  ! média manquant : ${name} (${res.status})`)
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(path.join(OUT, 'media', name), buf)
  }

  // 4. Copy the build's static assets (complete — includes chunks not in the HTML).
  const staticDir = path.join(ROOT, '.next', 'static')
  await cp(staticDir, path.join(OUT, '_next', 'static'), { recursive: true }).catch(() => {
    throw new Error('`.next/static` introuvable — lancez `pnpm build` d’abord.')
  })

  // 5. Copy anything in public/ (favicon, etc.).
  await cp(path.join(ROOT, 'public'), OUT, { recursive: true }).catch(() => {})

  // 6. Static sitemap.xml and robots.txt (media path rewritten too).
  await writeFile(path.join(OUT, 'sitemap.xml'), sitemapXml)
  await writeFile(path.join(OUT, 'robots.txt'), (await fetchText(`${SOURCE}/robots.txt`)).replaceAll('/api/media/file/', '/media/'))

  log('Export terminé ✔')
}

run().catch((err) => {
  console.error('Échec de l’export :', err.message)
  process.exit(1)
})
