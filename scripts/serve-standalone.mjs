// Serve the production build locally, the same way the Docker runner does.
//
// `next start` does not support `output: 'standalone'`. The standalone server
// expects the static assets and public files to sit next to it, so we copy them
// in (exactly what the Dockerfile does) and then hand over to server.js.

import { cp, access } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'

const root = process.cwd()
const standalone = path.join(root, '.next', 'standalone')

const exists = async (p) => {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

if (!(await exists(path.join(standalone, 'server.js')))) {
  console.error('No standalone build found. Run `pnpm build` first.')
  process.exit(1)
}

await cp(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'), {
  recursive: true,
})

if (await exists(path.join(root, 'public'))) {
  await cp(path.join(root, 'public'), path.join(standalone, 'public'), { recursive: true })
}

spawn(process.execPath, [path.join(standalone, 'server.js')], {
  stdio: 'inherit',
  env: process.env,
}).on('exit', (code) => process.exit(code ?? 0))
