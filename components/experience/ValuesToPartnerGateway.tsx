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
    const portal = shell.querySelector<HTMLElement>('[data-partner-portal]');
    const team = shell.querySelector<HTMLElement>('[data-partner-team]');
    const facility = shell.querySelector<HTMLElement>('[data-partner-facility]');
    const portalLabel = shell.querySelector<HTMLElement>('[data-partner-label]');
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = shell.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / travel);
      const handoff = clamp((progress - .78) / .22);
      shell.style.setProperty('--partner-progress', progress.toFixed(4));

      if (portal) {
        const vw = Math.max(1, window.innerWidth);
        const vh = Math.max(1, window.innerHeight);
        const baseSize = vw <= 620
          ? Math.min(vw * 1.2, vh * .79)
          : vw <= 1050
            ? Math.min(vw * .94, 760, vh * .79)
            : Math.min(vw * .66, 820, vh * .79);
        const size = baseSize * (1 - handoff * .38);
        portal.style.left = `${50 + handoff * 31}%`;
        portal.style.top = `${55 - handoff * 29}%`;
        portal.style.width = `${size}px`;
        portal.style.height = `${size}px`;
        portal.style.maxHeight = 'none';
      }

      if (team) {
        const teamIn = Math.max(0, Math.min(.9, (progress - .58) * 3.25));
        team.style.opacity = `${teamIn * (1 - handoff)}`;
      }
      if (facility) {
        const facilitySize = 158 + handoff * 82;
        facility.style.width = `${facilitySize}px`;
        facility.style.height = `${facilitySize}px`;
        facility.style.boxShadow = `0 0 0 ${24 + handoff * 18}px rgba(40,130,148,.04), 0 0 ${80 + handoff * 50}px rgba(42,139,158,.2)`;
      }
      if (portalLabel) portalLabel.style.opacity = `${1 - handoff}`;

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

        <div className={styles.portal} data-partner-portal aria-hidden="true">
          <div className={styles.portalOuter} /><div className={styles.portalMiddle} /><div className={styles.portalInner} />
          <span className={styles.portalLabel} data-partner-label>OPEN PROVIDER NODE</span>
          <div className={styles.team} data-partner-team><Image src="/photos/Diverse%20Healthcare%20Team%20Portrait%20(1).png" alt="" fill sizes="520px" /></div>
          <div className={styles.facilityNode} data-partner-facility><i /><span>YOUR</span><strong>FACILITY</strong></div>
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
