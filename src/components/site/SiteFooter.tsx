import type { Identite, LegalPage, PiedDePage, Reseau } from '../../payload-types'
import { pageLink } from '../../lib/links'
import { SocialIcon } from './SocialIcon'

const networkLabel = (platform: string): string =>
  ({
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    x: 'X',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    other: 'Site',
  })[platform] ?? platform

/** Public footer: link columns, social links, and a copyright line. */
export const SiteFooter = ({
  identite,
  piedDePage,
  reseaux,
  legalPages,
  year,
}: {
  identite: Identite
  piedDePage: PiedDePage
  reseaux: Reseau
  legalPages: Pick<LegalPage, 'slug' | 'title'>[]
  year: number
}) => {
  const columns = piedDePage.columns ?? []
  const social = reseaux.links ?? []
  const copyright =
    piedDePage.copyright?.trim() || `© ${year} ${identite.companyName}. Tous droits réservés.`

  return (
    <footer className="mt-16 border-t border-black/10 bg-brand/5">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {columns.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((column, i) => (
              <div key={column.id ?? i}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">{column.title}</h2>
                <ul className="space-y-2">
                  {(column.links ?? []).map((link, j) => {
                    const resolved = pageLink(link.page, link.label)
                    if (!resolved) return null
                    return (
                      <li key={link.id ?? j}>
                        <a href={resolved.href} className="hover:text-brand">
                          {resolved.label}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : null}

        {social.length > 0 ? (
          <nav aria-label="Réseaux sociaux" className="mt-8">
            <ul className="flex flex-wrap gap-4">
              {social.map((link, i) => (
                <li key={link.id ?? i}>
                  <a
                    href={link.url}
                    aria-label={networkLabel(link.platform)}
                    className="inline-flex hover:text-brand"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SocialIcon platform={link.platform} />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {legalPages.length > 0 ? (
          <nav aria-label="Informations légales" className="mt-8">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {legalPages
                .filter((legal) => legal.slug)
                .map((legal) => (
                  <li key={legal.slug}>
                    <a href={`/${legal.slug}`} className="hover:text-brand">
                      {legal.title}
                    </a>
                  </li>
                ))}
            </ul>
          </nav>
        ) : null}

        <p className="mt-8 text-sm">{copyright}</p>
      </div>
    </footer>
  )
}
