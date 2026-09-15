# History & Evolution Nasdaq Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/experience/history` as a source-grounded Occu-Med history experience using the recovered Nasdaq50 mandoline, camera, hotspot, filter, supporting-story bubble, milestone, and scroll-transition mechanics.

**Architecture:** Keep the existing `/experience` entrance and `ZeroTechPortalHub` untouched. Split History into source data, deterministic timeline math, WebGL rendering, timeline DOM projection/UI, and story presentation so each subsystem can be tested independently while `HistoryExperience` remains the orchestration shell.

**Tech Stack:** Next.js 15.5.19, React 18, TypeScript 5, Three.js 0.186, Playwright 1.55.

**Spec:** `docs/superpowers/specs/2026-09-14-history-evolution-nasdaq-fidelity-design.md`

## Global Constraints

- Nasdaq-derived mechanics are confined to `/experience/history`.
- `/experience`, `ProviderJourneyReplica`, and `ZeroTechPortalHub` remain intact.
- Milestones never render the particle bubble; supporting stories do.
- Scene transitions use 2800ms.
- Wheel delta is based on `clamp(0.01 * deltaY, -5, 5)` before timeline-bound clamping.
- Timeline uses 32 strands with non-uniform harmonic deformation.
- Unsupported Occu-Med metrics, dates and claims are removed rather than embellished.
- Desktop fidelity is primary; mobile remains usable without hover.

---

### Task 1: Lock behavior with failing History tests and source-backed data

**Files:**
- Modify: `tests/e2e/provider-experience.spec.ts`
- Create: `components/experience/history/historyData.ts`
- Create: `components/experience/history/historyMath.ts`
- Modify: `components/experience/history/HistoryExperience.tsx`

**Interfaces:**
- Produces `HistoryItem`, `HistoryCategory`, `HISTORY_ITEMS`, `HISTORY_CATEGORIES` from `historyData.ts`.
- Produces `clampHistoryProgress`, `applyWheelDelta`, `nearestHistoryItem`, `historyWorldX` from `historyMath.ts`.

- [ ] **Step 1: Write failing Playwright expectations for the new History contract**

Replace the old History test's search/modal assertions with behavior that must exist after the rebuild:

```ts
test('history uses the Nasdaq-style spatial timeline and distinct story modes', async ({ page }) => {
  await page.goto('/experience/history');
  await expect(page.getByRole('navigation', { name: 'Occu-Med history timeline' })).toBeVisible();
  await expect(page.locator('[data-history-world]')).toBeVisible();
  await expect(page.locator('[data-history-mandoline]')).toHaveAttribute('data-lines', '32');
  await expect(page.getByRole('button', { name: /1979.*Occu-Med is founded/i })).toBeVisible();
  await expect(page.getByText('15,000+ facilities')).toHaveCount(0);
  await expect(page.getByText('one million employees')).toHaveCount(0);

  await page.getByRole('button', { name: /The Critical Discovery/i }).click();
  await expect(page.locator('[data-story-mode="bubble"]')).toBeVisible();
  await expect(page.getByText('SCROLL TO READ CONTENT')).toBeVisible();
  await page.getByRole('button', { name: 'BACK TO EXPERIENCE' }).click();

  await page.getByRole('button', { name: /1979.*Occu-Med is founded/i }).click();
  await expect(page.locator('[data-story-mode="milestone"]')).toBeVisible();
  await expect(page.locator('[data-story-mode="bubble"]')).toHaveCount(0);
});
```

Add a filter behavior test:

```ts
test('history filter changes visible nodes and re-targets the timeline', async ({ page }) => {
  await page.goto('/experience/history');
  await page.getByRole('button', { name: /FILTER/i }).click();
  await page.getByRole('button', { name: 'FOUNDATION' }).click();
  await expect(page.locator('[data-history-node][data-category="FOUNDATION"]')).not.toHaveCount(0);
  await expect(page.locator('[data-history-node]:not([data-category="FOUNDATION"])')).toHaveCount(0);
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test:e2e -- tests/e2e/provider-experience.spec.ts -g "history"
```

Expected: FAIL because `data-history-world`, `data-history-mandoline`, new story modes and filter behavior are not implemented.

- [ ] **Step 3: Extract source-backed data and remove unsupported metrics**

Create `historyData.ts` and move the current inline item type/data there. Remove unsupported claims such as `15,000+ facilities`, `50+ countries`, `one million employees annually`, and `500 public-safety clients` unless a Story source explicitly supports them. Preserve the supported chronology and relationships.

- [ ] **Step 4: Add deterministic timeline math**

Create:

```ts
export const HISTORY_WORLD_LENGTH = 142;
export const HISTORY_LINE_COUNT = 32;

export function clampHistoryProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function applyWheelDelta(target: number, deltaY: number, max = 1) {
  const delta = Math.max(-5, Math.min(5, deltaY * 0.01));
  return Math.max(0, Math.min(max, target + delta / HISTORY_WORLD_LENGTH));
}

export function historyWorldX(progress: number) {
  return clampHistoryProgress(progress) * HISTORY_WORLD_LENGTH;
}
```

- [ ] **Step 5: Run typecheck and History tests**

```bash
npm run typecheck
npm run test:e2e -- tests/e2e/provider-experience.spec.ts -g "history"
```

Expected: tests still fail only on UI/world features that later tasks implement; typecheck passes.

- [ ] **Step 6: Commit**

```bash
git add components/experience/history tests/e2e/provider-experience.spec.ts
git commit -m "test(history): lock Nasdaq fidelity behavior"
```

---

### Task 2: Rebuild the mandoline, depth field, and camera travel

**Files:**
- Create: `components/experience/immersive/historyMandoline.ts`
- Modify: `components/experience/immersive/HistoryWorld.tsx`
- Modify: `components/experience/history/HistoryExperience.tsx`

**Interfaces:**
- `sampleMandoline(x, lane, time): { y: number; z: number }`
- `HistoryWorld` consumes normalized `progress`, `transition`, `mode`, `storyScroll`, `seed` and renders timeline/bubble scenes.

- [ ] **Step 1: Add the failing DOM contract for a 32-line WebGL world**

Ensure the Playwright test expects:

```ts
await expect(page.locator('[data-history-mandoline]')).toHaveAttribute('data-lines', '32');
```

- [ ] **Step 2: Run History test and confirm RED**

- [ ] **Step 3: Implement non-uniform harmonic mandoline sampling**

Use 32 lanes, lane-dependent spread and depth, multiple sine/cosine harmonics, and localized pinch/fan/twist envelopes so cross-sections change along X. Central lanes receive stronger brightness but are not separate geometry.

- [ ] **Step 4: Bring depth systems toward recovered counts/behavior**

Use repeating or camera-local bokeh fields, substantially denser fireflies attached to `sampleMandoline`, and a lower-density far dust layer. Keep additive blending and no depth-write where appropriate.

- [ ] **Step 5: Correct camera inertia**

Make world travel derive from `historyWorldX(progress)` and ease the rendered camera toward target with separate tracking/look-ahead smoothing. Preserve subtle Y/Z response instead of sinusoidal bobbing that dominates the shot.

- [ ] **Step 6: Run typecheck and History test**

```bash
npm run typecheck
npm run test:e2e -- tests/e2e/provider-experience.spec.ts -g "history uses"
```

Expected: mandoline contract passes; story-mode assertions may still fail.

- [ ] **Step 7: Commit**

```bash
git add components/experience/immersive components/experience/history/HistoryExperience.tsx
git commit -m "feat(history): rebuild mandoline world and camera"
```

---

### Task 3: Rebuild projected hotspots and Nasdaq-style filter behavior

**Files:**
- Create: `components/experience/history/HistoryTimelineOverlay.tsx`
- Create: `components/experience/history/HistoryFilter.tsx`
- Modify: `components/experience/history/HistoryExperience.tsx`
- Modify: `components/experience/history/HistoryExperience.module.css`

**Interfaces:**
- `HistoryTimelineOverlay` receives `items`, `progress`, `filter`, `hoveredId`, `onHover`, `onFocus`, `onOpen`.
- `HistoryFilter` receives current category and `onSelect`.

- [ ] **Step 1: Keep filter test RED**

Run the filter test from Task 1 and verify it still fails because unrelated categories remain rendered.

- [ ] **Step 2: Implement screen-space timeline projection**

Only render nodes inside a camera-near window. Position DOM hotspots from story world X plus lane-derived Y/depth rather than hard-coded page coordinates.

- [ ] **Step 3: Implement milestone orbit geometry**

Use the recovered dimensions/durations:

```text
core: 104x104
ellipse 1: 120x110 / 10s
ellipse 2: 124x106 / 9s reverse
ellipse 3: 108x122 / 8s reverse
ellipse 4: 140x120 / 12s reverse
```

Add vertical stem, top point, year/title/tag staggered focus reveal and focused-state scaling.

- [ ] **Step 4: Implement filter panel mechanics**

Desktop panel target: top 40px, right 123px, 24rem width. Open with a white/translucent `scaleY` background and stagger option reveals. On selection, set category and move target progress to the nearest matching item.

- [ ] **Step 5: Remove persistent timeline story card/search dashboard framing**

Timeline state should contain only sparse chrome, projected nodes, filter, sound, progress/navigation cue and accessibility entry.

- [ ] **Step 6: Run History tests**

