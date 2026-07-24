// Automated accessibility check of the public site.
//
// Runs against a live server (start it first, e.g. `pnpm dev`). Discovers pages
// from the sitemap, then for each page runs axe-core (in jsdom) plus the
// project's own non-negotiables (French lang, a single <h1>, alt on every
// image, a <main> landmark, a skip link). Exits non-zero on any failure.
//
// Usage: node scripts/a11y.mjs [baseUrl]

import { JSDOM } from 'jsdom'
import axe from 'axe-core'

const base = (process.argv[2] || process.env.A11Y_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

const FALLBACK_PATHS = ['/', '/nos-services', '/actualites', '/contact', '/mentions-legales']

const discoverPaths = async () => {
  try {
    const xml = await (await fetch(`${base}/sitemap.xml`)).text()
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
    return locs.length ? [...new Set(locs)] : FALLBACK_PATHS
  } catch {
    return FALLBACK_PATHS
  }
}

// The project's own rules, checked directly on the served HTML.
const projectChecks = (doc) => {
  const problems = []
  const html = doc.documentElement
  if (html.getAttribute('lang') !== 'fr') problems.push('l’attribut <html lang="fr"> est manquant')
  const h1s = doc.querySelectorAll('h1')
  if (h1s.length !== 1) problems.push(`${h1s.length} <h1> (il en faut exactement un)`)
  if (!doc.querySelector('main')) problems.push('pas de repère <main>')
  if (!doc.querySelector('a[href="#contenu"]')) problems.push('pas de lien d’évitement')
  doc.querySelectorAll('img').forEach((img) => {
    if (!img.getAttribute('alt') && img.getAttribute('alt') !== '') {
      problems.push(`une image sans attribut alt (src=${img.getAttribute('src')})`)
    }
  })
  return problems
}

const runAxe = async (html, url) => {
  const dom = new JSDOM(html, { url, pretendToBeVisual: true, runScripts: 'dangerously' })
  dom.window.eval(axe.source)
  // Colour contrast needs real rendering (absent in jsdom); it is enforced live
  // in the Couleurs settings instead.
  const results = await dom.window.axe.run(dom.window.document, {
    resultTypes: ['violations'],
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })
  dom.window.close()
  return results.violations
}

const main = async () => {
  const paths = await discoverPaths()
  console.log(`Accessibilité — ${paths.length} page(s) sur ${base}\n`)
  let failures = 0

  for (const path of paths) {
    const url = `${base}${path}`
    let html
    try {
      const res = await fetch(url)
      if (!res.ok) {
        console.log(`✗ ${path} — HTTP ${res.status}`)
        failures++
        continue
      }
      html = await res.text()
    } catch (err) {
      console.log(`✗ ${path} — inaccessible (${err.message})`)
      failures++
      continue
    }

    const dom = new JSDOM(html)
    const problems = projectChecks(dom.window.document)
    dom.window.close()

    let violations = []
    try {
      violations = await runAxe(html, url)
    } catch (err) {
      problems.push(`axe n’a pas pu s’exécuter (${err.message})`)
    }

    if (problems.length === 0 && violations.length === 0) {
      console.log(`✓ ${path}`)
    } else {
      failures++
      console.log(`✗ ${path}`)
      problems.forEach((p) => console.log(`    · ${p}`))
      violations.forEach((v) => console.log(`    · axe [${v.id}] ${v.help} (${v.nodes.length})`))
    }
  }

  console.log(failures === 0 ? '\nAccessibilité : OK ✔' : `\nAccessibilité : ${failures} page(s) en échec ✗`)
  process.exit(failures === 0 ? 0 : 1)
}

void main()
