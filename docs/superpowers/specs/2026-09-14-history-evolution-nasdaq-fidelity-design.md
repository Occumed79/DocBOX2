# History & Evolution — Nasdaq50 Fidelity Design

## Scope

Rebuild the existing `/experience/history` portal so it reproduces the recovered interaction model, spatial behavior, story hierarchy, and transition logic of Nasdaq50 while using only Occu-Med history, branding, and source-supported content. The outer `/experience` cinematic entrance and `ZeroTechPortalHub` remain unchanged. The Nasdaq-derived treatment is confined to the History & Evolution portal.

## Core scene model

The History experience is a three-state cinematic system:

1. **History intro** — a short portal-local entrance.
2. **Timeline world** — a WebGL mandoline/ribbon world navigated by wheel, drag, keyboard, filter and node focus.
3. **Story world** — split into two different destinations:
   - **Milestone:** editorial milestone experience; no particle bubble.
   - **Supporting story:** particle-bubble experience followed by a scroll-driven white editorial panel.

Route/scene transitions use a 2.8 second eased interpolation. The WebGL scene should morph rather than hard-cut between states.

## Timeline world

### Mandoline

The timeline spine uses 32 strands, not duplicated sine waves. Recovered Nasdaq constants should inform the implementation:

- 32 strands
- line length/domain basis: 24
- strand spacing: 5.12
- line thickness: 0.03
- UV scale: 15
- deformation/noise amount: 2
- X scale: 5.3
- Y scale: 3.46
- multiple harmonic sine/cosine terms with distinct strengths, phases and temporal multipliers

The visual must support narrow sections, fan-outs, pinches/crossings, valleys, crests and twists. Strand brightness/depth differs by lane, with a brighter core path.

### Camera and input

The timeline behaves like camera travel through a world, not webpage scrolling.

- Wheel input: `target += clamp(0.01 * deltaY, -5, 5)` then clamp to timeline bounds.
- Camera/scroll values ease toward targets rather than snap.
- Pointer movement subtly affects world/camera response.
- Dragging can scrub the timeline.
- Keyboard left/right, page, home/end controls remain available.

### Depth systems

Bokeh and fireflies are first-class parts of the world:

- bokeh repeats in world sections near the camera and sits farther in depth;
- fireflies are tied to the same deformation field as the mandoline rather than drifting as an unrelated overlay;
- the background color field changes spatially through blue/violet/cyan/teal/green families.

## Story placement and node hierarchy

Stories are attached to the mandoline and positioned in world space. Nearby nodes are projected into screen-space overlays; distant nodes are culled.

Three functional node classes are supported:

- **Milestone** — large orbital marker and year/title treatment.
- **Major supporting story** — prominent particle hotspot.
- **Minor supporting story** — smaller particle hotspot.

Milestone overlay behavior should follow the recovered Nasdaq structure: 104px circular core, four imperfect rotating ellipses with independent dimensions/durations, vertical stem, top point, year/title/tag reveal, and focused-state animation.

No persistent dashboard card is shown over the timeline.

## Filters

Desktop filter control sits in the upper-right region and opens as a vertically scaling translucent white panel with staggered item reveals. Selecting a filter both changes node visibility and moves the camera to the nearest matching story. Occu-Med categories must be source-backed.

## Supporting-story bubble world

Supporting stories use a dedicated bubble scene/camera. Milestones never render the bubble.

Transition sequence:

1. focus selected timeline node;
2. begin 2.8s scene transition;
3. timeline remains briefly visible, then clears;
4. particle sphere enters oversized/offset;
5. sphere settles;
6. title and metadata appear after sphere establishment;
7. related-memory satellites appear;
8. top navigation changes to `BACK TO EXPERIENCE`;
9. `SCROLL TO READ CONTENT` appears;
10. on scroll, a white editorial panel rises while the bubble/header fade gradually.

The central bubble must feel volumetric: tens of thousands of particles, uneven density, rim emphasis, upper highlight, depth, subtle deformation and slow motion. Related-memory bubbles use smaller particle spheres and connected animated paths.

## Milestone story world

Milestones use a separate editorial treatment with large year/title typography, media, body copy, prev/next navigation, orbital controls and related memories. Desktop scale should preserve Nasdaq's oversized editorial composition. No bubble is rendered for milestone stories.

## Occu-Med content

The dated backbone is restricted to source-supported chronology, currently centered on:

- 1979 founding / critical discovery
- 2000 incorporation
- 2003 EXAMQA training/growth point
- 2006 international expansion
- 2007 federal registration
- ~2017 growth/recognition only where exact wording is source-supported
- 2018 leadership transition
- 2021 leadership continuity
- present-day company

Supporting stories can include critical discovery, traditional exam limitations, Occu-Med's solution, EXAMQA, referral-to-outcome workflow, clinical services, documentation/QA, standards, provider network and values.

Unsupported metrics, dates or claims must be removed rather than embellished.

## Components and boundaries

Keep `/experience`, `ProviderJourneyReplica`, story entrance assets, and `ZeroTechPortalHub` intact.

Primary History implementation should be decomposed into focused units rather than one monolith:

- `HistoryExperience` — route/state orchestration and accessibility fallbacks
- `HistoryWorld` — renderer lifecycle and scene composition
- mandoline deformation helper/material
- timeline particles/bokeh/fireflies
- hotspot projection/interaction layer
- filter UI
- supporting-story bubble layer
- milestone story layer
- supporting-story editorial layer
- shared related-memory navigation
- source-backed history data module

## Responsive behavior

Desktop fidelity is the primary target. Mobile retains the same information architecture but simplifies camera interaction and repositions filters/story controls according to the recovered responsive CSS. It must remain usable without pointer hover.

## Testing

The implementation must cover:

- deterministic math/unit tests for deformation helpers and progress clamping;
- story-type routing: milestone never shows bubble, supporting story does;
- filter selection updates visible nodes and target position;
- wheel input uses recovered clamping behavior;
- transitions use 2.8s timing;
- reduced-motion/accessibility fallback still exposes the full history;
- production build and typecheck/lint pass;
- manual visual verification at representative timeline positions and both story types.

## Explicit removals from the current prototype

Remove or replace:

- dashboard framing;
- persistent left-side timeline story card;
- fake network metrics/history;
- generic duplicated wave ribbon;
- uniform dots;
- one shared story template for milestones and minor stories;
- flat CSS-only bubble;
- hard scene cuts;
- oversized explanatory chrome.

## Success criteria

A user entering Portal 01 should experience Occu-Med history as a cinematic spatial timeline whose motion, node behavior, filtering, milestone treatment, supporting-story bubble treatment and scroll transitions closely match the recovered Nasdaq50 mechanics, without changing the existing outer DOCBOX2 portal architecture or inventing Occu-Med facts.
