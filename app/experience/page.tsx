import CinematicContinuity from '@/components/experience/CinematicContinuity';
import CinematicHandoff from '@/components/experience/CinematicHandoff';
import NarrativeThread from '@/components/experience/NarrativeThread';
import ProviderCompass from '@/components/experience/ProviderCompass';
import ProviderExperience from '@/components/experience/ProviderExperience';
import polish from './ProviderStaticPolish.module.css';

export default function ProviderExperiencePage() {
  return (
    <>
      <CinematicContinuity />
      <NarrativeThread />
      <CinematicHandoff />
      <ProviderCompass />
      <div className={polish.surface}>
        <ProviderExperience />
      </div>
    </>
  );
}
