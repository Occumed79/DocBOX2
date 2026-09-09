# DocBOX2 Reference-Site Extraction

This document is the implementation brief for the provider experience. It records the interaction grammar, page structure, runtime architecture, and reusable mechanics extracted from the reference experiences selected for DocBOX2.

The goal is not to imitate superficial styling. The goal is to rebuild the interaction systems using Occu-Med content, assets, data, and workflows.

## Reference responsibilities

| Reference | What DocBOX2 must take from it |
| --- | --- |
| Oryzo AI — Lusion | Cinematic opening, product/subject-centered 3D composition, seamless scene continuity, scroll-led storytelling, restrained UI around a visually dominant render surface |
| Zero Tech — Lusion | Spatial, real-time 3D scene; scroll navigation; large typographic transitions; interactive system/portal feeling; a world rather than stacked marketing sections |
| Lusion studio | Persistent render stage, scroll-to-world transition, falling/depth travel, pointer-reactive 3D, full-screen transitions between DOM narrative and rendered scene |
| Nasdaq 50th Anniversary — makemepulse | WebGL anniversary/history timeline, particle-based key dates, browsable chronology, archive/exhibition behavior, searchable stories and milestones |
| Protecting Blue Corridors | Full-screen data explorer, map + drawer architecture, layer groups, filtering, object profiles, map storytelling, geographic drill-down, visualized real data |

---

# 1. Oryzo AI — cinematic story reference

## Macro structure

The live experience is not built as eleven unrelated full-screen slides. It behaves as a single product world that keeps returning to the same subject while the surrounding context changes.

Observed content sequence:

1. Hero / lived-in desk world.
2. Product proposition and cinematic introduction.
3. Interactive AI/model joke sequence.
4. Wearable / human-interface vignette.
5. Editorial/magazine-style story interruption.
6. Product feature scenes.
7. Technical/diagram content.
8. Interactive encryption demonstration.
9. Grip/material feature.
10. Sustainability and metric presentation.
11. Social proof/reviews.
12. Product comparison/specification system.
13. Open-model/research-paper ending.
14. Final studio conversion/CTA.

## Design rules documented by Lusion

Lusion describes the final design direction around four principles:

- realistic imagery/world building;
- the central subject remains visually dominant;
- seamless transitions;
- a strong narrative/personality layer.

The UX deliberately keeps the UI quiet so the rendered content can dominate. The palette and type system are intentionally constrained rather than giving every section a new visual language.

## Render pipeline documented by Lusion

The Oryzo team tested image sequences, video, and full real-time PBR before settling on a hybrid WebGL pipeline.

The published production description includes:

- WebGL / Three.js;
- Gaussian splatting for selected props and desk reflections;
- approximately 78k splats on desktop and 45k on mobile in the production tests described by Lusion;
- conventional textured geometry where splatting did not improve the result;
- camera-focused texture-density optimization around the center of the hero composition;
- desktop/mobile render budgets rather than one universal scene;
- interactive animation prototypes in Rive;
- UI/layout work in Figma.

## What this means for DocBOX2

The Occu-Med company story should use **one persistent render stage** across the entire cinematic sequence. The photos are story assets inside that world, not independent cards that simply fade in and out.

The correct translation is:

- keep a stable virtual camera and scene root;
- load the chronological photo sequence as scene media/planes;
- transition media by depth, mask, scale, camera motion, texture deformation, particle assembly/disassembly, and lighting state;
- preserve a persistent Occu-Med object or visual motif as continuity between chapters;
- use normal DOM text as an accessible narrative layer synchronized to the render timeline;
- build separate mobile complexity limits instead of merely shrinking the desktop scene.

---

# 2. Zero Tech — spatial destination / portal reference

## Macro structure

Zero is a long-form interactive world driven by a realtime 3D layer and scroll navigation.

Observed content model:

1. Full-screen identity/hero.
2. Intro state and year marker.
3. A binary Problem / Solution interaction.
4. Large sentence fragments that reorganize as the user advances.
5. Transition into a system/world introduction.
6. Native-app/service modules presented as a sequence of capabilities.
7. Repeated detail states within each capability.
8. Identity/integration system.
9. Final full-screen conversion state.

The important part is not the Web3 content. The important part is that a single 3D world carries the visitor between concepts rather than every concept being introduced as a conventional website section.

## Known technology

Lusion's own project description explicitly identifies realtime 3D, WebGL, and scroll navigation. Contemporary award/technology listings identify the original build with Three.js, TypeScript, Angular, PWA behavior, and Netlify deployment.

## DocBOX2 translation

The post-story "Your Facility" area must be a spatial scene rather than a row of glass cards.

Required mechanics:

- persistent 3D/canvas arrival world;
- real scene depth and camera parallax;
- astronaut/provider-traveler focal subject;
- a moving overhead object / signal / network artifact;
- five portal objects placed in scene space;
- hover/raycast highlighting;
- camera targeting on hover/focus;
- camera travel into the chosen portal;
- HTML equivalents for keyboard/touch/accessibility;
- visited/completion state attached to portals;
- return transition that restores the hub instead of hard-cutting back to a list.

---

