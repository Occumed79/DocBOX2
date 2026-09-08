'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './CaseTunnel.module.css';

const SERVICES = [
  { code: 'MED-01', label: 'MEDICAL', image: '/photos/Medical%20Eval.png' },
  { code: 'LAB-02', label: 'LABORATORY', image: '/photos/Calm%20Clinic%20Blood%20Draw%20(1).png' },
  { code: 'DEN-03', label: 'DENTAL', image: '/photos/Dental%20Eval.png' },
  { code: 'AUD-04', label: 'AUDIOMETRY', image: '/photos/Audiometry.png' },
  { code: 'VAC-05', label: 'VACCINATION', image: '/photos/Pharmacist%20Administering%20a%20Vaccine(1)%20(1).png' },
] as const;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function CaseTunnel() {
  const ref = useRef<HTMLElement | null>(null);
  const [phase, setPhase] = useState('AUTHORIZED CASE');

  useEffect(() => {
    const shell = ref.current;
    if (!shell) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = shell.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / travel);
      shell.style.setProperty('--tunnel-progress', progress.toFixed(4));
      const next = progress < .28 ? 'AUTHORIZED CASE' : progress < .56 ? 'SERVICE SCOPE EXPANDS' : progress < .82 ? 'CLINICAL OBJECTS' : 'DATABASE READY';
      setPhase(previous => previous === next ? previous : next);
    };

    const pointer = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      shell.style.setProperty('--tunnel-x', `${(event.clientX / Math.max(1, window.innerWidth) - .5).toFixed(3)}`);
      shell.style.setProperty('--tunnel-y', `${(event.clientY / Math.max(1, window.innerHeight) - .5).toFixed(3)}`);
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
    <section ref={ref} className={styles.shell} aria-label="Referral case expands into clinical service objects">
      <div className={styles.sticky}>
        <div className={styles.tunnel} aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => <i key={index} style={{ '--ring': index } as React.CSSProperties} />)}
        </div>

        <header className={styles.copy}>
          <span>OPERATIONS → CLINICAL</span>
          <h2>One case enters.<br /><em>The medical world unfolds.</em></h2>
          <p>The referral packet keeps its identity while its authorized scope becomes the actual clinical work the provider performs.</p>
        </header>

        <div className={styles.phase}><i />{phase}</div>

        <div className={styles.caseObject} aria-hidden="true">
          <div className={styles.caseHead}><span>OM / REF</span><b>AUTHORIZED</b></div>
          <strong>PROVIDER CASE</strong>
          <div className={styles.caseRows}><span>EXAMINEE</span><b>ASSIGNED</b><span>SCOPE</span><b>5 SERVICE CLASSES</b><span>RESULTS</span><b>RETURN REQUIRED</b></div>
          <div className={styles.caseScan} />
        </div>

        <div className={styles.serviceWorld} aria-hidden="true">
          {SERVICES.map((service,index) => (
            <article key={service.code} className={styles.service} data-index={index}>
              <div className={styles.serviceImage}><Image src={service.image} alt="" fill sizes="260px" /></div>
              <div className={styles.serviceMeta}><span>{service.code}</span><strong>{service.label}</strong></div>
            </article>
          ))}
          <div className={styles.scanner}><i /><b>AUTHORIZED SCOPE</b></div>
        </div>

        <div className={styles.databaseDoor} aria-hidden="true">
          <span>CLINICAL DATABASE</span>
          <strong>05 OBJECTS<br />READY TO INSPECT</strong>
          <i />
        </div>

        <div className={styles.flow} aria-hidden="true"><span>CASE</span><i /><b>CLINICAL DATA</b></div>
      </div>
    </section>
  );
}
