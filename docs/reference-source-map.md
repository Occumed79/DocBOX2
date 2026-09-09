# Reference Source Map

This file records technical evidence discovered while inspecting the selected reference experiences. It separates directly published/official information from secondary reverse-engineering or award/portfolio evidence.

## Confidence labels

- **Official** — published by the studio/project itself or its official open-source repository.
- **Builder** — published by a developer/design partner who worked on the project.
- **Secondary** — independent technical/award/reverse-engineering material. Useful for implementation direction but not treated as authoritative source code.

---

# Oryzo AI — Lusion

## Official

- Live site: `https://oryzo.ai/`
- Lusion project page identifies services including WebGL, 3D design, animation, web design and web development.
- Lusion Behind-the-Scenes Part 2 documents the hybrid render pipeline.
- Lusion Behind-the-Scenes Part 3 documents UX/UI and interactive-animation tooling.
- Public Oryzo model repository: `https://github.com/lusionltd/ORYZO-1`

### Published render details

- WebGL real-time environment.
- Image sequences/video were tested and rejected because they did not provide the desired interaction.
- Full PBR was also tested but did not provide the desired production look.
- Gaussian splatting was used selectively for props and desk reflections.
- Lusion reports roughly 78k splats in its desktop production tests and roughly 45k on mobile.
- Other surfaces use texture-mapped simplified geometry.
- Texture density is biased toward the central camera area.
- Figma: UI/layout.
- Rive: interactive animation/motion prototypes.

### Public model assets

The ORYZO-1 repository exposes multiple OBJ model variants under `checkpoints/` and is MIT licensed.

The model is useful as evidence that Oryzo's visual production is a real 3D pipeline, not a CSS illustration system.

---

# Lusion studio

## Official

- Live site: `https://lusion.co/`
- Public studio copy explicitly describes 3D visual storytelling and interactive web experiences.
- Project listings repeatedly identify WebGL, 3D, animation and web development as core services.
- Official open-source reference: `https://github.com/lusionltd/WebGL-Scroll-Sync`

## Official open-source scroll synchronization mechanics

The MIT-licensed example contains:

- one `THREE.WebGLRenderer` attached to a canvas;
- a scene and camera;
- one plane geometry shared by DOM-mirrored image meshes;
- shader materials per image;
- shared uniforms for:
  - resolution;
  - scroll offset;
  - time;
  - scroll-reactive strength;
- DOM rectangle measurement through `getBoundingClientRect()`;
- `ResizeObserver` synchronization;
- requestAnimationFrame rendering;
- scroll-delta / velocity-derived animation strength;
- exponential decay of scroll strength;
- visibility culling for media outside the rendered viewport.

This is the architectural basis for DocBOX2's `immersive/runtime.ts` and `ImmersiveStage.tsx`, rewritten for React/Next rather than copied verbatim.

## Secondary current-site reverse engineering

A public June 2026 reconstruction/specification reports the current Lusion site as:

- Astro-generated DOM shell;
- Three.js r158;
- a continuously rendered WebGL canvas;
- custom GLSL shader materials;
- instanced meshes;
- EXR/HDR environment assets;
- PMREM-based image lighting;
- ACES filmic tone mapping;
- self-hosted typography;
- custom tween/camera choreography;
- WebAudio-driven sound UI;
- a full-screen transition overlay.

Reported runtime asset families include:

- astronaut helmet geometry;
- visor glass geometry;
- gloves/shoes geometry;
- astronaut wearpack geometry;
- astronaut idle/entry/exit animation buffers;
- broken-glass geometry and animation;
- tunnel blocks/walls;
- line/diamond/earth-card elements;
- cross/shard end-state geometry.

Reported scene progression:

1. preloader;
2. camera approach;
3. astronaut entry;
4. astronaut idle / floating debris;
5. astronaut exit on scroll;
6. long camera travel through a geometry tunnel;
7. closing black-space environment.

Reported current-site DOM bundle naming observed by that source:

- CSS: `/_astro/about.CNa9RfUh.css`
- JS: `/_astro/hoisted.CJiXW_YI.js`