# 3. Lusion studio — render architecture and falling-world transition

## Current experience structure

The current studio experience combines ordinary semantic DOM with a continuously rendered WebGL environment. The visible content moves through:

1. Hero / "scroll to explore".
2. Studio proposition.
3. Featured work.
4. "Where Creative Ideas Become Immersive Experiences" transition.
5. "Step into a new world" sequence.
6. Continued scrolling into the final world/CTA.

## Official Lusion scroll-sync architecture

Lusion publishes an MIT-licensed `WebGL-Scroll-Sync` repository. Its important architecture is directly relevant to DocBOX2:

- one Three.js renderer/canvas;
- DOM containers remain responsible for layout;
- a corresponding WebGL mesh mirrors each DOM media rectangle;
- shared shader uniforms carry viewport resolution, scroll offset, time, and scroll velocity/strength;
- `ResizeObserver` keeps render geometry synchronized with the DOM;
- an rAF loop calculates scroll delta and decays velocity over time;
- only visible meshes are rendered;
- scroll velocity is intentionally available to shaders so media can distort/react while moving.

This is the correct architectural direction for the DocBOX2 cinematic layer because it lets accessible DOM content and high-end rendered media stay locked together instead of forcing the entire application into a canvas.

## DocBOX2 translation

Create a single `ImmersiveStage` mounted for `/experience` and portal transitions. It should own:

- renderer/canvas lifecycle;
- DPR and adaptive quality;
- pointer normalization;
- inertial scroll values;
- scene progress values;
- DOM-to-render registration;
- camera state;
- transition state;
- reduced-motion mode;
- visibility culling;
- resource disposal.

The Provider Resources transition should use the Lusion "step into a new world" grammar:

1. current world remains visible;
2. selected portal fills the camera frame;
3. camera accelerates forward/downward;
4. concentric geometry/particles create depth cues;
5. environment color and light change during travel;
6. travel resolves into the specialty workspace;
7. the specialty workspace itself becomes ordinary, usable UI after the transition.

---

# 4. Nasdaq 50 — Occu-Med history reference

## Verified design core

The project is explicitly described by makemepulse as an **interactive WebGL timeline** and virtual exhibition. The chronology combines major dates, employee recollections, museum/archive content, and news material. Key dates are visually prominent and supporting stories revolve around them.

Contemporary technical commentary on the live project describes:

- a large particle-built "50" in the intro;
- continuous subtle particle motion;
- cursor-reactive brightness;
- a softly graduated environment;
- particle forms that become different chronological objects/states;
- depth/blur treatment that gives simple point primitives a richer spatial quality.

The original live site also exposed content discovery/search rather than forcing visitors to consume every milestone linearly.

## DocBOX2 translation

The history portal should not be a vertical timeline.

Required system:

- full-screen persistent WebGL history field;
- intro particle formation using `1979` / Occu-Med mark or a historical symbol;
- horizontal/depth chronology with year targets;
- each milestone represented by a particle/object composition;
- archive cards and source photography orbiting or attaching to major dates;
- drag/wheel/keyboard timeline travel;
- direct year index;
- search/filter by topic (research, company, EXAMQA, deployment, network, leadership, etc.);
- mobile-first alternative that preserves chronology without requiring high-end GPU;
- expanded milestone state with accessible DOM content;
- return-to-timeline transition rather than route reload.

---

# 5. Protecting Blue Corridors — network and Q&A/data-navigation reference

## Actual production stack

Public implementation/portfolio material identifies the Blue Corridors platform as a large:

- Next.js application;
- Payload CMS-backed system;
- GSAP / Motion animation layer;
- Mapbox geographic renderer;
- Deck.gl visualization layer.

This is not a decorative map. It is a multi-layer geospatial application.

## Homepage information architecture

The public site moves through:

1. strong visual hero;
2. headline project metrics;
3. narrative introduction;
4. explanation chapters with large imagery;
5. clear transition into "Map Their Journeys";
6. four exploration paths;
7. news/content layer;
8. newsletter/continuation.

The lesson for DocBOX2 is that high-density data should be preceded by an emotional/visual entry, then resolve into a highly functional explorer.

## Explorer information architecture

The map interface exposes multiple coordinated control systems.

Primary modes:

- Species;
- Threats & Risks;
- Priorities & Protections;
- Conservation & Solutions.

Species mode contains:

- list/profile entries;
- status and summary metrics;
- independent toggles;
- per-species layer controls;
- Tracks;
- Migration Corridors;
- Range Maps.

Threat mode contains grouped sublayers including climate, fisheries, shipping, pollution, construction, whaling, and cumulative impact.

Protection mode contains grouped overlays for priority and protected areas.

## Visual hierarchy documented by the design/development team

The Blue Corridors team describes a deliberate stacking order:

1. detailed raster range maps at the bottom;
2. corridor polygons above ranges;
3. bright satellite tracks above corridors;
4. species-specific color families so three different layer types still read as one object family;
5. illustrations/profile UI to humanize otherwise abstract data;
6. tooltips/citations/attribution integrated into the explorer;
7. map download/share/data-request actions.

The platform was designed to grow: additional species and datasets can be added without rebuilding the entire interface.

