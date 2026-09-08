'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from './ClinicalDatabase.module.css';

type Entry = {
  id: string;
  title: string;
  label: string;
  image: string;
  scope: string[];
  sends: string[];
  returns: string[];
};

const ENTRIES: Entry[] = [
  { id: 'MED-01', title: 'Medical evaluation', label: 'JOB-RELATED EXAM', image: '/photos/Medical%20Eval.png', scope: ['Physical examination', 'Vision / hearing as authorized', 'Cardiopulmonary testing as authorized'], sends: ['Authorization', 'Job / program context', 'Exam packet'], returns: ['Completed exam', 'Test outputs', 'Supporting records'] },
  { id: 'LAB-02', title: 'Laboratory', label: 'SPECIMEN / RESULT', image: '/photos/Calm%20Clinic%20Blood%20Draw%20(1).png', scope: ['Blood collection', 'Urinalysis', 'TB / specialty panels'], sends: ['Ordered panel', 'Demographics', 'Collection instructions'], returns: ['Final results', 'Accession details', 'Collection documentation'] },
  { id: 'DEN-03', title: 'Dental readiness', label: 'EXAM / IMAGING', image: '/photos/Dental%20Eval.png', scope: ['Comprehensive evaluation', 'Bitewings', 'Panoramic imaging'], sends: ['Dental scope', 'Required forms', 'Examinee details'], returns: ['Dental findings', 'Requested imaging', 'Readiness documentation'] },
  { id: 'AUD-04', title: 'Audiometry', label: 'HEARING CONSERVATION', image: '/photos/Audiometry.png', scope: ['Pure-tone testing', 'Baseline / periodic support', 'Requested documentation'], sends: ['Authorization', 'Testing requirements', 'Program forms'], returns: ['Audiogram', 'Results', 'Required supporting record'] },
  { id: 'VAC-05', title: 'Vaccination', label: 'ADMINISTRATION', image: '/photos/Pharmacist%20Administering%20a%20Vaccine(1)%20(1).png', scope: ['Routine vaccines', 'Travel vaccines', 'Deployment vaccines'], sends: ['Authorized vaccine', 'Destination / program context', 'Demographics'], returns: ['Administration record', 'Lot / manufacturer', 'Updated vaccine record'] },
];

export default function ClinicalDatabase() {
  const [active, setActive] = useState(0);
  const [scan, setScan] = useState(false);
  const entry = ENTRIES[active];

  const tilt = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    event.currentTarget.style.setProperty('--rx', `${-y * 7}deg`);
    event.currentTarget.style.setProperty('--ry', `${x * 9}deg`);
  };

  const reset = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty('--rx', '0deg');
    event.currentTarget.style.setProperty('--ry', '0deg');
  };

  return (
    <section className={styles.database} data-scan={scan} aria-label="Clinical capability database">
      <div className={styles.bgCode} aria-hidden="true">OCCU-MED // PROVIDER CAPABILITY DATABASE // VERIFIED SERVICE CLASSES</div>
      <header className={styles.head}>
        <div><span>CLINICAL DATABASE</span><h2>Don’t read a service list.<br />Inspect the work.</h2></div>
        <button type="button" className={styles.scanButton} data-active={scan} onClick={() => setScan(value => !value)}>{scan ? 'EXIT PROTOCOL SCAN' : 'PROTOCOL SCAN'}</button>
      </header>

      <div className={styles.deck}>
        {ENTRIES.map((item,index) => (
          <button
            type="button"
            key={item.id}
            className={styles.tile}
            data-active={index===active}
            onClick={() => setActive(index)}
            onPointerMove={tilt}
            onPointerLeave={reset}
          >
            <Image src={item.image} alt={index===active ? item.title : ''} fill sizes="(max-width: 900px) 60vw, 18vw" />
            <div className={styles.tileShade} />
            <span>{item.id}</span>
            <strong>{item.title}</strong>
            <small>{item.label}</small>
          </button>
        ))}
      </div>

      <div className={styles.inspect}>
        <div className={styles.hero}>
          <Image src={entry.image} alt="" fill sizes="45vw" />
          <div className={styles.heroShade} />
          <span>{entry.id}</span>
          <strong>{entry.title}</strong>
        </div>
        <div className={styles.readout}>
          <div className={styles.readoutHead}><span>{entry.label}</span><b>{String(active+1).padStart(2,'0')} / {String(ENTRIES.length).padStart(2,'0')}</b></div>
          <h3>{scan ? 'Protocol decomposition' : 'Typical authorized scope'}</h3>
          <div className={styles.scope}>
            {(scan ? entry.scope : entry.scope).map((item,index)=><span key={item}><i>{String(index+1).padStart(2,'0')}</i>{item}</span>)}
          </div>
          <div className={styles.exchange}>
            <article><small>OCCU-MED SENDS</small>{entry.sends.map(item=><span key={item}>{item}</span>)}</article>
            <article><small>PROVIDER RETURNS</small>{entry.returns.map(item=><span key={item}>{item}</span>)}</article>
          </div>
        </div>
      </div>

      <div className={styles.scanline} aria-hidden="true" />
    </section>
  );
}
