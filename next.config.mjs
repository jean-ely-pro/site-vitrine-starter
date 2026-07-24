import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output keeps the production image small and lets the runner
  // stage run `node server.js` without the full toolchain.
  output: 'standalone',
  // Editorial content must be in the first server response (non-JS crawlers
  // read raw HTML). No client-only rendering of content anywhere.
  reactStrictMode: true,
  // Next's tracer follows JS and .node bindings but misses libvips' .so shared
  // objects, so sharp compiles into the standalone output and then dies at
  // runtime with "cannot open shared object file". Force sharp's native
  // packages in whole. The Dockerfile asserts sharp actually loads.
  outputFileTracingIncludes: {
    '/**': ['./node_modules/.pnpm/@img+**/*'],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
