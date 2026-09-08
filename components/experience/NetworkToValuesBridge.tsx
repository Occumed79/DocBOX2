'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './NetworkToValuesBridge.module.css';

const VALUES = [
  { id: '01', label: 'HUMILITY', image: '/photos/Corevalue.png', x: 18, y: 34 },
  { id: '02', label: 'POSITIVITY', image: '/photos/Corevalue2.png', x: 34, y: 58 },
  { id: '03', label: 'CUSTOMER SERVICE', image: '/photos/Corevalue3.png', x: 49, y: 31 },
  { id: '04', label: 'QUALITY', image: '/photos/Corevalue4.png', x: 64, y: 57 },
  { id: '05', label: 'INTEGRITY', image: '/photos/Corevalue5.png', x: 79, y: 35 },
  { id: '06', label: 'DILIGENCE', image: '/photos/Corevalue6.png', x: 88, y: 62 },
] as const;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function NetworkToValuesBridge() {
  const ref = useRef<HTMLElement | null>(null);
  const [phase, setPhase] = useState('NETWORK SCALE');

  useEffect(() => {
    const shell = ref.current;
    if (!shell) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = shell.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / travel);
      shell.style.setProperty('--values-bridge', progress.toFixed(4));
      const next = progress < .3 ? 'NETWORK SCALE' : progress < .56 ? 'REMOVE THE GEOGRAPHY' : progress < .8 ? 'SIX OPERATING PRINCIPLES' : 'BEHAVIORS READY';
      setPhase(previous => previous === next ? previous : next);
    };

    const pointer = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      shell.style.setProperty('--values-x', `${(event.clientX / Math.max(1, window.innerWidth) - .5).toFixed(3)}`);
      shell.style.setProperty('--values-y', `${(event.clientY / Math.max(1, window.innerHeight) - .5).toFixed(3)}`);
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
    <section ref={ref} className={styles.shell} aria-label="Global network collapses into Occu-Med operating values">
      <div className={styles.sticky}>
        <header className={styles.copy}>
          <span>NETWORK → OPERATING CULTURE</span>
          <h2>Scale is only useful<br /><em>if behavior survives it.</em></h2>
          <p>Strip away the map, locations, and service layers. What remains is the operating behavior expected to hold the system together.</p>
        </header>

        <div className={styles.phase}><i />{phase}</div>

        <div className={styles.networkPlane} aria-hidden="true">
          <div className={styles.mapImage}><Image src="/photos/International%20Network.png" alt="" fill sizes="100vw" /></div>
          <svg className={styles.routes} viewBox="0 0 100 70" preserveAspectRatio="none">
            <path d="M6 52 C18 37 28 44 35 58 S46 42 52 35 S64 48 72 54 S83 36 94 43" />
            <path d="M14 31 C23 43 34 34 44 41 S62 29 73 37 S84 54 94 52" />
          </svg>
          {Array.from({ length: 28 }, (_, index) => (
            <i key={index} className={styles.node} style={{ '--node': index } as React.CSSProperties} />
          ))}
        </div>

        <div className={styles.valueWorld} aria-hidden="true">
          <div className={styles.center}><small>OCCU-MED</small><strong>HOW WE WORK</strong><i /></div>
          {VALUES.map((value,index) => (
            <article key={value.id} className={styles.value} data-index={index} style={{ '--target-x': `${value.x}%`, '--target-y': `${value.y}%` } as React.CSSProperties}>
              <div className={styles.valueImage}><Image src={value.image} alt="" fill sizes="180px" /></div>
              <div className={styles.valueMeta}><span>{value.id}</span><strong>{value.label}</strong></div>
            </article>
          ))}
          <svg className={styles.valueLinks} viewBox="0 0 100 70" preserveAspectRatio="none">
            {VALUES.map(value => <line key={value.id} x1="50" y1="47" x2={value.x} y2={value.y} />)}
          </svg>
        </div>

        <div className={styles.statement} aria-hidden="true">
          <span>THE NETWORK DOES NOT CREATE CONSISTENCY.</span>
          <strong>THE OPERATING BEHAVIOR DOES.</strong>
        </div>

        <div className={styles.flow} aria-hidden="true"><span>INFRASTRUCTURE</span><i /><b>BEHAVIOR</b></div>
      </div>
    </section>
  );
}
