'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './ClinicalToNetworkBridge.module.css';

const SERVICES = [
  { code: 'MED', label: 'Medical', image: '/photos/Medical%20Eval.png', x: 22, y: 42 },
  { code: 'LAB', label: 'Laboratory', image: '/photos/Calm%20Clinic%20Blood%20Draw%20(1).png', x: 35, y: 58 },
  { code: 'DEN', label: 'Dental', image: '/photos/Dental%20Eval.png', x: 53, y: 38 },
  { code: 'AUD', label: 'Audiometry', image: '/photos/Audiometry.png', x: 68, y: 55 },
  { code: 'VAC', label: 'Vaccination', image: '/photos/Pharmacist%20Administering%20a%20Vaccine(1)%20(1).png', x: 82, y: 34 },
] as const;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function ClinicalToNetworkBridge() {
  const ref = useRef<HTMLElement | null>(null);
  const [phase, setPhase] = useState('SERVICE OBJECTS');

  useEffect(() => {
    const shell = ref.current;
    if (!shell) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = shell.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / travel);
      shell.style.setProperty('--network-bridge', progress.toFixed(4));
      const next = progress < .3 ? 'SERVICE OBJECTS' : progress < .6 ? 'BECOMING NETWORK NODES' : progress < .84 ? 'GEOGRAPHIC SCOPE' : 'NETWORK INSTRUMENT';
      setPhase(previous => previous === next ? previous : next);
    };

    const pointer = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      shell.style.setProperty('--network-x', `${(event.clientX / Math.max(1, window.innerWidth) - .5).toFixed(3)}`);
      shell.style.setProperty('--network-y', `${(event.clientY / Math.max(1, window.innerHeight) - .5).toFixed(3)}`);
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
    <section ref={ref} className={styles.shell} aria-label="Clinical service objects become the global provider network">
      <div className={styles.sticky}>
        <div className={styles.lightWash} aria-hidden="true" />

        <header className={styles.copy}>
          <span>CLINICAL → NETWORK</span>
          <h2>The work leaves the room.<br /><em>It becomes infrastructure.</em></h2>
          <p>Each service is no longer an isolated clinical object. It becomes a capability that can be coordinated across a provider network.</p>
        </header>

        <div className={styles.phase}><i />{phase}</div>

        <div className={styles.world} aria-hidden="true">
          <div className={styles.networkImage}><Image src="/photos/International%20Network.png" alt="" fill sizes="100vw" /></div>
          <svg className={styles.routes} viewBox="0 0 100 70" preserveAspectRatio="none">
            <path d="M10 52 C20 40 26 46 35 58 S46 43 53 38 S62 48 68 55 S75 39 82 34 S90 42 95 31" />
            <path d="M17 31 C28 36 31 47 42 43 S62 31 74 39 S83 47 92 52" />
            <circle cx="17" cy="47" r="1.2" className={styles.anchor} />
            <circle cx="7" cy="55" r="1.2" className={styles.anchor} />
          </svg>
          <div className={styles.anchorLabel} data-anchor="fresno">FRESNO / HQ</div>
          <div className={styles.anchorLabel} data-anchor="honolulu">HONOLULU / ORIGIN</div>

          {SERVICES.map((service,index) => (
            <article key={service.code} className={styles.service} data-index={index} style={{ '--target-x': `${service.x}%`, '--target-y': `${service.y}%` } as React.CSSProperties}>
              <div className={styles.serviceImage}><Image src={service.image} alt="" fill sizes="180px" /></div>
              <div className={styles.serviceMeta}><span>{service.code}</span><strong>{service.label}</strong></div>
            </article>
          ))}

          <div className={styles.hub}><span>OCCU-MED</span><strong>NETWORK</strong><i /></div>
        </div>

        <div className={styles.metrics} aria-hidden="true">
          <article><strong>15,000+</strong><span>PROVIDER LOCATIONS</span></article>
          <article><strong>50</strong><span>U.S. STATES</span></article>
          <article><strong>50+</strong><span>COUNTRIES ABROAD</span></article>
          <article><strong>1M+</strong><span>EMPLOYEES SUPPORTED</span></article>
        </div>

        <div className={styles.rule} aria-hidden="true"><span>VERIFIED SCOPE</span><i /><b>INTERACTIVE NETWORK</b></div>
        <div className={styles.disclaimer}>Animated corridors are illustrative continuity, not claimed provider routes. Exact anchors and published geographic scope remain distinguished in the explorer.</div>
      </div>
    </section>
  );
}
