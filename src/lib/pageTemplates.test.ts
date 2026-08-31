import { describe, expect, it } from "vitest";

import { applyTemplate } from "../collections/hooks/applyTemplate";
import { getTemplateBlocks } from "./pageTemplates";

type ServicesIconsBlock = {
  blockType: string;
  eyebrow?: string;
  heading?: string;
  services?: {
    title: string;
    icon: string;
    note?: string;
    content?: { root: { children: unknown[] } };
  }[];
  tools?: {
    title: string;
    icon: string;
    description: string;
    cta: { label: string; action?: string; url?: string };
  }[];
  decorativeWords?: string[];
};

/** Simule la création d'une page dans le back office avec le modèle « Services (icônes) ». */
describe("pageTemplates — Modèle Services (icônes)", () => {
  it("pré-remplit une page vierge créée avec le modèle servicesIcons", () => {
    const data = {
      title: "Nos services",
      template: "servicesIcons",
      layout: undefined,
    };
    const result = applyTemplate({
      data,
      operation: "create",
    } as never);

    const blocks = result.layout as unknown[];
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks).toHaveLength(1);
    expect((blocks[0] as { blockType: string }).blockType).toBe(
      "servicesIcons",
    );
  });

  it("reproduit l’intégralité de l’écran « Les Services (French Icons) »", () => {
    const [block] = getTemplateBlocks("servicesIcons") as [ServicesIconsBlock];

    expect(block.blockType).toBe("servicesIcons");
    expect(block.eyebrow).toBe("L’excellence au service de l’humain");
    expect(block.heading).toBe("Nos Services");

    // Les 7 prestations du design, chacune avec son icône et son titre.
    expect(block.services).toHaveLength(7);
    const titles = block.services?.map((s) => s.title);
    expect(titles).toEqual([
      "Acheter / Vendre",
      "Succession",
      "Divorcer",
      "Le Couple",
      "Donation",
      "Transmission d’Entreprise",
      "Droit International Privé",
    ]);

    // La première prestation porte la liste à puces et la note conclusive.
    const premier = block.services?.[0];
    expect(premier?.icon).toBe("home");
    const children = premier?.content?.root.children ?? [];
    expect(children).toHaveLength(3);
    const liste = children[2] as {
      type: string;
      tag: string;
      children: unknown[];
    };
    expect(liste.type).toBe("list");
    expect(liste.tag).toBe("ul");
    expect(liste.children).toHaveLength(4);
    expect(premier?.note).toContain("accompagnement personnalisé");

    // La grille des 6 outils, chacun avec un bouton.
    expect(block.tools).toHaveLength(6);
    expect(block.tools?.every((t) => t.cta?.label && t.cta?.url === "#")).toBe(
      true,
    );

    // Les mots décoratifs de fin de section.
    expect(block.decorativeWords).toEqual(["FAMILLE", "AVENIR", "RIGUEUR"]);
  });

  it("ne modifie pas une page qui a déjà des blocs", () => {
    const data = {
      title: "Existant",
      template: "servicesIcons",
      layout: [{ blockType: "hero", heading: "Déjà là" }],
    };
    const result = applyTemplate({ data, operation: "create" } as never);
    expect(result.layout).toEqual(data.layout);
  });
});
