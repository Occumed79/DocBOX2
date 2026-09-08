'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './ValuesToPartnerGateway.module.css';

const VALUES = [
  { id: '01', label: 'HUMILITY', x: 18, y: 31 },
  { id: '02', label: 'POSITIVITY', x: 33, y: 65 },
  { id: '03', label: 'CUSTOMER SERVICE', x: 48, y: 27 },
  { id: '04', label: 'QUALITY', x: 63, y: 67 },
  { id: '05', label: 'INTEGRITY', x: 78, y: 32 },
  { id: '06', label: 'DILIGENCE', x: 88, y: 62 },
] as const;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function ValuesToPartnerGateway() {
  const ref = useRef<HTMLElement | null>(null);
  const [phase, setPhase] = useState('SIX BEHAVIORS');

  useEffect(() => {
    const shell = ref.current;
    if (!shell) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = shell.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / travel);
      shell.style.setProperty('--partner-progress', progress.toFixed(4));
      const next = progress < .3 ? 'SIX BEHAVIORS' : progress < .58 ? 'ONE OPERATING STANDARD' : progress < .82 ? 'OPEN NETWORK NODE' : 'YOUR FACILITY';
      setPhase(previous => previous === next ? previous : next);
    };

    const pointer = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      shell.style.setProperty('--partner-x', `${(event.clientX / Math.max(1, window.innerWidth) - .5).toFixed(3)}`);
      shell.style.setProperty('--partner-y', `${(event.clientY / Math.max(1, window.innerHeight) - .5).toFixed(3)}`);
    };

    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    addEventListener('pointermove', pointer, { passive: true });
    return () => {
      removeEventListener('scroll', queue);
      removeEventListener('resize', queue);
      removeEventListener('pointermove', pointer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={ref} id="partner-gateway" className={styles.shell} aria-label="Occu-Med values converge into the provider partner gateway">
      <div className={styles.sticky}>
        <div className={styles.light} aria-hidden="true" />

        <header className={styles.copy}>
          <span>VALUES → PARTNER</span>
          <h2>The system resolves<br /><em>into one open node.</em></h2>
          <p>The history, method, case workflow, clinical work, network, and operating values all arrive at the same practical question: what can your facility do?</p>
        </header>

        <div className={styles.phase}><i />{phase}</div>

        <div className={styles.field} aria-hidden="true">
          <svg className={styles.links} viewBox="0 0 100 70" preserveAspectRatio="none">
            {VALUES.map(value => <line key={value.id} x1={value.x} y1={value.y} x2="50" y2="48" />)}
          </svg>
          {VALUES.map((value,index) => (
            <div key={value.id} className={styles.valueNode} data-index={index} style={{ left: `${value.x}%`, top: `${value.y}%` }}>
              <i /><span>{value.id}</span><strong>{value.label}</strong>
            </div>
          ))}
          <div className={styles.standardCore}><small>OCCU-MED</small><strong>OPERATING<br />STANDARD</strong><i /></div>
        </div>

        <div className={styles.portal} aria-hidden="true">
          <div className={styles.portalOuter} /><div className={styles.portalMiddle} /><div className={styles.portalInner} />
          <span className={styles.portalLabel}>OPEN PROVIDER NODE</span>
          <div className={styles.team}><Image src="/photos/Diverse%20Healthcare%20Team%20Portrait%20(1).png" alt="" fill sizes="520px" /></div>
          <div className={styles.facilityNode}><i /><span>YOUR</span><strong>FACILITY</strong></div>
        </div>

        <div className={styles.cta}>
          <span>THE STORY ENDS. THE PARTNERSHIP STARTS.</span>
          <h3>Tell us what your facility can do.</h3>
          <p>The interface now becomes deliberately practical: specialty, capabilities, provider information, rates, terms, and the Forms-based fee proposal.</p>
          <a href="#provider-details">BEGIN PROVIDER ONBOARDING <b>→</b></a>
        </div>

        <div className={styles.flow} aria-hidden="true"><span>OCCU-MED SYSTEM</span><i /><b>PROVIDER PARTNER</b></div>
      </div>
    </section>
  );
}
