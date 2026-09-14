export type ReferenceMechanic = {
  id: string;
  reference: string;
  target: string;
  mechanics: readonly string[];
  acceptance: readonly string[];
};

// HARD RULE: each reference belongs only to the target listed below.
// Do not blend its visual language into another experience section.
// Reproduce visible structure, spatial relationships, pacing and interaction
// behavior with Occu-Med content; never copy proprietary source/assets.
export const REFERENCE_MECHANICS: readonly ReferenceMechanic[] = [
  {
    id: 'oryzo-cinematic-story',
    reference: 'Oryzo AI — Lusion',
    target: '/experience — company story only',
    mechanics: [
      'persistent WebGL story world',
      'scroll-scrubbed camera and Z-depth choreography',
      'masked oversized typography synchronized with scene progress',
      'asymmetrical editorial composition',
      'media entering and leaving depth rather than slide replacement',
      'pointer-reactive camera parallax',
    ],
    acceptance: [
      'the eleven Occu-Med chapters remain one continuous cinematic scroll',
      'the approved twenty-six Occu-Med photos retain their exact authored order',
      'Oryzo mechanics are tailored to each Occu-Med chapter rather than copying Oryzo product art direction',
      'no Nasdaq, Blue Corridors, Zero Tech or Lusion-studio navigation grammar appears inside the story',
    ],
  },
  {
    id: 'zero-spatial-portals',
    reference: 'Zero Tech — Lusion',
    target: '/experience#provider-portals — provider hub only',
    mechanics: [
      'realtime 3D central traveler environment',
      'five spatial destination portals',
      'minimal labels projected from render-space positions',
      'focus reorganizes depth and camera attention',
      'selection approaches and passes through the chosen portal',
    ],
    acceptance: [
      'one astronaut/traveler anchors the scene',
      'exactly five portal destinations are present: History, Network, Resources, Provider Q&A and Agreement',
      'portal selection is spatial rather than a card/sidebar navigation system',
      'Zero Tech visual/navigation grammar does not leak into destination pages',
    ],
  },
  {
    id: 'nasdaq-history',
    reference: 'Nasdaq 50th Anniversary — makemepulse',
    target: '/experience/history only',
    mechanics: [
      'continuous horizontal WebGL chronology',
      'large year anchors and archival media layered in depth',
      'scroll-led exhibition camera',
      'direct milestone navigation',
      'searchable historical archive',
      'opened story views distinct from the chronology',
    ],
    acceptance: [
      'History reads as an interactive WebGL exhibition rather than a conventional vertical timeline',
      'milestones are grounded in the Occu-Med company-story source material',
      'year navigation moves the exhibition deterministically',
      'Nasdaq visual grammar remains isolated to History',
    ],
  },
  {
    id: 'blue-corridors-network',
    reference: 'WWF Protecting Blue Corridors',
    target: '/experience/network only',
    mechanics: [
      'dominant full-screen geographic canvas',
      'fixed left exploration rail',
      'layer families and geographic exploration modes',
      'selectable mapped objects with drill-down state',
      'compact contextual metadata without obscuring the map',
    ],
    acceptance: [
      '23,524 valid anonymized coordinates drive the live Cesium globe',
      'medical, dental, diagnostic and pharmacy layers use the verified mapped totals',
      'terrain, orbit, region flights and node lock remain functional',
      'all controls preserve required Cesium attribution and provider privacy',
      'Blue Corridors grammar remains isolated to Network',
    ],
  },
  {
    id: 'lusion-resources',
    reference: 'Lusion studio site',
    target: '/experience/resources only',
    mechanics: [
      'depth-led portal/descent entry',
      'one dominant rendered project/specialty object at a time',
      'clean stacked featured-work style selector',
      'restrained editorial metadata around the rendered object',
      'transition from immersive selection into usable resource information',
    ],
    acceptance: [
      'specialties are selected from one clean list rather than cards or a floating constellation',
      'only one specialty object is rendered as the focal project at a time',
      'no giant repeated specialty-name backdrop is present',
      'the selected specialty carries into the provider workflow and agreement route',
      'Lusion-studio grammar remains isolated to Resources',
    ],
  },
  {
    id: 'blue-corridors-questions',
    reference: 'WWF Protecting Blue Corridors',
    target: '/experience/questions only',
    mechanics: [
      'fixed left exploration rail',
      'category/layer controls inside the rail',
      'dominant spatial information field',
      'selectable information entries',
      'right-side detail drawer for the selected item',
    ],
    acceptance: [
      'Receive, Schedule, Examine, Return and Invoice remain the lifecycle exploration sections',
      'questions are navigated from the exploration rail rather than scattered DOM cards',
      'the spatial field supports up to six active question nodes',
      'answers remain grounded in the current Occu-Med provider workflow',
      'Blue Corridors grammar remains isolated to Provider Q&A',
    ],
  },
  {
    id: 'agreement-handoff',
    reference: 'Occu-Med Forms workflow',
    target: '/experience/agreement only',
    mechanics: [
      'cinematic portal entry into the agreement environment',
      'transition ends before the real form workflow begins',
      'existing PricingAgreementBuilder remains the functional source of truth',
    ],
    acceptance: [
      'the cinematic gateway does not replace or imitate the real form',
      'selected specialty and matching services carry into the agreement flow',
      'the real Forms/PricingAgreementBuilder UI renders without an invented fake form shell',
    ],
  },
] as const;

export const EXPERIENCE_ACCEPTANCE_GATES = [
  'one reference system per section',
  'source-grounded Occu-Med story and history content',
  'continuous Oryzo-style story choreography',
  'Zero Tech spatial five-portal hub',
  'Nasdaq-style WebGL history chronology',
  'Blue Corridors-style Network explorer',
  'Lusion-style Resources selection experience',
  'Blue Corridors-style Provider Q&A explorer',
  'cinematic Agreement handoff into the real Forms workflow',
  'adaptive rendering and reduced-motion fallbacks',
  'keyboard and touch equivalents for interactive controls',
  'build and browser regression evidence before completion claims',
] as const;
