# Current Provider Experience Architecture

This document is the implementation boundary for the active `/experience` routes.

- `/experience` — Occu-Med company story using Oryzo-style motion/composition mechanics, authored around Occu-Med source documents and the approved 26-photo sequence.
- End of `/experience` — Zero Tech-style spatial portal hub with one traveler/astronaut and five destinations.
- `/experience/history` — Nasdaq 50th-style horizontal WebGL chronology/exhibition.
- `/experience/network` — Blue Corridors-style exploration grammar with the Cesium globe as the dominant field and compact layer/geography controls.
- `/experience/resources` — Lusion studio-style project/specialty selection hierarchy with one focused 3D specialty visual and a clean editorial resource surface.
- `/experience/questions` — Blue Corridors-style information explorer: fixed lifecycle/question rail, spatial field, topic layers, detail drawer.
- `/experience/agreement` — cinematic handoff only; the destination is the existing functional Occu-Med Forms pricing workflow.

## Guardrails

1. Do not blend the reference visual systems across routes.
2. Do not reintroduce generic card grids, giant decorative ghost typography, or scattered floating UI when the mapped reference does not use them.
3. Oryzo supplies motion/composition mechanics only; Occu-Med imagery/content controls story art direction.
4. Provider identities are never rendered in the Network experience. `23,524` is the current count of valid mapped provider coordinates, not the workbook's total record count.
5. The clinic documents clinical findings. Occu-Med Medical Review issues the employment/deployment recommendation.
6. The Authorization for Examination is the definitive clinical scope for the Provider Q&A and Resources workflows.
7. Agreement must preserve and reveal the existing working Forms implementation rather than replace it with a decorative mock form.

## Active implementation files

- `components/experience/ProviderJourneyReplica.tsx`
- `components/experience/ProviderJourneyStoryData.ts`
- `components/experience/immersive/OryzoStoryWorld.tsx`
- `components/experience/immersive/ZeroTechPortalHub.tsx`
- `components/experience/history/HistoryExperience.tsx`
- `components/experience/immersive/HistoryWorld.tsx`
- `components/experience/network/NetworkExperience.tsx`
- `components/experience/network/CesiumNetworkGlobe.tsx`
- `components/experience/resources/ResourceExperience.tsx`
- `components/experience/resources/SpecialtyField.tsx`
- `components/experience/questions/QuestionExperience.tsx`
- `components/experience/questions/QuestionField.tsx`
- `components/experience/agreement/AgreementExperience.tsx`
- `components/experience/PricingAgreementBuilder.tsx`

`tests/e2e/provider-experience.spec.ts` is the current route-level regression contract and is executed on pushes to `main` by `.github/workflows/provider-experience-qa.yml`.
