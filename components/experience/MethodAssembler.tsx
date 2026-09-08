'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './MethodAssembler.module.css';

const EVIDENCE = [
  {
    id: '01',
    label: 'VALID JOB INFORMATION',
    detail: 'Essential functions · physical demands · environment',
    image: '/photos/EMPLOYEE%20ID.png',
  },
  {
    id: '02',
    label: 'JOB-RELATED MEDICAL EXAM',
    detail: 'Findings · measurements · testing · documentation',
    image: '/photos/EXAM%20REPORT.png',
  },
  {
    id: '03',
    label: 'COMPATIBILITY ASSESSMENT',
    detail: 'Medical evidence × job demand × applicable standards',
    image: '/photos/Fitness%20Determination.png',
  },
] as const;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function MethodAssembler() {
  const shellRef = useRef<HTMLElement | null>(null);
  const [phase, setPhase] = useState('RESEARCH MATERIAL');

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = shell.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / travel);
      shell.style.setProperty('--assemble-progress', progress.toFixed(4));
      const next = progress < .28 ? 'RESEARCH MATERIAL' : progress < .58 ? 'ALIGNING THREE DIMENSIONS' : progress < .82 ? 'EXAMQA ASSEMBLED' : 'AUTHORIZATION READY';
      setPhase(previous => previous === next ? previous : next);
    };

    const pointer = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const x = event.clientX / Math.max(1, window.innerWidth) - .5;
      const y = event.clientY / Math.max(1, window.innerHeight) - .5;
      shell.style.setProperty('--assemble-x', x.toFixed(3));
      shell.style.setProperty('--assemble-y', y.toFixed(3));
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
    <section ref={shellRef} className={styles.shell} aria-label="Research assembles into the Occu-Med method">
      <div className={styles.sticky}>
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.scan} aria-hidden="true" />

        <header className={styles.copy}>
          <span>RESEARCH → OPERATING MODEL</span>
          <h2>The archive does not end.<br /><em>It assembles itself.</em></h2>
          <p>Job demand, medical evidence, and compatibility are not three slides. They are three physical inputs that have to occupy the same decision space.</p>
        </header>

        <div className={styles.phase}><i />{phase}</div>

        <div className={styles.machine} aria-hidden="true">
          <div className={`${styles.axis} ${styles.axisA}`}><span>JOB</span></div>
          <div className={`${styles.axis} ${styles.axisB}`}><span>MEDICAL</span></div>
          <div className={`${styles.axis} ${styles.axisC}`}><span>COMPATIBILITY</span></div>
          <div className={styles.core}><small>PROPRIETARY MODEL</small><strong>EXAMQA</strong><i /></div>
          <div className={styles.ringA} /><div className={styles.ringB} /><div className={styles.ringC} />
        </div>

        <div className={styles.evidenceField} aria-hidden="true">
          {EVIDENCE.map((item,index) => (
            <article key={item.id} className={styles.evidence} data-index={index}>
              <div className={styles.evidenceImage}><Image src={item.image} alt="" fill sizes="280px" /></div>
              <div className={styles.evidenceLabel}><span>{item.id}</span><strong>{item.label}</strong><small>{item.detail}</small></div>
            </article>
          ))}
        </div>

        <div className={styles.authorization} aria-hidden="true">
          <div className={styles.authTop}><span>OCCU-MED / AUTHORIZATION</span><b>OM / REF</b></div>
          <strong>AUTHORIZED PROVIDER PACKET</strong>
          <div className={styles.authRows}>
            <span><i>01</i> JOB CONTEXT <b>ATTACHED</b></span>
            <span><i>02</i> MEDICAL SCOPE <b>DEFINED</b></span>
            <span><i>03</i> DOCUMENTATION <b>REQUIRED</b></span>
          </div>
          <div className={styles.authCode}>CASE OBJECT // READY TO ENTER OPERATIONS</div>
        </div>

        <div className={styles.handoff} aria-hidden="true"><span>RESEARCH</span><i /><b>CASE</b></div>
      </div>
    </section>
  );
}
