import { execFile } from 'child_process'
import { mkdir, readdir, stat } from 'fs/promises'
import path from 'path'
import { promisify } from 'util'

const run = promisify(execFile)

// Backups live outside the app bundle; the directory is git-ignored and, in
// Docker, mounted as a volume so they survive container rebuilds.
export const BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(process.cwd(), 'backups')

const DB_URI = () => process.env.DATABASE_URI || ''

// Only ever touch files that match this exact shape, inside BACKUP_DIR.
const FILE_RE = /^backup-[\dTZ.-]+\.dump$/

export type BackupInfo = { file: string; size: number; createdAt: string }

const ensureDir = async () => {
  await mkdir(BACKUP_DIR, { recursive: true })
}

/** Run pg_dump into a timestamped custom-format file. Returns the new file. */
export const createBackup = async (): Promise<BackupInfo> => {
  await ensureDir()
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = `backup-${stamp}.dump`
  const target = path.join(BACKUP_DIR, file)

  await run('pg_dump', [DB_URI(), '--format=custom', '--no-owner', '--file', target], {
    maxBuffer: 1024 * 1024 * 64,
  })

  const info = await stat(target)
  return { file, size: info.size, createdAt: info.mtime.toISOString() }
}

/** List existing backups, newest first. */
export const listBackups = async (): Promise<BackupInfo[]> => {
  await ensureDir()
  const names = (await readdir(BACKUP_DIR)).filter((name) => FILE_RE.test(name))
  const infos = await Promise.all(
    names.map(async (file) => {
      const info = await stat(path.join(BACKUP_DIR, file))
      return { file, size: info.size, createdAt: info.mtime.toISOString() }
    }),
  )
  return infos.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Validate a caller-supplied file name and return its absolute path, or null. */
export const resolveBackupPath = (file: string): string | null => {
  if (!FILE_RE.test(file)) return null
  const resolved = path.join(BACKUP_DIR, file)
  // Defense in depth against path traversal.
  if (path.dirname(resolved) !== path.resolve(BACKUP_DIR)) return null
  return resolved
}

/**
 * Restore the database from a backup. Destructive: drops and recreates objects
 * before loading. Guarded at the endpoint layer (admin-only, explicit confirm).
 */
export const restoreBackup = async (file: string): Promise<void> => {
  const source = resolveBackupPath(file)
  if (!source) throw new Error('Fichier de sauvegarde invalide.')
  await run('pg_restore', [
    '--dbname', DB_URI(),
    '--clean',
    '--if-exists',
    '--no-owner',
    source,
  ], { maxBuffer: 1024 * 1024 * 64 })
}

/** Whether the backup tooling (pg_dump) is available in this environment. */
export const backupToolingAvailable = async (): Promise<boolean> => {
  try {
    await run('pg_dump', ['--version'])
    return true
  } catch {
    return false
  }
}
