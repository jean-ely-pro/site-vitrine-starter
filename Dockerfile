# syntax=docker/dockerfile:1
#
# Multi-stage build. Debian slim (glibc) is used on purpose: sharp's native
# binaries are simplest and most reliable on glibc, and the project constraint
# requires sharp to be present in the RUNNER stage, not only the builder.

FROM node:20.19.0-bookworm-slim AS base
# The corepack bundled with Node 20 cannot load pnpm 10, so install a current
# one. The pnpm version itself comes from "packageManager" in package.json.
RUN npm install -g corepack@latest && corepack enable
WORKDIR /app

# --- Dependencies -----------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# Build scripts allowed to run are declared by "pnpm.onlyBuiltDependencies"
# in package.json.
RUN pnpm install --frozen-lockfile

# --- Build ------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Payload needs a secret to load its config at build time; a throwaway value is
# fine because nothing sensitive is baked into the build output.
ENV PAYLOAD_SECRET=build-time-placeholder
RUN pnpm build

# --- Runtime ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# pg_dump / pg_restore power the backup feature at runtime. The client major must
# be >= the server (Postgres 16 in docker-compose), so install 16 from PGDG —
# Debian's default client is only 15 and would refuse to dump a 16 server.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
    && install -d /usr/share/postgresql-common/pgdg \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
    && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client-16 \
    && apt-get purge -y curl gnupg \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
# Backups are written here; mount a volume at /app/backups to persist them.
RUN mkdir backups && chown nextjs:nodejs backups

# Next.js standalone output (self-contained server + traced dependencies).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Image processing must work at RUNTIME, not only during the build. sharp and its
# native libvips reach the runner through the standalone output (see
# outputFileTracingIncludes in next.config.mjs); assert it here so a missing
# binary fails the build instead of the live site.
RUN node -e "const s=require('sharp'); console.log('sharp', s.versions.sharp, '/ libvips', s.versions.vips, 'OK in runner')"

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