## DocBOX2 network translation

The clinic network portal should use the same application grammar, but with Occu-Med data.

Primary modes:

- Provider Type;
- Services;
- Geography;
- Program Capability.

Provider Type examples:

- Occupational Medicine;
- Medical / Primary Care;
- Dental;
- Laboratory;
- Imaging;
- Cardiology;
- Audiology;
- Pharmacy / Vaccination;
- Hospital / Urgent Care.

Geographic hierarchy:

- world;
- region;
- country;
- state/province;
- metro/city;
- coordinate cluster.

Layer hierarchy:

- base geography;
- density/coverage field;
- provider points;
- specialty/service overlays;
- selected-region boundary;
- selected facility tooltip/profile.

Interaction requirements:

- pan;
- zoom;
- touch pinch;
- hover/select;
- multi-filtering;
- search;
- reset;
- drill-down;
- accessible list equivalent;
- live result count;
- privacy-preserving public detail level.

The same Blue Corridors navigation pattern should also inform Provider Q&A: categories behave like data layers, and selecting a category changes both the visible navigation and the content field rather than presenting one giant accordion.

---

# 6. Shared implementation grammar

All five references converge on the same architectural ideas.

## Persistent rendered world

Do not mount/unmount a new canvas for every chapter. Maintain one render surface and transition scene state.

## DOM + render synchronization

Keep headings, paragraphs, buttons, forms, and accessibility semantics in DOM. Mirror media/3D placement through registered rectangles and synchronized scene progress.

## Scene registry

Every scene should define:

- id;
- scroll start/end;
- camera target;
- camera FOV/position;
- world transform;
- media/object states;
- lighting/environment state;
- entry/exit transition;
- pointer response;
- quality tier;
- reduced-motion fallback.

## Continuous timeline

Use normalized continuous progress, not only `IntersectionObserver` active/inactive state.

Track at minimum:

- raw scroll;
- smoothed scroll;
- scroll velocity;
- global experience progress;
- active scene index;
- local scene progress;
- pointer x/y;
- pointer velocity;
- viewport size/DPR;
- quality tier;
- reduced-motion preference.

## Transition language

Transitions should reuse a small number of consistent physical metaphors:

- assemble;
- converge;
- pass through;
- descend/fall;
- orbit;
- expand into a field;
- collapse into a node;
- travel toward a selected object.

## Adaptive performance

Desktop and mobile should not execute identical render loads.

Quality tiers should control:

- point/particle count;
- texture resolution;
- postprocessing;
- shadow/reflection passes;
- animation complexity;
- map layer density;
- DPR cap.

## Accessibility

Every spatial interaction needs a DOM equivalent. `prefers-reduced-motion` should use authored alternative transitions rather than simply turning every animation off and leaving broken layouts.

---

# 7. Target DocBOX2 component architecture

```text
components/experience/
  immersive/
    ImmersiveStage.tsx
    useImmersiveTimeline.ts
    usePointerField.ts
    quality.ts
    registry.ts
    media/
      DomMediaPlane.tsx
      ImageScene.tsx
      VideoScene.tsx
    particles/
      ParticleField.ts
      ParticleMorph.ts
    transitions/
      CameraDive.ts
      SceneConvergence.ts
      PortalTravel.ts

  story/
    CompanyStoryWorld.tsx
    storyScenes.ts

  hub/
    ProviderPortalWorld.tsx
    PortalObject.tsx
    AstronautSubject.tsx

  history/
    HistoryWorld.tsx
    HistoryParticleTimeline.tsx
    HistoryArchivePanel.tsx

  network/
    NetworkExplorer.tsx
    NetworkMap.tsx
    NetworkLayers.tsx
    NetworkDrawer.tsx

  resources/
    ResourcePortalTransition.tsx
    ResourceWorkspace.tsx

  questions/
    ProviderKnowledgeExplorer.tsx

  agreement/
    AgreementPortalTransition.tsx
```

---

# 8. Non-negotiable acceptance tests

The implementation is not considered reference-quality merely because it has large type, gradients, or parallax.

A build pass must demonstrate:

1. one persistent render stage through the cinematic story;
2. continuous camera/scene motion tied to scroll;
3. pointer-reactive rendered objects;
4. a genuine spatial portal hub;
5. camera travel into portals;
6. a WebGL/spatial history timeline;
7. a real coordinate/layer-driven geographic explorer;
8. specialty transition into Resources;
9. accessibility equivalents for spatial controls;
10. mobile quality tiers;
11. reduced-motion authored fallbacks;
12. browser screenshots/video captures used for visual comparison before claiming completion.

## Sources examined

- Oryzo AI live experience and Lusion's Oryzo project page.
- Lusion Oryzo Behind-the-Scenes Parts 1–3.
- Lusion Zero Tech project page and live Zero Tech experience.
- Lusion current home/about experiences.
- Lusion official MIT-licensed WebGL-Scroll-Sync repository.
- makemepulse Nasdaq 50th Anniversary case study and archived live-project commentary.
- Protecting Blue Corridors live homepage/explorer, Ode case study and technical writeup, and public developer portfolio describing the production stack.