These bundle names are hashes and can change; they are not dependencies for DocBOX2.

---

# Zero Tech — Lusion

## Official

- Live client experience: `https://client-zero-tech.lusion.co/`
- Lusion project page: `https://lusion.co/projects/zero_tech/`
- Lusion explicitly describes realtime 3D merged with scroll navigation.
- Service listing includes WebGL and 3D design.

## Observed information architecture

- hero / identity state;
- intro year marker;
- Problem/Solution toggle;
- kinetic typography transition;
- system/world introduction;
- multiple native-app/capability chapters;
- detailed feature states;
- identity/integration layer;
- final full-screen CTA.

## Secondary technology evidence

Award/technology listings identify the original build with:

- Three.js;
- TypeScript;
- Angular;
- PWA behavior;
- Netlify deployment;
- scroll animation;
- unusual/spatial navigation.

A developer portfolio from a Lusion creative developer also identifies Zero Tech as WebGL-based.

DocBOX2 should not inherit Angular or Netlify simply because Zero used them. The relevant transferable pieces are the realtime render world, 3D scene state and scroll navigation grammar.

---

# Nasdaq 50th Anniversary — makemepulse / Invisible North

## Official / studio

- Case study: `https://www.makemepulse.com/case-study/nasdaq-50th-anniversary/`
- Live/archived experience: `https://www.nasdaq50.com/`
- makemepulse explicitly describes an interactive WebGL timeline and mobile-first virtual exhibition.
- Content combines key dates, employee recollections, archive/museum material and news history.
- Users can discover/search different content types rather than only scrolling linearly.

## Secondary visual/technical commentary

Contemporary WebGL commentary describes:

- an opening `50` built from particles;
- continuous subtle particle movement;
- slight pointer-reactive luminosity;
- gradient environment;
- morphing particle structures;
- deliberate depth/blur treatment around simple point primitives.

## DocBOX2 transfer

The transferable system is:

- GPU/particle chronology;
- prominent year anchors;
- supporting archive objects around dates;
- spatial navigation among eras;
- content search/discovery;
- expanded milestone states;
- mobile chronology fallback.

---

# Protecting Blue Corridors

## Live application

- Home: `https://bluecorridors.org/`
- Explorer: `https://bluecorridors.org/explore/species`
- Threats: `https://bluecorridors.org/explore/threats`
- Protections: `https://bluecorridors.org/explore/protections`
- Conservation: `https://bluecorridors.org/explore/conservation`

## Builder/developer evidence

A developer portfolio for work completed at Huncwot identifies the application as:

- Next.js;
- Payload CMS;
- GSAP;
- Motion;
- Mapbox;
- Deck.gl.

Ode's project case study and technical writeup describe the product architecture and visualization rules.

### Visualization stack/order

- detailed species range raster at the bottom;
- migration-corridor polygons above ranges;
- satellite track lines above corridors;
- consistent species-specific color families across all three layer types;
- map interactions and multiple visualization modes;
- scientific illustrations in profile/navigation UI;
- tooltip attribution for track-level data;
- map/data sharing and request workflows.

### Explorer control architecture

Primary sections:

- Whale Species;
- Threats & Risks;
- Priorities & Protections;
- Conservation & Solutions.

Species controls include:

- Tracks;
- Migration Corridors;
- Range Maps;
- independent species toggles;
- species metadata/profile expansion.

Threat layer families include:

- climate;
- fisheries;
- shipping;
- pollution;
- offshore construction;
- whaling;
- cumulative impact.

Protection layer families include priority and protected-area overlays.

### Data/product architecture

The builder describes a scalable backend designed so new species, layers and contributors can be added without rebuilding the product. This is directly relevant to keeping the Occu-Med network directory data-driven rather than hard-coded.

---

# What is intentionally NOT copied

The proprietary production bundles, private 3D assets, fonts, shaders, imagery and source code of the reference sites are not being pasted into DocBOX2.

Instead:

- public/official open-source material is used within its license;
- public visual/technical behavior is documented;
- DocBOX2 receives clean-room React/TypeScript/WebGL implementations of the mechanics;
- Occu-Med's own photos, documents and data remain the content layer.