Expected: timeline/filter assertions pass; story-mode assertions remain for Task 4.

- [ ] **Step 7: Commit**

```bash
git add components/experience/history
git commit -m "feat(history): rebuild hotspots and filters"
```

---

### Task 4: Implement distinct bubble and milestone story worlds

**Files:**
- Create: `components/experience/history/HistoryBubbleStory.tsx`
- Create: `components/experience/history/HistoryMilestoneStory.tsx`
- Create: `components/experience/history/HistoryRelatedMemories.tsx`
- Modify: `components/experience/immersive/HistoryWorld.tsx`
- Modify: `components/experience/history/HistoryExperience.tsx`
- Modify: `components/experience/history/HistoryExperience.module.css`

**Interfaces:**
- Bubble stories render `data-story-mode="bubble"`.
- Milestones render `data-story-mode="milestone"`.
- Both receive `item`, related items, back/open handlers; bubble receives story-scroll progress.

- [ ] **Step 1: Run distinct-story-mode test and confirm RED**

- [ ] **Step 2: Implement bubble scene gating**

Only render the bubble scene when `mode === 'story'`. Keep milestone bubble alpha at zero for the full transition.

- [ ] **Step 3: Rebuild particle bubble motion**

Use a dense central particle sphere, rim-weighted additive shader, uneven point sizes/density, slow deformation, top highlight and satellite spheres. The 2.8s transition should enter oversized/offset, settle, then reveal copy/satellites.

- [ ] **Step 4: Implement supporting-story DOM sequence**

Render title/metadata after transition establishment, `BACK TO EXPERIENCE`, `SCROLL TO READ CONTENT`, related memories, animated connector paths and the white editorial panel. Fade WebGL/header as story scroll increases.

- [ ] **Step 5: Implement separate milestone editorial treatment**

Use large year/title, optional source media, body copy, prev/next milestone controls and related memories. Do not render the bubble component or bubble data attribute.

- [ ] **Step 6: Run History tests and typecheck**

Expected: all History behavior tests pass.

- [ ] **Step 7: Commit**

```bash
git add components/experience/history components/experience/immersive/HistoryWorld.tsx
git commit -m "feat(history): split milestone and bubble story worlds"
```

---

### Task 5: Responsive, reduced-motion, accessibility and regression hardening

**Files:**
- Modify: `components/experience/history/HistoryExperience.module.css`
- Modify: `components/experience/history/HistoryExperience.tsx`
- Modify: `tests/e2e/provider-experience.spec.ts`

**Interfaces:**
- Accessibility view continues to expose the full source-backed chronology without WebGL dependence.

- [ ] **Step 1: Add a failing mobile/reduced-motion History test**

```ts
test('history stays navigable on mobile without hover', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/experience/history');
  await expect(page.getByRole('navigation', { name: 'Occu-Med history timeline' })).toBeVisible();
  await page.getByRole('button', { name: /The Critical Discovery/i }).click();
  await expect(page.locator('[data-story-mode="bubble"]')).toBeVisible();
});
```

- [ ] **Step 2: Run and verify RED**

- [ ] **Step 3: Implement mobile controls and filter placement**

Ensure node buttons remain tappable, filter relocates to a lower centered treatment, story content does not require hover, and no horizontal overflow is introduced.

- [ ] **Step 4: Respect reduced motion**

When `prefers-reduced-motion: reduce` is active, shorten/disable continuous decorative rotation/deformation while keeping navigation and story switching fully functional.

- [ ] **Step 5: Run full provider experience suite**

```bash
npm run typecheck
npm run test:e2e -- tests/e2e/provider-experience.spec.ts
npm run build
```

Expected: all pass with no page errors and no route overflow regression.

- [ ] **Step 6: Commit**

```bash
git add components/experience/history tests/e2e/provider-experience.spec.ts
git commit -m "fix(history): harden responsive and accessible behavior"
```

---

### Task 6: Visual capture and final branch verification

**Files:**
- No production file change unless verification finds a concrete defect.

- [ ] **Step 1: Capture representative timeline states**

Capture at least early timeline, mid-timeline, late timeline, a supporting bubble story, and a milestone story at desktop width.

- [ ] **Step 2: Compare against recovered Nasdaq evidence**

Check spatial emptiness, ribbon cross-section variation, multiple visible milestone labels, ring geometry, bubble settle sequence, related-memory satellites and editorial panel rise.

- [ ] **Step 3: Run final verification**

```bash
npm run typecheck
npm run build
npm run test:e2e -- tests/e2e/provider-experience.spec.ts
```

- [ ] **Step 4: Compare branch against main and review only History-scoped changes**

Ensure the outer cinematic entrance and other four portals are unchanged except for the already-approved `History & Evolution` portal label.
