import { Suspense } from 'react';
import ChapterMorph from '@/components/experience/ChapterMorph';
import CinematicContinuity from '@/components/experience/CinematicContinuity';
import CinematicHandoff from '@/components/experience/CinematicHandoff';
import DirectorOverlay from '@/components/experience/DirectorOverlay';
import NarrativeThread from '@/components/experience/NarrativeThread';
import ProviderCompass from '@/components/experience/ProviderCompass';
import ProviderExperience from '@/components/experience/ProviderExperience';
import ProviderFAQ from '@/components/experience/ProviderFAQ';
import SpatialArchiveField from '@/components/experience/SpatialArchiveField';
import SpatialCaseMorphField from '@/components/experience/SpatialCaseMorphField';
import SpatialNetworkField from '@/components/experience/SpatialNetworkField';
import SpatialValuesPartnerField from '@/components/experience/SpatialValuesPartnerField';
import polish from './ProviderStaticPolish.module.css';

export default function ProviderExperiencePage() {
  return (
    <>
      <CinematicContinuity />
      <SpatialArchiveField />
      <SpatialCaseMorphField />
      <SpatialNetworkField />
      <SpatialValuesPartnerField />
      <NarrativeThread />
      <ChapterMorph />
      <CinematicHandoff />
      <ProviderCompass />
      <DirectorOverlay />
      <div className={polish.surface}>
        <Suspense fallback={<div aria-hidden="true" style={{ minHeight: '100vh', background: '#071923' }} />}>
          <ProviderExperience />
        </Suspense>
        <ProviderFAQ />
      </div>
    </>
  );
}
