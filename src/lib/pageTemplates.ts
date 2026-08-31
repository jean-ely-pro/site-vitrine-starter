/**
 * Page templates. A new page can start from a model instead of a blank canvas,
 * so the owner sees a real structure to edit rather than an empty screen. The
 * text is placeholder copy in French, meant to be replaced.
 */

import { buildRichText } from './richTextBuilder'

// Minimal valid Lexical state holding a single paragraph.
const paragraph = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
        ],
      },
    ],
  },
})

export type PageTemplate = 'blank' | 'services' | 'about' | 'pricing' | 'servicesIcons'

export const PAGE_TEMPLATE_OPTIONS: { label: string; value: PageTemplate }[] = [
  { label: 'Page vierge', value: 'blank' },
  { label: 'Modèle Services', value: 'services' },
  { label: 'Modèle À propos', value: 'about' },
  { label: 'Modèle Tarifs', value: 'pricing' },
  { label: 'Modèle Services (icônes)', value: 'servicesIcons' },
]

// Each template returns the blocks to pre-fill the page layout with.
const templates: Record<Exclude<PageTemplate, 'blank'>, () => unknown[]> = {
  services: () => [
    {
      blockType: 'hero',
      heading: 'Nos services',
      subheading: 'Présentez en une phrase ce que vous proposez.',
      cta: { label: 'Nous contacter', action: 'phone' },
    },
    {
      blockType: 'services',
      heading: 'Nos prestations',
      intro: 'Décrivez brièvement vos principales prestations.',
      cards: [
        { title: 'Première prestation', description: 'Décrivez cette prestation en une ou deux phrases.' },
        { title: 'Deuxième prestation', description: 'Décrivez cette prestation en une ou deux phrases.' },
        { title: 'Troisième prestation', description: 'Décrivez cette prestation en une ou deux phrases.' },
      ],
    },
    {
      blockType: 'callToAction',
      heading: 'Un projet en tête ?',
      text: 'Contactez-nous pour en discuter.',
      button: { label: 'Nous appeler', action: 'phone' },
    },
  ],
  about: () => [
    {
      blockType: 'hero',
      heading: 'À propos',
      subheading: 'Quelques mots sur qui vous êtes.',
    },
    {
      blockType: 'textImage',
      heading: 'Notre histoire',
      content: paragraph('Racontez votre parcours, vos valeurs et ce qui vous distingue.'),
      imagePosition: 'right',
    },
    {
      blockType: 'contactDetails',
      heading: 'Nous rencontrer',
      intro: 'Retrouvez nos coordonnées ci-dessous.',
    },
  ],
  pricing: () => [
    {
      blockType: 'hero',
      heading: 'Nos tarifs',
      subheading: 'Des prix clairs, sans surprise.',
    },
    {
      blockType: 'services',
      heading: 'Nos formules',
      intro: 'Présentez vos formules ou vos gammes de prix.',
      cards: [
        { title: 'Formule de base', description: 'Ce que comprend cette formule, et son prix.' },
        { title: 'Formule intermédiaire', description: 'Ce que comprend cette formule, et son prix.' },
        { title: 'Formule complète', description: 'Ce que comprend cette formule, et son prix.' },
      ],
    },
    {
      blockType: 'callToAction',
      heading: 'Besoin d’un devis ?',
      text: 'Demandez un devis personnalisé et gratuit.',
      button: { label: 'Demander un devis', action: 'email' },
    },
  ],
  servicesIcons: () => [
    {
      blockType: 'servicesIcons',
      eyebrow: 'L’excellence au service de l’humain',
      heading: 'Nos Services',
      intro:
        'Nous vous accompagnons à chaque étape de votre projet, en collaboration avec des professionnels complémentaires (avocats, experts-comptables, agents immobiliers, CGPI…), afin de sécuriser l’ensemble de votre opération.',
      services: [
        {
          icon: 'home',
          title: 'Acheter / Vendre',
          content: buildRichText([
            {
              text: 'Vous projetez d’acheter ou de vendre un bien immobilier (appartement, maison, terrain constructible) ? Vous souhaitez discuter de votre projet avec notre équipe et obtenir des explications sur les étapes nécessaires à la constitution de votre dossier ?',
            },
            { text: 'Nos experts vous accompagnent tout au long du processus :' },
            {
              items: [
                'Analyse des éléments essentiels à vérifier avant l’acquisition',
                'Sécurisation juridique de l’opération',
                'Estimation détaillée des frais liés à l’achat',
                'Évaluation et calcul de la plus-value potentielle en cas de revente',
              ],
            },
          ]),
          note: 'Nous mettons à votre disposition un accompagnement personnalisé, transparent et rigoureux afin de concrétiser votre projet immobilier en toute confiance.',
        },
        {
          icon: 'scroll',
          title: 'Succession',
          content: buildRichText([
            {
              text: 'À la suite du décès d’un proche, de nombreuses questions peuvent se poser : quelles formalités accomplir ? Quels justificatifs fournir ? Quel sera le montant des frais liés à la succession ?',
            },
            {
              text: 'Le notaire vous guide à chaque étape afin de vous apporter des réponses précises et d’assurer un règlement de la succession dans un cadre juridique sécurisé.',
            },
          ]),
        },
        {
          icon: 'heartCrack',
          title: 'Divorcer',
          content: buildRichText([
            {
              text: 'Le notaire occupe une place centrale dans le cadre d’une procédure de divorce. Il vous conseille et vous accompagne pour répondre à vos questions, vous guider dans les démarches à entreprendre, préciser les pièces à fournir et vous éclairer sur les coûts liés à la procédure.',
            },
            {
              text: 'À vos côtés, il garantit la sécurisation des enjeux patrimoniaux et veille à l’organisation équitable du partage des biens.',
            },
          ]),
        },
        {
          icon: 'heart',
          title: 'Le Couple',
          content: buildRichText([
            {
              text: 'La vie de couple peut aujourd’hui s’organiser selon différentes formes juridiques. Quel que soit votre projet commun, il est essentiel d’anticiper et d’assurer votre protection, à la fois individuelle et partagée.',
            },
            {
              text: 'Le notaire vous conseille et vous accompagne afin de déterminer la solution la plus appropriée à votre situation et à vos objectifs.',
            },
          ]),
        },
        {
          icon: 'gift',
          title: 'Donation',
          content: buildRichText([
            {
              text: 'À un moment ou à un autre, la transmission anticipée d’une partie de son patrimoine à ses proches devient une question essentielle. Quels bénéfices peut-elle présenter sur les plans pratique, juridique et fiscal ?',
            },
            {
              text: 'Le notaire vous conseille afin d’anticiper cette démarche et de structurer votre projet de transmission dans un cadre sécurisé, en adéquation avec votre situation personnelle et vos objectifs.',
            },
          ]),
        },
        {
          icon: 'building',
          title: 'Transmission d’Entreprise',
          content: buildRichText([
            {
              text: 'La transmission d’une entreprise implique des enjeux juridiques, fiscaux et patrimoniaux majeurs.',
            },
            {
              text: 'Le notaire vous accompagne dans l’anticipation et la structuration de votre projet afin de sécuriser les opérations, protéger vos intérêts et assurer la continuité de votre activité.',
            },
          ]),
        },
        {
          icon: 'globe',
          title: 'Droit International Privé',
          content: buildRichText([
            {
              text: 'Le droit international privé encadre les situations présentant un élément d’extranéité, impliquant l’application de plusieurs systèmes juridiques.',
            },
            {
              text: 'Le notaire vous accompagne pour analyser votre situation, déterminer les règles applicables et sécuriser vos projets dans un environnement international.',
            },
          ]),
        },
      ],
      toolsEyebrow: 'Expertise Digitale',
      toolsHeading: 'Outils et Simulateurs',
      toolsIntro: 'Préparez vos projets avec nos outils de calcul en ligne pour une vision claire de votre patrimoine.',
      tools: [
        {
          icon: 'calculator',
          title: 'Simulateur de prêt',
          description: 'Estimez votre capacité d’emprunt et vos mensualités pour votre futur projet immobilier.',
          cta: { label: 'Accéder au simulateur', action: 'external', url: '#' },
        },
        {
          icon: 'percent',
          title: 'Calcul des frais de mainlevée',
          description: 'Calculez le coût de la radiation d’une hypothèque suite au remboursement de votre crédit.',
          cta: { label: 'Lancer le calcul', action: 'external', url: '#' },
        },
        {
          icon: 'trendingUp',
          title: 'Baromètre immobilier',
          description: 'Consultez les tendances du marché et les prix au m² pour orienter votre transaction.',
          cta: { label: 'Voir les statistiques', action: 'external', url: '#' },
        },
        {
          icon: 'fileText',
          title: 'Calcul des frais d’acte',
          description: 'Obtenez une estimation précise des frais d’acquisition pour votre achat immobilier.',
          cta: { label: 'Estimer mes frais', action: 'external', url: '#' },
        },
        {
          icon: 'lineChart',
          title: 'Simulateur impôts plus-value',
          description: 'Anticipez l’imposition lors de la revente de votre bien immobilier hors résidence principale.',
          cta: { label: 'Calculer l’impôt', action: 'external', url: '#' },
        },
        {
          icon: 'users',
          title: 'Calcul des droits de succession',
          description: 'Évaluez le montant des droits à payer selon le lien de parenté et l’actif successoral.',
          cta: { label: 'Simuler les droits', action: 'external', url: '#' },
        },
      ],
      decorativeWords: ['FAMILLE', 'AVENIR', 'RIGUEUR'],
    },
  ],
}

export const getTemplateBlocks = (template: PageTemplate): unknown[] =>
  template === 'blank' ? [] : templates[template]()
