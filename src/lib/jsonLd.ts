import type { Actualite, Category, Contact, Horaire, Identite, Media } from '../payload-types'
import { DAY_SCHEMA_ORG } from './hours'

/**
 * Build the LocalBusiness structured data from data the owner already entered
 * (identity, contact, hours). This is what search engines and content crawlers
 * read to show the business card, opening hours, and contact details.
 */
export const buildLocalBusinessJsonLd = (
  identite: Identite,
  contact: Contact,
  horaires: Horaire,
  serverUrl: string,
): Record<string, unknown> => {
  const address = identite.address ?? {}

  const openingHours = (horaires.week ?? [])
    .filter((day) => !day.closed && day.slots && day.slots.length > 0)
    .flatMap((day) =>
      (day.slots ?? []).map((slot) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: DAY_SCHEMA_ORG[day.day],
        opens: slot.from,
        closes: slot.to,
      })),
    )

  const logo = identite.logo
  const logoUrl = logo && typeof logo === 'object' ? (logo as Media).url : null

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: identite.companyName,
    url: serverUrl,
  }

  if (identite.activityDescription) jsonLd.description = identite.activityDescription
  if (contact.phone) jsonLd.telephone = contact.phone
  if (contact.email) jsonLd.email = contact.email
  if (logoUrl) jsonLd.image = new URL(logoUrl, serverUrl).toString()

  if (address.street || address.postalCode || address.city) {
    jsonLd.address = {
      '@type': 'PostalAddress',
      streetAddress: address.street ?? undefined,
      postalCode: address.postalCode ?? undefined,
      addressLocality: address.city ?? undefined,
      addressCountry: 'FR',
    }
  }

  if (openingHours.length > 0) jsonLd.openingHoursSpecification = openingHours

  return jsonLd
}

/**
 * BlogPosting structured data for a single article: what search engines read to
 * show the headline, date, and publisher for a news item.
 */
export const buildArticleJsonLd = (
  article: Actualite,
  identite: Identite,
  serverUrl: string,
  path: string,
): Record<string, unknown> => {
  const image = article.image
  const imageUrl = image && typeof image === 'object' ? (image as Media).url : null
  const category = article.category
  const section = category && typeof category === 'object' ? (category as Category).name : undefined

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    url: new URL(path, serverUrl).toString(),
    publisher: { '@type': 'Organization', name: identite.companyName },
  }

  if (article.publishedDate) jsonLd.datePublished = article.publishedDate
  if (article.updatedAt) jsonLd.dateModified = article.updatedAt
  if (article.excerpt) jsonLd.description = article.excerpt
  if (section) jsonLd.articleSection = section
  if (imageUrl) jsonLd.image = new URL(imageUrl, serverUrl).toString()

  return jsonLd
}
