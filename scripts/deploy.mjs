/**
 * Deploy the static export (out/) to the client's shared hosting, over SFTP or
 * FTP. The remote directory is cleared first so removed pages disappear.
 *
 *   pnpm export        # produce out/ first
 *   pnpm deploy
 *
 * Env (see .env.example):
 *   DEPLOY_PROTOCOL   sftp | ftp
 *   DEPLOY_HOST, DEPLOY_PORT, DEPLOY_USER, DEPLOY_PASSWORD
 *   DEPLOY_PRIVATE_KEY   (optional, SFTP key file instead of a password)
 *   DEPLOY_REMOTE_DIR    remote target directory (e.g. /www or public_html)
 *   EXPORT_OUT_DIR       local dir to upload (default out)
 */
import { access, readFile } from 'fs/promises'

const LOCAL = process.env.EXPORT_OUT_DIR || 'out'
const PROTOCOL = (process.env.DEPLOY_PROTOCOL || 'sftp').toLowerCase()
const HOST = process.env.DEPLOY_HOST
const USER = process.env.DEPLOY_USER
const PASSWORD = process.env.DEPLOY_PASSWORD
const REMOTE = process.env.DEPLOY_REMOTE_DIR || '/'
const PORT = process.env.DEPLOY_PORT ? Number(process.env.DEPLOY_PORT) : undefined

const fail = (msg) => {
  console.error('Déploiement :', msg)
  process.exit(1)
}

const deploySftp = async () => {
  const { default: SftpClient } = await import('ssh2-sftp-client')
  const sftp = new SftpClient()
  const auth = { host: HOST, port: PORT ?? 22, username: USER }
  if (process.env.DEPLOY_PRIVATE_KEY) auth.privateKey = await readFile(process.env.DEPLOY_PRIVATE_KEY)
  else auth.password = PASSWORD

  await sftp.connect(auth)
  // Clean the target so deleted pages don't linger, then upload.
  if (await sftp.exists(REMOTE)) await sftp.rmdir(REMOTE, true).catch(() => {})
  await sftp.mkdir(REMOTE, true)
  await sftp.uploadDir(LOCAL, REMOTE)
  await sftp.end()
}

const deployFtp = async () => {
  const { Client } = await import('basic-ftp')
  const client = new Client()
  try {
    await client.access({ host: HOST, port: PORT ?? 21, user: USER, password: PASSWORD, secure: process.env.DEPLOY_FTP_SECURE === 'true' })
    await client.ensureDir(REMOTE)
    await client.clearWorkingDir()
    await client.uploadFromDir(LOCAL)
  } finally {
    client.close()
  }
}

const run = async () => {
  await access(LOCAL).catch(() => fail(`dossier « ${LOCAL} » introuvable — lancez \`pnpm export\` d’abord.`))
  if (!HOST || !USER) fail('DEPLOY_HOST et DEPLOY_USER sont requis.')
  if (PROTOCOL !== 'sftp' && PROTOCOL !== 'ftp') fail(`DEPLOY_PROTOCOL invalide : "${PROTOCOL}" (sftp ou ftp).`)

  console.log(`Déploiement de ${LOCAL}/ vers ${USER}@${HOST}:${REMOTE} en ${PROTOCOL.toUpperCase()}…`)
  if (PROTOCOL === 'sftp') await deploySftp()
  else await deployFtp()
  console.log('Déploiement terminé ✔')
}

run().catch((err) => fail(err.message))
