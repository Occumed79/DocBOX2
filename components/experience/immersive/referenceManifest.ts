export type ReferenceMechanic = {
  id: string;
  reference: string;
  target: string;
  mechanics: readonly string[];
  acceptance: readonly string[];
};

export const REFERENCE_MECHANICS: readonly ReferenceMechanic[] = [
  {
    id: 'oryzo-cinematic-story',
    reference: 'Oryzo AI — Lusion (https://oryzo.ai)',
    target: '/experience company story',
    mechanics: [
      'persistent subject-centered render world',
      'continuous camera-led scene continuity',
      'DOM narrative synchronized to rendered media',
      'seamless media transitions instead of slide replacement',
      'pointer-reactive depth and lighting',
      'desktop/mobile render budgets',
    ],
    acceptance: [
      'one render stage survives all eleven story chapters',
      'every chapter has authored entry and exit choreography',
      'scroll velocity and local chapter progress affect rendered media',
      'mobile uses a lower-complexity authored mode',
    ],
  },
  {
    id: 'zero-spatial-portals',
    reference: 'Zero Tech — Lusion (https://client-zero-tech.lusion.co/)',
    target: 'post-story Your Facility hub',
    mechanics: [
      'realtime 3D spatial environment',
      'large type integrated with a rendered world',
      'scroll-led state transitions',
      'spatial choices rather than flat navigation cards',
      'interactive portal focus and camera targeting',
    ],
    acceptance: [
      'five portal objects exist in render space',
      'pointer/raycast selection highlights a portal',
      'camera travels toward selected portal',
      'keyboard and touch equivalents remain available in DOM',
    ],
  },
  {
    id: 'lusion-world-transition',
    reference: 'Lusion studio (https://lusion.co/)',
    target: 'Resources and Agreement portal travel',
    mechanics: [
      'fixed WebGL surface behind semantic DOM',
      'DOM-to-render synchronization',
      'smoothed scroll and velocity uniforms',
      'depth/fall transition into another world',
      'persistent world state across transitions',
    ],
    acceptance: [
      'selected portal fills the render frame before route/workspace transition',
      'travel has acceleration, depth cues, and environment change',
      'destination resolves into usable ordinary UI without a hard visual cut',
    ],
  },
  {
    id: 'nasdaq-history',
    reference: 'Nasdaq 50th Anniversary — makemepulse (https://www.makemepulse.com/case-study/nasdaq-50th-anniversary/)',
    target: '/experience/history',
    mechanics: [
      'particle-built opening identity replacing the original Nasdaq 50 with Occu-Med history identity',
      'enter transition into a WebGL chronological exhibition',
      'multiple undulating point-cloud timeline bands',
      'each timeline band maps to a content topic or milestone',
      'hover/focus illumination at the individual particle level',
      'prominent key dates with supporting archival stories',
      'direct chronology navigation plus independent/random exploration',
      'searchable/filterable historical content',
      'particle depth, blur, subtle idle motion and pointer response',
      'mobile-first authored exhibition behavior',
    ],
    acceptance: [
      'history begins with a particle-built Occu-Med year/identity state and explicit Enter transition',
      'history is not a vertical timeline or row of ordinary cards',
      'multiple particle-wave lines remain visible simultaneously as an overview of the archive',
      'hovering or selecting a milestone visibly illuminates its associated line',
      'years are navigable in spatial/depth chronology',
      'milestones expand into accessible archive content',
      'search and topic filters can jump independently between chapters',
      'desktop and mobile chronology both remain functional',
    ],
  },
  {
    id: 'blue-corridors-network',
    reference: 'Protecting Blue Corridors (https://bluecorridors.org/explore/species)',
    target: '/experience/network',
    mechanics: [
      'full-screen geographic application shell',
      'layer drawer and multiple exploration modes',
      'Mapbox/Deck.gl style base-map plus GPU data layers',
      'hierarchical geography and object profiles',
      'multiple simultaneous layer families',
      'tooltips, attribution, search, reset, and drill-down',
    ],
    acceptance: [
      'real provider coordinates drive the geographic view',
      'provider type, services, and geography can be combined',
      'zoom, pan, touch pinch, search, reset, and select are implemented',
      'an accessible list view exposes equivalent results',
      'public output remains privacy-preserving',
    ],
  },
] as const;

export const EXPERIENCE_ACCEPTANCE_GATES = [
  'persistent render stage',
  'continuous scroll timeline',
  'scene-specific choreography',
  'pointer-reactive render objects',
  'spatial portal selection',
  'camera travel between worlds',
  'WebGL history exhibition',
  'real geographic network explorer',
  'adaptive quality tiers',
  'authored reduced-motion fallbacks',
  'keyboard/touch equivalents',
  'visual capture before completion claims',
] as const;
