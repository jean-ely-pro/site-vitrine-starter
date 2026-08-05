/**
 * Deploy the static export (out/) to the client's shared hosting, over SFTP or
 * FTP.
 *
 * The client's site stays online while it is replaced. Over SFTP the upload
 * lands beside the live directory and a rename swaps it in, keeping the
 * previous version as a fallback; over FTP, which has no reliable directory
 * rename, files are written over the live ones and stale files removed only
 * after a successful upload.
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

// Répertoires voisins de la cible, le temps de la bascule. Voisins et non
// enfants : `out/` deviendra le contenu de REMOTE, un sous-dossier s'y
// retrouverait publié.
const stagingDir = () => `${REMOTE.replace(/\/+$/, '')}.envoi`
const previousDir = () => `${REMOTE.replace(/\/+$/, '')}.precedent`

/**
 * Déploiement SFTP, par bascule.
 *
 * Vider la cible puis y téléverser laissait le site incomplet pendant toute la
 * durée de l'envoi, et cassé pour de bon si l'envoi échouait en route — sans
 * retour arrière. Le site d'un client reste en ligne pendant qu'on le remplace.
 *
 * Ici l'envoi se fait à côté, et seul un renommage — atomique côté serveur —
 * met la nouvelle version en place. Un échec avant la bascule ne touche pas au
 * site existant ; la version précédente est conservée, et sert de repli si le
 * renommage final échoue à mi-parcours.
 */
const deploySftp = async () => {
  const { default: SftpClient } = await import('ssh2-sftp-client')
  const sftp = new SftpClient()
  const auth = { host: HOST, port: PORT ?? 22, username: USER }
  if (process.env.DEPLOY_PRIVATE_KEY) auth.privateKey = await readFile(process.env.DEPLOY_PRIVATE_KEY)
  else auth.password = PASSWORD

  const staging = stagingDir()
  const previous = previousDir()

  await sftp.connect(auth)
  try {
    // Restes d'un envoi précédemment interrompu : les garder mélangerait deux
    // versions du site.
    if (await sftp.exists(staging)) await sftp.rmdir(staging, true).catch(() => {})
    await sftp.mkdir(staging, true)
    await sftp.uploadDir(LOCAL, staging)

    // À partir d'ici seulement, le site en ligne change.
    if (await sftp.exists(previous)) await sftp.rmdir(previous, true).catch(() => {})
    const live = await sftp.exists(REMOTE)
    if (live) await sftp.rename(REMOTE, previous)
    try {
      await sftp.rename(staging, REMOTE)
    } catch (err) {
      // Le site n'est nulle part : remettre la version précédente en place
      // plutôt que de laisser le client sans rien.
      if (live) await sftp.rename(previous, REMOTE).catch(() => {})
      throw err
    }
    console.log(`Version précédente conservée dans ${previous}`)
  } finally {
    await sftp.end()
  }
}

/**
 * Déploiement FTP, par recouvrement.
 *
 * Le FTP ne renomme pas un répertoire de façon fiable d'un serveur à l'autre :
 * la bascule du SFTP n'est pas transposable. On téléverse donc par-dessus la
 * version en place, sans vider au préalable.
 *
 * Ce n'est pas atomique — une page est remplacée pendant que la suivante ne
 * l'est pas encore — mais le site reste servi de bout en bout, et un envoi
 * interrompu laisse un site complet, simplement mêlé de deux versions. Vider
 * d'abord garantissait au contraire un site absent pendant tout l'envoi.
 *
 * Contrepartie : une page supprimée dans l'admin resterait en ligne. Le
 * ménage se fait après un envoi réussi, à partir de la liste réellement
 * téléversée.
 */
const deployFtp = async () => {
  const { Client } = await import('basic-ftp')
  const { readdir } = await import('fs/promises')
  const client = new Client()
  try {
    await client.access({ host: HOST, port: PORT ?? 21, user: USER, password: PASSWORD, secure: process.env.DEPLOY_FTP_SECURE === 'true' })
    await client.ensureDir(REMOTE)
    await client.uploadFromDir(LOCAL)

    // L'envoi a réussi : ce qui traîne encore vient d'une version antérieure.
    const envoyes = new Set(await readdir(LOCAL))
    for (const distant of await client.list()) {
      if (envoyes.has(distant.name)) continue
      if (distant.name === '.' || distant.name === '..') continue
      await (distant.isDirectory
        ? client.removeDir(distant.name)
        : client.remove(distant.name)
      ).catch((err) => console.warn(`  ${distant.name} non supprimé : ${err.message}`))
    }
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
