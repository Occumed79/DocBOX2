# Occu-Med Forms integration

The provider pricing/agreement portion of the DocBOX2 provider experience now uses the existing **Occu-Med Forms** document model and PDF workflow instead of maintaining a separate pricing builder.

Source repository: `Occumed79/occu-med-forms`

Source revision used for this integration: `817f5db747865540c6dc5377917f43285c7dc16d` (`main` when the integration was ported).

Source behaviors adopted into the provider experience:

- Provider Fee Proposal and Provider Service Agreement document modes.
- Provider/facility contact information and address capture.
- Editable service/fee rows with Occu-Med vs provider-added provenance.
- Net 30 default billing terms.
- Exact A4 document preview.
- Typed or drawn provider signature.
- Explicit electronic-record consent.
- Exact-preview PDF generation using the same html2canvas + jsPDF approach as Occu-Med Forms.
- Browser-local draft persistence for providers who enter through the open onboarding experience without a pre-created invitation.

The old standalone `PricingAgreementBuilder` implementation has been retired; its component name remains only as a compatibility wrapper so the larger provider experience does not need to know which agreement engine renders below it.

## Authoritative invitation mode

DocBOX2 now also understands the existing Occu-Med Forms provider invitation lifecycle instead of limiting the integration to a local PDF copy.

- `/provider/[token]` routes an existing Forms invitation into the integrated provider experience.
- The experience detects the invitation token and switches the agreement area from the self-onboarding draft into an **authoritative Forms invitation**.
- Same-origin Next.js proxy routes forward provider-safe invitation actions to the existing Forms backend, avoiding browser CORS coupling while keeping the Forms backend authoritative.
- Supported provider operations are:
  - load/review the invitation;
  - edit available services and returned fees while the invitation is open;
  - complete provider contact/address fields;
  - type or draw a signature;
  - provide electronic-record consent;
  - generate the exact on-screen A4 PDF;
  - finalize the signed document through the Forms backend;
  - enter `returned / Needs review` when service or fee terms changed;
  - complete immediately when no review is required;
  - decline an invitation with an optional reason;
  - download the authoritative completed/returned document and completion certificate.

The server bridge uses `OCCUMED_FORMS_API_URL` when supplied and otherwise defaults to the current production Forms backend.

## Backend boundary

The production Occu-Med Forms backend remains the authoritative implementation for provider invitation tokens, signed-document persistence, completion certificates, evidence hashes, audit events, returned-term review, approval, decline handling, retention, and admin roles.

Current Render backend: `https://occu-med-forms.onrender.com`

This means there are now two deliberate entry modes rather than two competing agreement systems:

1. **Open provider onboarding:** specialty/capability selection flows into the Forms document engine, with local draft persistence and exact PDF generation.
2. **Existing secure Forms invitation:** `/provider/[token]` uses the authoritative Forms token/audit lifecycle and returns the signed document to the existing backend.

Creating invitations remains an authenticated Occu-Med/admin action in the Forms system. DocBOX2 does not expose a second unauthenticated invitation-creation endpoint.

Do not re-create a second signing/audit backend in DocBOX2 unless the Forms backend is intentionally retired and its lifecycle is migrated wholesale.
