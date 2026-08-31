import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Block } from "payload";

import type { Contact, Page } from "../payload-types";
import { callToActionField } from "../fields/callToAction";
import { restrictedRichText } from "../fields/richText";
import { resolveCta } from "../lib/links";
import { getServiceIcon, SERVICE_ICON_OPTIONS } from "../lib/serviceIcons";

/**
 * "Nos services" en style « icônes françaises » : bandeau de titre, rangées de
 * prestations en quinconce avec une grande icône dans un cercle, puis une grille
 * d'outils et de grands mots décoratifs. Les couleurs suivent le thème du back
 * office (Couleurs) via les utilitaires bg-canvas / text-ink / brand-secondary.
 */
export const ServicesIcons: Block = {
  slug: "servicesIcons",
  labels: { singular: "Services (icônes)", plural: "Services (icônes)" },
  imageAltText: "Services (icônes)",
  fields: [
    {
      name: "eyebrow",
      type: "text",
      label: "Surtitre",
      admin: {
        description:
          "Petit libellé au-dessus du titre. Ex. : « L’excellence au service de l’humain ».",
      },
    },
    {
      name: "heading",
      type: "text",
      label: "Titre",
      required: true,
      admin: {
        description: "Le grand titre de la section. Ex. : « Nos services ».",
      },
    },
    {
      name: "intro",
      type: "textarea",
      label: "Introduction",
      admin: {
        description:
          "Optionnel. Une phrase d’accroche en italique sous le titre.",
      },
    },
    {
      name: "services",
      type: "array",
      label: "Prestations",
      minRows: 1,
      labels: { singular: "Prestation", plural: "Prestations" },
      admin: {
        description:
          "Une ligne par service, en quinconce, avec sa grande icône à gauche ou à droite.",
      },
      fields: [
        {
          name: "icon",
          type: "select",
          label: "Icône",
          required: true,
          defaultValue: "scale",
          options: SERVICE_ICON_OPTIONS,
        },
        {
          name: "title",
          type: "text",
          label: "Titre",
          required: true,
        },
        {
          name: "content",
          type: "richText",
          label: "Texte",
          editor: restrictedRichText,
          admin: {
            description: "Paragraphes et liste à puces décrivant le service.",
          },
        },
        {
          name: "note",
          type: "text",
          label: "Note de fin",
          admin: {
            description:
              "Optionnel. Une phrase conclusive en italique sous le texte.",
          },
        },
      ],
    },
    {
      name: "toolsEyebrow",
      type: "text",
      label: "Surtitre des outils",
      defaultValue: "Expertise digitale",
      admin: {
        description: "Petit libellé au-dessus du titre de la grille d’outils.",
      },
    },
    {
      name: "toolsHeading",
      type: "text",
      label: "Titre des outils",
      defaultValue: "Outils et Simulateurs",
    },
    {
      name: "toolsIntro",
      type: "textarea",
      label: "Introduction des outils",
      admin: {
        description: "Optionnel. Une phrase sous le titre de la grille.",
      },
    },
    {
      name: "tools",
      type: "array",
      label: "Outils",
      minRows: 1,
      labels: { singular: "Outil", plural: "Outils" },
      admin: {
        description:
          "Les outils en ligne, affichés en cartes dans une grille de trois.",
      },
      fields: [
        {
          name: "icon",
          type: "select",
          label: "Icône",
          required: true,
          defaultValue: "calculator",
          options: SERVICE_ICON_OPTIONS,
        },
        {
          name: "title",
          type: "text",
          label: "Titre",
          required: true,
        },
        {
          name: "description",
          type: "textarea",
          label: "Description",
          required: true,
        },
        callToActionField({ name: "cta", label: "Bouton", required: true }),
      ],
    },
    {
      name: "decorativeWords",
      type: "text",
      label: "Mots décoratifs",
      hasMany: true,
      admin: {
        description:
          "Optionnel. De grands mots discrets affichés en fin de section. Ex. : FAMILLE, AVENIR, RIGUEUR.",
      },
    },
  ],
};

type ServicesIconsBlock = Extract<
  NonNullable<Page["layout"]>[number],
  { blockType: "servicesIcons" }
>;

const Section = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={`mx-auto w-full max-w-5xl px-6 py-12 ${className}`}>
    {children}
  </section>
);

