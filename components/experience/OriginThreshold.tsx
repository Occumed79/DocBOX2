'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './OriginThreshold.module.css';

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function OriginThreshold() {
  const ref = useRef<HTMLElement | null>(null);
  const [phase, setPhase] = useState('OUTSIDE');

  useEffect(() => {
    const shell = ref.current;
    if (!shell) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = shell.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / travel);
      shell.style.setProperty('--origin-progress', progress.toFixed(4));
      const next = progress < .25 ? 'OUTSIDE' : progress < .52 ? 'APPROACH' : progress < .78 ? '1976 / RESEARCH' : 'ARCHIVE OPEN';
      setPhase(previous => previous === next ? previous : next);
    };

    const pointer = (event: PointerEvent) => {
      shell.style.setProperty('--origin-x', `${(event.clientX / Math.max(1, window.innerWidth) - .5).toFixed(3)}`);
      shell.style.setProperty('--origin-y', `${(event.clientY / Math.max(1, window.innerHeight) - .5).toFixed(3)}`);
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

  const enter = () => document.getElementById('archive-world')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <section ref={ref} id="origin" className={styles.shell} aria-label="Occu-Med origin threshold">
      <div className={styles.sticky}>
        <div className={styles.building} aria-hidden="true">
          <Image src="/photos/ChatGPT%20Image%20Sep%206%2C%202026%2C%2010_15_00%20PM.png" alt="" fill priority sizes="100vw" />
        </div>
        <div className={styles.shade} aria-hidden="true" />
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.aperture} aria-hidden="true"><i /><b /></div>

        <div className={styles.copy}>
          <span>1976 → TODAY / OCCU-MED</span>
          <h1>Don’t scroll through a brochure.<br /><em>Enter the system.</em></h1>
          <p>Research became standards. Standards became a case workflow. The workflow became a provider network. Move forward and the headquarters gives way to the research archive behind it.</p>
          <button type="button" onClick={enter}>ENTER THE ARCHIVE <b>↓</b></button>
        </div>

        <div className={styles.archiveSignal} aria-hidden="true">
          <span>ARCHIVE ACCESS</span>
          <strong>1976</strong>
          <p>THE QUESTION BEFORE THE COMPANY</p>
          <i />
        </div>

        <div className={styles.telemetry}>
          <span>15,000+ PROVIDER LOCATIONS</span>
          <span>50+ COUNTRIES</span>
          <span>1M+ EMPLOYEES SUPPORTED</span>
        </div>

        <div className={styles.phase}><i />{phase}</div>
        <div className={styles.depth} aria-hidden="true"><span>OUTSIDE</span><i /><b>ARCHIVE</b></div>
      </div>
    </section>
  );
}
