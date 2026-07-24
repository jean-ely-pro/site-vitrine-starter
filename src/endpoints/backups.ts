import { readFile } from 'fs/promises'

import type { Endpoint, PayloadRequest } from 'payload'

import {
  backupToolingAvailable,
  createBackup,
  listBackups,
  resolveBackupPath,
  restoreBackup,
} from '../lib/backup'

const isAdmin = (req: PayloadRequest): boolean => req.user?.role === 'admin'
const forbidden = () => Response.json({ message: 'Réservé aux administrateurs.' }, { status: 403 })

const readBody = async (req: PayloadRequest): Promise<Record<string, unknown>> => {
  try {
    return typeof req.json === 'function' ? ((await req.json()) as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

const listEndpoint: Endpoint = {
  path: '/backups/list',
  method: 'get',
  handler: async (req) => {
    if (!isAdmin(req)) return forbidden()
    const [backups, toolingAvailable] = await Promise.all([listBackups(), backupToolingAvailable()])
    return Response.json({ backups, toolingAvailable })
  },
}

const createEndpoint: Endpoint = {
  path: '/backups/create',
  method: 'post',
  handler: async (req) => {
    if (!isAdmin(req)) return forbidden()
    try {
      const info = await createBackup()
      req.payload.logger.info(`Sauvegarde créée : ${info.file}`)
      return Response.json({ success: true, backup: info })
    } catch (err) {
      req.payload.logger.error({ err }, 'Échec de la création de sauvegarde')
      return Response.json(
        { message: 'La sauvegarde a échoué. Vérifiez que pg_dump est disponible sur le serveur.' },
        { status: 500 },
      )
    }
  },
}

const downloadEndpoint: Endpoint = {
  path: '/backups/download',
  method: 'get',
  handler: async (req) => {
    if (!isAdmin(req)) return forbidden()
    const file = String((req.query?.file as string) ?? '')
    const resolved = resolveBackupPath(file)
    if (!resolved) return Response.json({ message: 'Fichier invalide.' }, { status: 400 })
    try {
      const buffer = await readFile(resolved)
      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${file}"`,
        },
      })
    } catch {
      return Response.json({ message: 'Fichier introuvable.' }, { status: 404 })
    }
  },
}

const restoreEndpoint: Endpoint = {
  path: '/backups/restore',
  method: 'post',
  handler: async (req) => {
    if (!isAdmin(req)) return forbidden()
    const body = await readBody(req)
    const file = String(body.file ?? '')
    // Destructive: require an explicit confirmation flag from the UI.
    if (body.confirm !== true) {
      return Response.json({ message: 'Confirmation requise pour restaurer.' }, { status: 400 })
    }
    try {
      await restoreBackup(file)
      req.payload.logger.warn(`Base restaurée depuis la sauvegarde : ${file}`)
      return Response.json({ success: true })
    } catch (err) {
      req.payload.logger.error({ err }, 'Échec de la restauration')
      return Response.json({ message: 'La restauration a échoué.' }, { status: 500 })
    }
  },
}

export const backupEndpoints: Endpoint[] = [
  listEndpoint,
  createEndpoint,
  downloadEndpoint,
  restoreEndpoint,
]
