# Provider Experience — Director Mode

Director Mode is a development-only choreography control surface for `/experience`.

## Open it

Append `?director=1` to the experience URL:

`/experience?director=1`

Nothing is rendered for ordinary visitors unless that query parameter is present.

## What it controls

- Jump directly to any cinematic chapter.
- Scrub the currently active chapter from 0–100% by moving the range control.
- See which chapter the runtime currently considers active.
- Collapse the panel when inspecting the composition at full size.

The scrubber works by moving the real page scroll position inside the selected scene. That means the same scroll-driven CSS variables, automatic stage changes, parallax, narrative thread, and chapter morph layers are exercised rather than replaced with a separate mock animation state.

## Intended workflow

1. Open `/experience?director=1` on the branch deployment.
2. Jump to a chapter.
3. Drag through the scene slowly and inspect entrances, midpoint composition, and exits.
4. Adjust the relevant scene CSS / scroll pacing.
5. Re-run the same chapter before reviewing the complete experience from the top.

Director Mode is a tuning tool, not part of the provider-facing product UI.
