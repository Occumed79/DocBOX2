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
- Switch **Internal Staging** between Auto and Manual.
- In Manual staging, directly select the internal state for History, Referral, Clinical, Work, and Values.
- Collapse the panel when inspecting the composition at full size.

The scrubber moves the real page scroll position inside the selected scene. That means the same scroll-driven CSS variables, parallax, persistent narrative thread, chapter morph layers, and other production choreography are exercised rather than replaced with a separate mock animation state.

When Internal Staging is set to **Manual**, the director panel temporarily overrides the normal scroll-driven stage selection. This makes it possible to hold, for example, `Records`, `Dental`, `Public safety`, or `Integrity` on screen while scrubbing the rest of the scene around it. Switching back to **Auto** returns the public experience to its normal choreography.

## Intended workflow

1. Open `/experience?director=1` on the branch deployment.
2. Jump to a chapter.
3. Drag through the scene slowly and inspect entrances, midpoint composition, and exits.
4. For chapters with multiple internal states, switch to Manual and pin the exact state you want to inspect.
5. Adjust the relevant scene CSS / scroll pacing.
6. Switch Internal Staging back to Auto and review the complete scene.
7. Re-run the full experience from the top before treating the choreography as finished.

Director Mode is a tuning tool, not part of the provider-facing product UI.
