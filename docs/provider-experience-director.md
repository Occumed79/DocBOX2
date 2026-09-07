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
- **Print / Save review PDF** from the browser print dialog;
- provider FAQ interactions and mobile wrapping.

Final electronic submission and signature acceptance remain intentionally disabled until the next workflow layer is implemented.

## Final QA pass

For each release candidate, run the following checks before moving the PR out of draft:

1. **Desktop narrative:** scroll from the landing-page handoff through Partner without using chapter navigation. No transition should feel like a separate page load or a hard visual reset.
2. **Director Mode:** manually inspect the start, midpoint, and exit of Method, Referral, Clinical, Network, and Values. Confirm the persistent case object remains visually recognizable while changing form.
3. **Manual staging:** hold at least one non-default state in History, Referral, Clinical, Work, and Values and confirm automatic scroll staging does not fight the pinned state.
4. **Reduced motion:** verify the page remains understandable with `prefers-reduced-motion: reduce`; cinematic decoration may disappear, but content and provider workflow must remain usable.
5. **Mobile:** verify specialty selection, capability rows, address inputs, rate tables, agreement review, and FAQ do not overflow the viewport.
6. **Draft recovery:** enter provider/contact/location/rate data, reload, and confirm the local draft restores. Then clear the draft and confirm the reset persists.
7. **Agreement review:** test both shared pricing and location-specific pricing with multiple facilities. Print the review copy and verify addresses, contacts, terms, and every selected service rate are present.
8. **No customer names:** scan all public-facing history copy before release. Source records can identify customers internally; the experience must not.
9. **Historical wording:** preserve the distinction between proprietary methodology and patent protection, and do not turn contested archival records into testimonials.
10. **CI:** require install, TypeScript, and production build to pass on the exact release-candidate head.

Director Mode is a tuning tool, not part of the provider-facing product UI.
