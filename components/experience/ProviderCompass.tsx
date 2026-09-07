'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ProviderCompass.module.css';

const STEPS = ['Specialty', 'Capabilities', 'Information', 'Agreement'] as const;
const STEP_POINTS = [0.04, 0.28, 0.52, 0.76] as const;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function ProviderCompass() {
  const compassRef = useRef<HTMLDivElement | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const compass = compassRef.current;
    if (!compass) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const provider = document.getElementById('provider-details');
      if (!provider) {
        compass.style.setProperty('--provider-compass', '0');
        return;
      }

      const vh = Math.max(1, window.innerHeight);
      const rect = provider.getBoundingClientRect();
      const travel = Math.max(vh, rect.height - vh * 0.72);
      const progress = clamp((vh * 0.14 - rect.top) / travel);
      const entry = clamp((vh * 0.88 - rect.top) / (vh * 0.42));
      const exit = clamp((rect.bottom - vh * 0.12) / (vh * 0.46));
      const visibility = entry * exit;

      compass.style.setProperty('--provider-compass', visibility.toFixed(4));
      compass.style.setProperty('--provider-progress', progress.toFixed(4));

      const nextStep = progress < .25 ? 0 : progress < .5 ? 1 : progress < .74 ? 2 : 3;
      setActiveStep(previous => previous === nextStep ? previous : nextStep);
    };

    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const jumpTo = (index: number) => {
    const provider = document.getElementById('provider-details');
    if (!provider) return;
    const rect = provider.getBoundingClientRect();
    const vh = Math.max(1, window.innerHeight);
    const absoluteTop = window.scrollY + rect.top;
    const travel = Math.max(0, provider.offsetHeight - vh * 0.72);
    window.scrollTo({ top: absoluteTop + travel * STEP_POINTS[index], behavior: 'smooth' });
  };

  return (
    <div ref={compassRef} className={styles.compass}>
      <div className={styles.identity}>
        <span>OCCU-MED</span>
        <strong>Provider setup</strong>
      </div>
      <div className={styles.track} aria-hidden="true"><i /></div>
      <nav aria-label="Provider onboarding sections">
        {STEPS.map((step, index) => (
          <button key={step} type="button" className={index === activeStep ? styles.active : ''} onClick={() => jumpTo(index)}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{step}</strong>
          </button>
        ))}
      </nav>
    </div>
  );
}
