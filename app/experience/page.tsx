import { Suspense } from 'react';
import ProviderExperience from '@/components/experience/ProviderExperience';
import ProviderFAQ from '@/components/experience/ProviderFAQ';
import polish from './ProviderStaticPolish.module.css';

export default function ProviderExperiencePage() {
  return (
    <div className={polish.surface}>
      <header className={polish.experienceNav}>
        <a className={polish.experienceBrand} href="#top" aria-label="Occu-Med provider experience home">
          <strong>OCCU-MED</strong>
          <span>Provider network</span>
        </a>
        <nav aria-label="Provider experience navigation">
          <a href="#history">Our story</a>
          <a href="#process">How referrals work</a>
          <a href="#services">Services</a>
          <a className={polish.primaryNavAction} href="#provider-details">Join the network</a>
        </nav>
      </header>
        <Suspense fallback={<div aria-hidden="true" style={{ minHeight: '100vh', background: '#071923' }} />}>
          <ProviderExperience />
        </Suspense>
        <ProviderFAQ />
    </div>
  );
}
