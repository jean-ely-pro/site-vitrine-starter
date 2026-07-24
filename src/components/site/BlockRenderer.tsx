import { RichText } from '@payloadcms/richtext-lexical/react'

import type { Contact, Horaire, Page } from '../../payload-types'
import { DAY_LABELS_FR, formatDayHours } from '../../lib/hours'
import { pageLink, resolveCta } from '../../lib/links'
import { ContactForm } from './ContactForm'
import { SiteImage } from './SiteImage'

type Block = NonNullable<Page['layout']>[number]
type BlockOf<T extends Block['blockType']> = Extract<Block, { blockType: T }>

const Section = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`mx-auto w-full max-w-5xl px-6 py-12 ${className}`}>{children}</section>
)

const CtaButton = ({ href, label, className = '' }: { href: string; label: string; className?: string }) => (
  <a
    href={href}
    className={`inline-block rounded-md bg-brand px-6 py-3 font-semibold text-white shadow transition-shadow hover:shadow-lg ${className}`}
  >
    {label}
  </a>
)

const HeroBlock = ({
  block,
  contact,
  asH1 = false,
}: {
  block: BlockOf<'hero'>
  contact: Contact
  asH1?: boolean
}) => {
  const cta = resolveCta(block.cta, contact)
  const Heading = asH1 ? 'h1' : 'h2'
  return (
    <section className="relative isolate overflow-hidden">
      {block.image ? (
        <SiteImage media={block.image} priority className="absolute inset-0 -z-10 h-full w-full object-cover" />
      ) : null}
      <div className={`mx-auto max-w-5xl px-6 py-24 ${block.image ? 'text-white' : 'text-ink'}`}>
        <Heading className="text-4xl font-bold tracking-tight sm:text-5xl">{block.heading}</Heading>
        {block.subheading ? <p className="mt-4 max-w-2xl text-lg">{block.subheading}</p> : null}
        {cta ? <CtaButton href={cta.href} label={cta.label} className="mt-8" /> : null}
      </div>
      {/* Scrim keeps text readable over any image while never hiding the image from crawlers. */}
      {block.image ? <div className="absolute inset-0 -z-[5] bg-black/45" aria-hidden="true" /> : null}
    </section>
  )
}

const TextImageBlock = ({ block }: { block: BlockOf<'textImage'> }) => (
  <Section>
    <div
      className={`flex flex-col items-center gap-10 md:flex-row ${
        block.imagePosition === 'left' ? 'md:flex-row-reverse' : ''
      }`}
    >
      <div className="flex-1">
        {block.heading ? <h2 className="mb-4 text-3xl font-bold">{block.heading}</h2> : null}
        {block.content ? <RichText data={block.content} className="rich-text" /> : null}
      </div>
      {block.image ? (
        <div className="flex-1">
          <SiteImage
            media={block.image}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="h-auto w-full rounded-lg"
          />
        </div>
      ) : null}
    </div>
  </Section>
)

const ServicesBlock = ({ block }: { block: BlockOf<'services'> }) => (
  <Section>
    {block.heading ? <h2 className="text-center text-3xl font-bold">{block.heading}</h2> : null}
    {block.intro ? <p className="mx-auto mt-3 max-w-2xl text-center">{block.intro}</p> : null}
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {(block.cards ?? []).map((card, i) => (
        <div key={card.id ?? i} className="rounded-lg border border-black/10 p-6">
          <h3 className="text-xl font-semibold text-brand">{card.title}</h3>
          <p className="mt-2">{card.description}</p>
        </div>
      ))}
    </div>
  </Section>
)

const HoursBlock = ({ block, horaires }: { block: BlockOf<'hours'>; horaires: Horaire }) => (
  <Section>
    {block.heading ? <h2 className="text-3xl font-bold">{block.heading}</h2> : null}
    <dl className="mt-6 max-w-md">
      {(horaires.week ?? []).map((day, i) => (
        <div key={day.id ?? i} className="flex justify-between border-b border-black/10 py-2">
          <dt className="font-medium">{DAY_LABELS_FR[day.day]}</dt>
          <dd>{formatDayHours(day)}</dd>
        </div>
      ))}
    </dl>
    {block.note ? <p className="mt-4 italic">{block.note}</p> : null}
  </Section>
)

