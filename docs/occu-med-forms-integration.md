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
- Browser-local draft persistence while the public onboarding flow is still being developed.

The old standalone `PricingAgreementBuilder` implementation has been retired; its component name remains only as a compatibility wrapper so the larger provider experience does not need to know which agreement engine renders below it.

## Backend boundary

The production Occu-Med Forms backend remains the authoritative implementation for provider invitation tokens, signed-document persistence, completion certificates, evidence hashes, audit events, returned-term review, approval, decline handling, retention, and admin roles.

Current Render backend: `https://occu-med-forms.onrender.com`

The embedded onboarding agreement currently stops at signed review + exact PDF download. The next backend step is to route the embedded completion through the Forms invitation/audit lifecycle without duplicating those controls inside DocBOX2.

Do not re-create a second signing/audit backend in DocBOX2 unless the Forms backend is intentionally retired and its lifecycle is migrated wholesale.
