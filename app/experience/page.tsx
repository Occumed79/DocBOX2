import { Suspense } from 'react';
import ProviderCompass from '@/components/experience/ProviderCompass';
import ProviderFAQ from '@/components/experience/ProviderFAQ';
import ProviderOnboarding from '@/components/experience/ProviderOnboarding';
import ReferenceStory from '@/components/experience/ReferenceStory';
import flow from './ProviderFlowContinuity.module.css';
import polish from './ProviderStaticPolish.module.css';
import tuning from './ReferenceVisualTuning.module.css';

export default function ProviderExperiencePage() {
  return (
    <>
      <div className={tuning.frame}>
        <ReferenceStory />
      </div>
      <ProviderCompass />
      <div className={`${polish.surface} ${flow.flow}`}>
        <Suspense fallback={<div aria-hidden="true" style={{ minHeight: '100vh', background: '#eef4f5' }} />}>
          <ProviderOnboarding />
        </Suspense>
        <ProviderFAQ />
      </div>
    </>
  );
}
