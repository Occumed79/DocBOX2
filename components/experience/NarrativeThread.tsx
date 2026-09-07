'use client';

import { useEffect, useState } from 'react';
import styles from './NarrativeThread.module.css';

type Phase = 'method' | 'referral' | 'clinical' | 'workforce' | 'network' | 'values' | 'hidden';

const PHASES: Record<Exclude<Phase, 'hidden'>, { eyebrow: string; label: string; detail: string; path: string }> = {
  method: {
    eyebrow: 'CONTEXT ENTERS THE SYSTEM',
    label: 'JOB + MEDICAL + COMPATIBILITY',
    detail: 'The case begins with the job, not with an isolated medical finding.',
    path: 'M 8 62 C 25 24, 43 22, 54 52 S 76 82, 92 42',
  },
  referral: {
    eyebrow: 'ONE AUTHORIZATION / ONE CASE',
    label: 'REFERRAL IN MOTION',
    detail: 'The same case moves through scheduling, examination, records, QA and review.',
    path: 'M 7 54 C 22 54, 26 30, 39 30 S 53 77, 66 77 S 78 47, 93 47',
  },
  clinical: {
    eyebrow: 'THE SERVICE CHANGES',
    label: 'THE CASE THREAD DOESN’T',
    detail: 'Physicals, blood draws, dental, audiometry and vaccines stay inside one operating model.',
    path: 'M 7 69 C 20 20, 34 18, 47 62 S 70 87, 93 28',
  },
  workforce: {
    eyebrow: 'THE JOB CHANGES THE MEANING',
    label: 'JOB-SPECIFIC CONTEXT',
    detail: 'The same medical finding can mean something different when the essential work changes.',
    path: 'M 7 33 C 22 81, 37 80, 50 38 S 76 14, 93 67',
  },
  network: {
    eyebrow: 'ONE OPERATING MODEL / MANY LOCATIONS',
    label: 'NETWORK COORDINATION',
    detail: 'The case thread expands from one referral into a distributed provider network.',
    path: 'M 7 58 C 18 31, 31 31, 42 58 S 61 82, 72 52 S 84 24, 93 41',
  },
  values: {
    eyebrow: 'THE SYSTEM BECOMES BEHAVIOR',
    label: 'HOW THE WORK GETS DONE',
    detail: 'The visual system resolves into the operating behaviors that carry the case forward.',
    path: 'M 7 54 C 25 54, 34 54, 50 54 S 75 54, 93 54',
  },
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function valuesSection() {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find(section =>
    Array.from(section.querySelectorAll('button strong')).some(node => node.textContent?.trim() === 'Humility')
  ) ?? null;
}

function handoffSection() {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find(section =>
    Boolean(section.querySelector('a[href="#provider-details"]'))
  ) ?? null;
}

export default function NarrativeThread() {
  const [phase, setPhase] = useState<Phase>('hidden');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight || 1;
      const base = Array.from(document.querySelectorAll<HTMLElement>('section[data-scrub]'));
      const values = valuesSection();
      const handoff = handoffSection();
      const sections = [...base, ...(values ? [values] : []), ...(handoff ? [handoff] : [])];

      let nearestIndex = -1;
      let nearestDistance = Number.POSITIVE_INFINITY;
      let nearestProgress = 0;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height * 0.5 - vh * 0.52);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
          nearestProgress = clamp((vh * 0.72 - rect.top) / Math.max(1, rect.height + vh * 0.2));
        }
      });

      const next: Phase =
        nearestIndex === 4 ? 'method' :
        nearestIndex === 5 ? 'referral' :
        nearestIndex === 6 ? 'clinical' :
        nearestIndex === 7 ? 'workforce' :
        nearestIndex === 8 ? 'network' :
        nearestIndex === 9 ? 'values' :
        'hidden';

      const providerTop = document.getElementById('provider-details')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      setPhase(providerTop < vh * 0.85 ? 'hidden' : next);
      setProgress(nearestProgress);
    };

    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const content = phase === 'hidden' ? null : PHASES[phase];

  return (
    <div
      className={`${styles.thread} ${phase === 'hidden' ? styles.hidden : ''}`}
      data-phase={phase}
      style={{ '--thread-progress': progress } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className={styles.copy}>
        <span>{content?.eyebrow}</span>
        <strong>{content?.label}</strong>
        <p>{content?.detail}</p>
      </div>

      <svg className={styles.route} viewBox="0 0 100 100" preserveAspectRatio="none">
        <path className={styles.routeGhost} d={content?.path ?? PHASES.method.path} pathLength="1" />
        <path className={styles.routeLive} d={content?.path ?? PHASES.method.path} pathLength="1" />
      </svg>

      <div className={styles.puck}>
        <i />
        <span>OM</span>
      </div>
      <div className={styles.echo}><i /><i /><i /></div>
    </div>
  );
}
