import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { describe, expect, it } from 'vitest'

/**
 * The Node version the project runs on.
 *
 * `.nvmrc` is the single source: the workflows read it through `node-version-file`,
 * and contributors through `nvm use`. The Dockerfile cannot — an `ARG` placed
 * before the first `FROM` takes a literal default, with no way to compute it — so
 * its value is a copy, and this test is what keeps the copy honest.
 *
 * The drift it guards is silent: raising the Dockerfile alone would leave the
 * checks passing, in green, on a version nobody runs any more.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = (file: string) => readFileSync(path.join(root, file), 'utf8')

describe('version de Node', () => {
  it('est la même dans .nvmrc et dans le Dockerfile', () => {
    const declared = read('.nvmrc').trim()
    // ARG NODE_VERSION=20.19.0
    const inDockerfile = read('Dockerfile').match(/^ARG NODE_VERSION=(.+)$/m)?.[1]?.trim()

    expect(inDockerfile).toBe(declared)
  })

  it('satisfait le minimum déclaré par package.json', () => {
    const declared = read('.nvmrc').trim()
    const min = JSON.parse(read('package.json')).engines.node.replace('>=', '')

    const parts = (v: string) => v.split('.').map(Number)
    const [major, minor, patch] = parts(declared)
    const [minMajor, minMinor, minPatch] = parts(min)

    // Faire tourner les tests sous le minimum annoncé les rendrait muets sur ce
    // qu'un contributeur peut réellement exécuter — c'est ainsi que vitest 4 est
    // passé inaperçu jusqu'à la première exécution en intégration.
    expect(
      major > minMajor ||
        (major === minMajor && (minor > minMinor || (minor === minMinor && patch >= minPatch))),
    ).toBe(true)
  })

  it('est la version que les deux workflows demandent', () => {
    // Un `node-version:` en dur qui reviendrait échapperait à .nvmrc sans bruit.
    for (const workflow of ['.github/workflows/ci.yml', '.github/workflows/publish-image.yml']) {
      const content = read(workflow)
      expect(content).toMatch(/node-version-file:\s*\.nvmrc/)
      expect(content).not.toMatch(/^\s*node-version:/m)
    }
  })
})
