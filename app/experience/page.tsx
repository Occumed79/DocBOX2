import ChapterMorph from '@/components/experience/ChapterMorph';
import CinematicContinuity from '@/components/experience/CinematicContinuity';
import CinematicHandoff from '@/components/experience/CinematicHandoff';
import DirectorOverlay from '@/components/experience/DirectorOverlay';
import NarrativeThread from '@/components/experience/NarrativeThread';
import ProviderCompass from '@/components/experience/ProviderCompass';
import ProviderExperience from '@/components/experience/ProviderExperience';
import ProviderFAQ from '@/components/experience/ProviderFAQ';
import polish from './ProviderStaticPolish.module.css';

export default function ProviderExperiencePage() {
  return (
    <>
      <CinematicContinuity />
      <NarrativeThread />
      <ChapterMorph />
      <CinematicHandoff />
      <ProviderCompass />
      <DirectorOverlay />
      <div className={polish.surface}>
        <ProviderExperience />
        <ProviderFAQ />
      </div>
    </>
  );
}