/** Rendu du bloc « Services (icônes) » ; les couleurs suivent le thème du back office. */
export const ServicesIconsView = ({
  block,
  contact,
  asH1 = false,
}: {
  block: ServicesIconsBlock;
  contact: Contact;
  asH1?: boolean;
}) => {
  const Heading = asH1 ? "h1" : "h2";
  const SubHeading = asH1 ? "h2" : "h3";
  const services = block.services ?? [];
  const tools = block.tools ?? [];
  const words = block.decorativeWords ?? [];

  return (
    <>
      {/* Bandeau de titre */}
      <section className="mx-auto w-full max-w-5xl px-6 pt-16 text-center">
        {block.eyebrow ? (
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-secondary">
            {block.eyebrow}
          </p>
        ) : null}
        <Heading className="font-serif text-4xl sm:text-5xl">
          {block.heading}
        </Heading>
        <div
          className="mx-auto mt-6 h-px w-16 bg-black/10"
          aria-hidden="true"
        />
        {block.intro ? (
          <p className="mx-auto mt-6 max-w-3xl italic leading-relaxed text-black/60">
            {block.intro}
          </p>
        ) : null}
      </section>

      {/* Rangées de prestations, en quinconce */}
      {services.length > 0 ? (
        <Section className="py-12">
          <div className="space-y-24">
            {services.map((service, i) => {
              const Icon = getServiceIcon(service.icon);
              const reversed = i % 2 === 1;
              return (
                <div
                  key={service.id ?? i}
                  className={`flex flex-col items-center gap-12 md:flex-row md:gap-24 ${
                    reversed ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex-1 py-4 ${
                      reversed
                        ? "md:border-l md:border-black/10 md:pl-12"
                        : "md:border-r md:border-black/10 md:pr-12"
                    }`}
                  >
                    <SubHeading className="mb-6 font-serif text-3xl text-brand-secondary md:text-4xl">
                      {service.title}
                    </SubHeading>
                    <div className="space-y-4 leading-relaxed text-black/60">
                      {service.content ? (
                        <RichText
                          data={service.content}
                          className="rich-text"
                        />
                      ) : null}
                      {service.note ? (
                        <p className="font-medium italic">{service.note}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-1 items-center justify-center">
                    <div className="relative flex h-56 w-56 items-center justify-center md:h-64 md:w-64">
                      <Icon
                        className="h-36 w-36 text-brand-secondary/30 md:h-40 md:w-40"
                        strokeWidth={1}
                        aria-hidden="true"
                      />
                      <div
                        className="absolute inset-0 scale-110 rounded-full border border-brand-secondary/20"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      {/* Bandeau des outils */}
      {tools.length > 0 ? (
        <section className="border-t border-black/10 bg-black/5">
          <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
            {block.toolsEyebrow ? (
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-secondary">
                {block.toolsEyebrow}
              </p>
            ) : null}
            <SubHeading className="font-serif text-3xl sm:text-4xl">
              {block.toolsHeading}
            </SubHeading>
            <div
              className="mx-auto mt-5 h-px w-12 bg-black/10"
              aria-hidden="true"
            />
            {block.toolsIntro ? (
              <p className="mx-auto mt-5 max-w-xl text-black/60">
                {block.toolsIntro}
              </p>
            ) : null}
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool, i) => {
                const cta = resolveCta(tool.cta, contact);
                const Icon = getServiceIcon(tool.icon);
                return (
                  <div
                    key={tool.id ?? i}
                    className="flex h-full flex-col items-center border border-black/10 bg-canvas p-8 text-center"
                  >
                    <div className="mb-6 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-black/5">
                      <Icon
                        className="h-3/4 w-3/4 text-brand-secondary/40"
                        strokeWidth={1}
                        aria-hidden="true"
                      />
                    </div>
                    <SubHeading className="mb-4 font-serif text-xl uppercase tracking-tight">
                      {tool.title}
                    </SubHeading>
                    <p className="mb-8 flex-1 text-sm leading-relaxed text-black/60">
                      {tool.description}
                    </p>
                    {cta ? (
                      <a
                        href={cta.href}
                        className="inline-flex w-full items-center justify-center bg-ink px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-canvas transition-colors hover:bg-brand-secondary"
                      >
                        {cta.label}
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Mots décoratifs */}
      {words.length > 0 ? (
        <div className="select-none overflow-hidden py-12" aria-hidden="true">
          <div className="flex gap-24 whitespace-nowrap opacity-5">
            {words.map((word, i) => (
              <span
                key={i}
                className="font-serif text-8xl uppercase tracking-[0.2em] text-ink md:text-[140px]"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};
