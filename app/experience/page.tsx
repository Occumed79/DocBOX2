import { Suspense } from 'react';
import ProviderCompass from '@/components/experience/ProviderCompass';
import ProviderFAQ from '@/components/experience/ProviderFAQ';
import ProviderOnboarding from '@/components/experience/ProviderOnboarding';
import ReferenceStory from '@/components/experience/ReferenceStory';
import polish from './ProviderStaticPolish.module.css';

export default function ProviderExperiencePage() {
  return (
    <>
      <ReferenceStory />
      <ProviderCompass />
      <div className={polish.surface}>
        <Suspense fallback={<div aria-hidden="true" style={{ minHeight: '100vh', background: '#eef4f5' }} />}>
          <ProviderOnboarding />
        </Suspense>
        <ProviderFAQ />
      </div>
    </>
  );
}