const ContactDetailsBlock = ({ block, contact }: { block: BlockOf<'contactDetails'>; contact: Contact }) => {
  const tel = contact.phone ? contact.phone.replace(/[^\d+]/g, '') : null
  const { street, postalCode, city } = contact.address ?? {}
  return (
    <Section>
      {block.heading ? <h2 className="text-3xl font-bold">{block.heading}</h2> : null}
      {block.intro ? <p className="mt-3 max-w-2xl">{block.intro}</p> : null}
      <ul className="mt-6 space-y-3 text-lg">
        {contact.phone && tel ? (
          <li>
            Téléphone : <a href={`tel:${tel}`} className="font-semibold text-brand underline">{contact.phone}</a>
          </li>
        ) : null}
        {contact.email ? (
          <li>
            E-mail :{' '}
            <a href={`mailto:${contact.email}`} className="font-semibold text-brand underline">
              {contact.email}
            </a>
          </li>
        ) : null}
        {street || city ? (
          <li>
            Adresse : {[street, [postalCode, city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
          </li>
        ) : null}
      </ul>
      {(contact.ctaButtons ?? []).length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {(contact.ctaButtons ?? []).map((button, i) => {
            const cta = resolveCta(button, contact)
            return cta ? <CtaButton key={button.id ?? i} href={cta.href} label={cta.label} /> : null
          })}
        </div>
      ) : null}
    </Section>
  )
}

const CallToActionBlock = ({ block, contact }: { block: BlockOf<'callToAction'>; contact: Contact }) => {
  const cta = resolveCta(block.button, contact)
  return (
    <Section className="text-center">
      <div className="rounded-2xl bg-brand/10 px-6 py-12">
        <h2 className="text-3xl font-bold">{block.heading}</h2>
        {block.text ? <p className="mx-auto mt-3 max-w-2xl">{block.text}</p> : null}
        {cta ? <CtaButton href={cta.href} label={cta.label} className="mt-8" /> : null}
      </div>
    </Section>
  )
}

const ContactFormBlockView = ({ block }: { block: BlockOf<'contactForm'> }) => {
  const privacy = pageLink(block.privacyPage)
  return (
    <Section>
      {block.heading ? <h2 className="text-3xl font-bold">{block.heading}</h2> : null}
      {block.intro ? <p className="mt-3 max-w-xl">{block.intro}</p> : null}
      <div className="mt-6">
        <ContactForm privacyHref={privacy?.href} />
      </div>
    </Section>
  )
}

/** Renders a page's blocks in order. Contact and hours globals feed the blocks that need them. */
export const BlockRenderer = ({
  blocks,
  contact,
  horaires,
  firstHeroAsH1 = false,
}: {
  blocks: Page['layout']
  contact: Contact
  horaires: Horaire
  firstHeroAsH1?: boolean
}) => (
  <>
    {(blocks ?? []).map((block, i) => {
      const key = block.id ?? `${block.blockType}-${i}`
      switch (block.blockType) {
        case 'hero':
          return <HeroBlock key={key} block={block} contact={contact} asH1={firstHeroAsH1 && i === 0} />
        case 'textImage':
          return <TextImageBlock key={key} block={block} />
        case 'services':
          return <ServicesBlock key={key} block={block} />
        case 'hours':
          return <HoursBlock key={key} block={block} horaires={horaires} />
        case 'contactDetails':
          return <ContactDetailsBlock key={key} block={block} contact={contact} />
        case 'contactForm':
          return <ContactFormBlockView key={key} block={block} />
        case 'callToAction':
          return <CallToActionBlock key={key} block={block} contact={contact} />
        default:
          return null
      }
    })}
  </>
)
