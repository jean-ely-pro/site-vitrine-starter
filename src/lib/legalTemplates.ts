import { buildRichText } from './richTextBuilder'

export type LegalType = 'mentions-legales' | 'confidentialite' | 'cgu'

export const LEGAL_TYPE_OPTIONS: { label: string; value: LegalType }[] = [
  { label: 'Mentions légales', value: 'mentions-legales' },
  { label: 'Politique de confidentialité', value: 'confidentialite' },
  { label: 'Conditions générales d’utilisation', value: 'cgu' },
]

export const LEGAL_TITLES: Record<LegalType, string> = {
  'mentions-legales': 'Mentions légales',
  confidentialite: 'Politique de confidentialité',
  cgu: 'Conditions générales d’utilisation',
}

/** Company data drawn from the Identité and Contact globals to fill the pages. */
export type LegalData = {
  companyName?: string | null
  legalName?: string | null
  siret?: string | null
  address?: { street?: string | null; postalCode?: string | null; city?: string | null } | null
  email?: string | null
  phone?: string | null
}

const formatAddress = (address: LegalData['address']): string => {
  if (!address) return '[adresse à compléter]'
  const line = [address.street, [address.postalCode, address.city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
  return line || '[adresse à compléter]'
}

/**
 * Generate a legal page pre-filled from the company data. The text is real,
 * editable French boilerplate; placeholders in brackets mark what only the
 * owner or host can supply (e.g. the hosting provider).
 */
export const buildLegalContent = (type: LegalType, data: LegalData) => {
  const name = data.companyName || '[nom de l’entreprise]'
  const editor = data.legalName || data.companyName || '[raison sociale]'
  const address = formatAddress(data.address)
  const siret = data.siret || '[SIRET à compléter]'
  const email = data.email || '[e-mail de contact]'
  const phone = data.phone || '[téléphone]'

  if (type === 'mentions-legales') {
    return buildRichText([
      {
        heading: 'Éditeur du site',
        text: `Le présent site est édité par ${editor}, dont le siège est situé ${address}. SIRET : ${siret}. Contact : ${email}, ${phone}.`,
      },
      { heading: 'Directeur de la publication', text: `Le directeur de la publication est le représentant légal de ${name}.` },
      {
        heading: 'Hébergement',
        text: 'Le site est hébergé par [nom de l’hébergeur], [adresse de l’hébergeur]. À compléter avec les informations de votre hébergeur.',
      },
      {
        heading: 'Propriété intellectuelle',
        text: `L’ensemble des contenus (textes, images, logo) présents sur ce site est la propriété de ${name}, sauf mention contraire. Toute reproduction sans autorisation est interdite.`,
      },
    ])
  }

  if (type === 'confidentialite') {
    return buildRichText([
      {
        heading: 'Responsable du traitement',
        text: `Les données collectées sur ce site sont traitées par ${editor} (${email}).`,
      },
      {
        heading: 'Données collectées et finalité',
        text: 'Le formulaire de contact collecte votre nom, votre adresse e-mail et votre message, dans le seul but de répondre à votre demande. Aucune autre donnée n’est collectée à votre insu.',
      },
      { heading: 'Base légale', text: 'Le traitement repose sur votre consentement, recueilli via la case à cocher du formulaire.' },
      { heading: 'Durée de conservation', text: 'Vos données sont conservées le temps nécessaire au traitement de votre demande, puis archivées ou supprimées.' },
      {
        heading: 'Destinataires',
        text: `Vos données sont destinées à ${name} uniquement et ne sont transmises à aucun tiers.`,
      },
      {
        heading: 'Vos droits',
        text: `Vous disposez d’un droit d’accès, de rectification, d’effacement et d’opposition sur vos données. Pour l’exercer, écrivez à ${email}.`,
      },
      { heading: 'Cookies', text: 'Ce site n’utilise pas de cookies de suivi ni de ressources tierces.' },
    ])
  }

  return buildRichText([
    { heading: 'Objet', text: `Les présentes conditions régissent l’utilisation du site de ${name}.` },
    {
      heading: 'Accès au site',
      text: 'Le site est accessible gratuitement. Les frais d’accès et d’équipement restent à la charge de l’utilisateur.',
    },
    {
      heading: 'Responsabilité',
      text: `${name} s’efforce de fournir des informations exactes mais ne saurait être tenu responsable d’éventuelles erreurs ou d’une indisponibilité du site.`,
    },
    { heading: 'Contact', text: `Pour toute question, contactez-nous à ${email}.` },
  ])
}
