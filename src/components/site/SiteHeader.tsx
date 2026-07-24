import type { Identite, Menu } from '../../payload-types'
import { pageLink } from '../../lib/links'
import { SiteImage } from './SiteImage'

/** Public header: logo (or company name), slogan, and the main navigation. */
export const SiteHeader = ({ identite, menu }: { identite: Identite; menu: Menu }) => {
  const items = (menu.items ?? [])
    .map((item) => pageLink(item.page, item.label))
    .filter((link): link is { href: string; label: string } => link !== null)

  return (
    <header className="border-b border-black/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <a href="/" className="flex items-center gap-3">
          {identite.logo ? (
            <SiteImage media={identite.logo} priority sizes="200px" className="h-12 w-auto" />
          ) : (
            <span className="text-xl font-bold text-brand">{identite.companyName}</span>
          )}
          {identite.slogan ? <span className="hidden text-sm sm:inline">{identite.slogan}</span> : null}
        </a>

        {items.length > 0 ? (
          <nav aria-label="Navigation principale">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {items.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="font-medium hover:text-brand">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </header>
  )
}
