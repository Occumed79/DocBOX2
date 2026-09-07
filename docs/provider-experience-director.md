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

The scrubber works by moving the real page scroll position inside the selected scene. That means the same scroll-driven CSS variables, automatic stage changes, parallax, narrative thread, chapter morph layers, image masks, and WebGL fields are exercised rather than replaced with a separate mock animation state.

## Persistent object morph

The middle of the experience carries one case object across chapters instead of repeatedly introducing unrelated decoration. Inspect these transitions slowly in Director Mode:

- **Method:** three-axis job / medical / compatibility token.
- **Referral:** the token stretches into an authorization / case card.
- **Clinical:** the card resolves into a medical cross / instrument object.
- **Work:** the object becomes a role / job-demand badge.
- **Network:** the badge collapses into a connected provider node.
- **Values:** the node resolves into an Occu-Med standard / seal.
- **Partner:** the seal opens into the light **Your Facility** destination before the provider interface takes over.

The CSS narrative object is now reinforced by a raw WebGL point field through **Method → Referral → Clinical → Work**. Its particle geometry should visibly morph from a three-axis diamond into a horizontal authorization card, then a medical cross, then a vertical role badge. It should react subtly to pointer position and disappear before the static provider workflow.

The **Network** chapter has a separate raw WebGL spherical provider field with connected nodes and routes. It should emerge only around the Global Network scene, rotate with scroll/pointer input, and then yield cleanly to Values/Partner. Both WebGL layers are disabled under `prefers-reduced-motion: reduce`.

Referral and Clinical also keep their artwork mounted as layered scenes so state changes reveal through masks rather than hard image replacement.

## Intended workflow

1. Open `/experience?director=1` on the branch deployment.
2. Jump to a chapter.
3. Choose **Manual** when you want to hold one internal state in place.
4. For a staged chapter, pin the exact state you want to inspect (for example Records, Dental, Public safety, or Integrity).
5. Drag through the scene slowly and inspect entrances, midpoint composition, WebGL geometry morphs, narrative-object morphs, image masks, and exits.
6. Switch back to **Auto** to test the public scroll choreography.
7. Re-run the same chapter before reviewing the complete experience from the top.

## Provider workflow review

After the cinematic handoff, test the practical flow separately:

- specialty and capability selection;
- specialty-selected services flowing into the embedded Occu-Med Forms document;
- provider contact and physical-address fields;
- self-pay fee entry and provider-added services;
- local draft autosave / restore;
- typed and drawn pricing-response signatures;
- electronic-record consent;
- exact A4 Fee Proposal preview and PDF copy;
- public **Submit pricing proposal** handoff;
- returned `OM-PR-...` reference and downloaded provider copy;
- the created PDF appearing in DocBOX under **Provider Onboarding Submissions** with searchable provider/specialty/service metadata;
- Network Management queue filters for New / In review / Ready for Forms / Declined;
- structured inspector details and exact submitted-PDF link;
- status changes persisting both metadata and `status-*` tags;
- **Ready for Forms** exposing the authenticated Service Agreement composer handoff;
- provider FAQ interactions and mobile wrapping.

Open onboarding is intentionally a **Provider Fee Proposal / review submission**, not an unauthenticated final Provider Service Agreement. If Network Management accepts the pricing response, the final agreement is issued through the existing secure Occu-Med Forms invitation workflow.

Test the authoritative invitation path separately at `/provider/[token]`. That route should go directly to the invited document, preserve the Forms backend audit/finalization lifecycle, and never replay the cinematic onboarding experience.

## Final QA pass

For each release candidate, run the following checks before moving the PR out of draft:

1. **Desktop narrative:** scroll from the landing-page handoff through Partner without using chapter navigation. No transition should feel like a separate page load or a hard visual reset.
2. **Director Mode:** manually inspect the start, midpoint, and exit of Method, Referral, Clinical, Network, and Values. Confirm the persistent case object remains visually recognizable while changing form.
3. **WebGL case morph:** verify diamond → authorization card → medical cross → role badge transitions remain synchronized with Method/Referral/Clinical/Work and never cover critical copy.
4. **WebGL network:** verify the connected spherical field fades in around Network, remains spatially coherent while scrolling, and disappears before the provider interface.
5. **Manual staging:** hold at least one non-default state in History, Referral, Clinical, Work, and Values and confirm automatic scroll staging does not fight the pinned state.
6. **Reduced motion:** verify both WebGL canvases disappear and the page remains understandable with `prefers-reduced-motion: reduce`; content and provider workflow must remain usable.
7. **Mobile:** verify specialty selection, capability rows, provider fields, rate rows, exact preview behavior, submission handoff, queue controls, and FAQ do not overflow the viewport.
8. **Draft recovery:** enter provider/contact/rate data, reload, and confirm the local draft restores. Then clear the draft and confirm the reset persists.
9. **Open pricing submission:** complete a Fee Proposal, sign/consent, submit it, confirm an `OM-PR-...` reference is returned, and confirm the exact PDF is stored inside **Provider Onboarding Submissions** in the existing DocBOX vault.
10. **Review queue:** move a real pricing response through New → In review → Ready for Forms, verify counts/tags update, open the submitted PDF, and confirm the secure Forms composer link still requires an authorized Occu-Med session.
11. **Security boundary:** confirm public onboarding cannot create an authoritative Forms invitation or execute the final Provider Service Agreement. Public submissions must stop at Network Management review.
12. **Secure invitation:** open a real `/provider/[token]` invitation and verify load, finalize, decline, document download, certificate download, and Needs Review behavior all remain backed by the existing Forms service.
13. **Provider FAQ:** step through all FAQ states and confirm the provider-role wording stays aligned with the actual referral workflow.
14. **No customer names:** scan all public-facing history copy before release. Source records can identify customers internally; the experience must not.
15. **Historical wording:** preserve the distinction between proprietary methodology and patent protection, and do not turn contested archival records into testimonials.
16. **CI:** require install, TypeScript, production build, and route smoke tests to pass on the exact release-candidate head.

Director Mode is a tuning tool, not part of the provider-facing product UI.
