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

## Open provider onboarding mode

The public onboarding path is deliberately a **Provider Fee Proposal** workflow rather than an unauthenticated Provider Service Agreement.

A provider can:

- select its specialty/capabilities earlier in the onboarding experience;
- review the resulting service list in the embedded Forms document engine;
- remove services it does not provide;
- add relevant services;
- enter proposed self-pay fees and billing terms;
- complete provider/facility/contact/address information;
- sign the pricing response and provide electronic-record consent;
- download the exact A4 pricing-proposal PDF; and
- submit that exact PDF to Occu-Med for Network Management review.

Public pricing submissions do **not** create an authoritative Forms invitation or bypass Forms admin authentication. Instead, `POST /api/provider-onboarding/submit` validates the pricing response, stores the exact submitted PDF through DocBOX2's existing storage layer, and creates a searchable file inside the **Provider Onboarding Submissions** folder in the DocBOX vault. The stored vault record includes the provider, specialty, contact/address data, proposed services/fees, billing terms, notes, reference number, and the exact submitted PDF.

The DocBOX folder is now an operational review queue rather than just a storage destination:

- a dedicated queue header appears when Network Management opens **Provider Onboarding Submissions**;
- submissions can be filtered by **New**, **In review**, **Ready for Forms**, and **Declined**;
- opening Details renders the stored provider/contact/address/service/fee information as a structured review panel instead of exposing raw JSON notes;
- reviewers can open the exact submitted PDF from the panel;
- status changes update both the structured metadata and the file tags so the queue/filter state stays searchable;
- **Ready for Forms** explicitly means pricing has been reviewed and the next action is to create the secure Provider Service Agreement invitation in Occu-Med Forms; and
- the system-generated Provider Onboarding Submissions folder is protected from accidental deletion in the DocBOX UI.

This gives the open onboarding path a real operational destination without weakening the Forms signing/audit boundary. Network Management reviews the pricing response in DocBOX, then deliberately issues the final secure Provider Service Agreement through Occu-Med Forms if the proposal is accepted.

The public submission route includes basic payload validation, PDF signature checking, size limits, a bot-trap field, and a server-side per-client rate limit.

## Authoritative invitation mode

DocBOX2 also understands the existing Occu-Med Forms provider invitation lifecycle instead of limiting the integration to a local PDF copy.

- `/provider/[token]` renders an existing Forms invitation directly in DocBOX2.
- Provider-safe same-origin Next.js proxy routes forward invitation actions to the existing Forms backend, avoiding browser CORS coupling while keeping the Forms backend authoritative.
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

There are two deliberate entry modes rather than two competing agreement systems:

1. **Open provider onboarding:** specialty/capability selection → Forms-based Fee Proposal → exact PDF → DocBOX internal review queue → secure Forms Service Agreement invitation if approved.
2. **Existing secure Forms invitation:** `/provider/[token]` uses the authoritative Forms token/audit lifecycle and returns the signed document to the existing backend.

Creating authoritative invitations remains an authenticated Occu-Med/admin action in the Forms system. DocBOX2 does not expose a second unauthenticated invitation-creation endpoint.

Do not re-create a second signing/audit backend in DocBOX2 unless the Forms backend is intentionally retired and its lifecycle is migrated wholesale.
