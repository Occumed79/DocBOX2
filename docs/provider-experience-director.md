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
- Switch staged sequences between **Auto** and **Manual**.
- In Manual mode, pin exact internal states for History, Referral, Clinical, Work, and Values while continuing to scrub the surrounding scene.
- Collapse the panel when inspecting the composition at full size.

The scrubber works by moving the real page scroll position inside the selected scene. That means the same scroll-driven CSS variables, automatic stage changes, parallax, narrative thread, chapter morph layers, and image masks are exercised rather than replaced with a separate mock animation state.

## Persistent object morph

The middle of the experience now carries one case object across chapters instead of repeatedly introducing unrelated decoration. Inspect these transitions slowly in Director Mode:

- **Method:** three-axis job / medical / compatibility token.
- **Referral:** the token stretches into an authorization / case card.
- **Clinical:** the card resolves into a medical cross / instrument object.
- **Work:** the object becomes a role / job-demand badge.
- **Network:** the badge collapses into a connected provider node.
- **Values:** the node resolves into an Occu-Med standard / seal.
- **Partner:** the seal opens into the light **Your Facility** destination before the provider interface takes over.

Referral and Clinical also keep their artwork mounted as layered scenes so state changes reveal through masks rather than hard image replacement.

## Intended workflow

1. Open `/experience?director=1` on the branch deployment.
2. Jump to a chapter.
3. Choose **Manual** when you want to hold one internal state in place.
4. For a staged chapter, pin the exact state you want to inspect (for example Records, Dental, Public safety, or Integrity).
5. Drag through the scene slowly and inspect entrances, midpoint composition, object morphs, image masks, and exits.
6. Switch back to **Auto** to test the public scroll choreography.
7. Re-run the same chapter before reviewing the complete experience from the top.

## Provider workflow review

After the cinematic handoff, test the practical flow separately:

- specialty and capability selection;
- provider contact details;
- one or multiple physical locations;
- shared versus location-specific self-pay pricing;
- local draft autosave / restore;
- agreement readiness states;
- full review copy;
- **Print / Save review PDF** from the browser print dialog.

Final electronic submission and signature acceptance remain intentionally disabled until the next workflow layer is implemented.

Director Mode is a tuning tool, not part of the provider-facing product UI.
