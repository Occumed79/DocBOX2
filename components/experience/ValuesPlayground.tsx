'use client';

import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
import styles from './ValuesPlayground.module.css';

type ValueKey = 'Humility' | 'Positivity' | 'Customer Service' | 'Quality' | 'Integrity' | 'Diligence';

const VALUES: Record<ValueKey, { index: string; image: string; phrase: string }> = {
  Humility: { index: '01', image: '/photos/Corevalue.png', phrase: 'Make the work larger than the ego.' },
  Positivity: { index: '02', image: '/photos/Corevalue2.png', phrase: 'Create forward motion when a case gets complicated.' },
  'Customer Service': { index: '03', image: '/photos/Corevalue3.png', phrase: 'Keep the provider, examinee, and customer connected.' },
  Quality: { index: '04', image: '/photos/Corevalue4.png', phrase: 'Inspect the details before they become downstream problems.' },
  Integrity: { index: '05', image: '/photos/Corevalue5.png', phrase: 'The record and the decision have to line up.' },
  Diligence: { index: '06', image: '/photos/Corevalue6.png', phrase: 'Follow the case until every required piece is there.' },
};

export default function ValuesPlayground() {
  const [active, setActive] = useState<ValueKey>('Humility');
  const [humility, setHumility] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [service, setService] = useState(0);
  const [lens, setLens] = useState({ x: 50, y: 50 });
  const [integrity, setIntegrity] = useState(50);
  const [checks, setChecks] = useState([false, false, false, false]);
  const lensRef = useRef<HTMLDivElement | null>(null);
  const value = VALUES[active];
  const completion = useMemo(() => checks.filter(Boolean).length, [checks]);

  const onLensMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = lensRef.current?.getBoundingClientRect();
    if (!rect) return;
    setLens({
      x: Math.max(8, Math.min(92, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(8, Math.min(92, ((event.clientY - rect.top) / rect.height) * 100)),
    });
  };

  const toggleCheck = (index: number) => setChecks(previous => previous.map((item, i) => i === index ? !item : item));

  return (
    <section className={styles.playground} aria-label="Occu-Med values interaction playground">
      <header className={styles.head}>
        <div><span>VALUES / NOT A POSTER</span><h2>Six principles.<br />Six different behaviors.</h2></div>
        <p>Each value gets its own interaction. The interface should behave differently because the idea is different.</p>
      </header>

      <div className={styles.valueNav}>
        {(Object.keys(VALUES) as ValueKey[]).map(key => (
          <button type="button" key={key} data-active={active === key} onClick={() => setActive(key)}>
            <span>{VALUES[key].index}</span><strong>{key}</strong>
          </button>
        ))}
      </div>

      <div className={styles.stage} data-value={active.replace(' ', '-').toLowerCase()}>
        <aside className={styles.manifesto}>
          <span>{value.index} / {active.toUpperCase()}</span>
          <h3>{value.phrase}</h3>
          <div className={styles.valueArt}><Image src={value.image} alt="" fill sizes="300px" /></div>
        </aside>

        <div className={styles.experiment}>
          {active === 'Humility' && <div className={styles.humility}>
            <div className={styles.humilityField}>
              <span className={styles.selfWord} style={{ fontSize: `${96 - humility * 0.68}px`, opacity: 1 - humility * 0.007 }}>ME</span>
              <span className={styles.workWord} style={{ fontSize: `${32 + humility * 0.56}px` }}>THE WORK</span>
              <div className={styles.balanceLine} />
            </div>
            <label><span>REDUCE SELF / AMPLIFY WORK</span><input aria-label="Humility balance" type="range" min="0" max="100" value={humility} onChange={event => setHumility(Number(event.target.value))} /></label>
          </div>}

          {active === 'Positivity' && <div className={styles.positivity}>
            <button type="button" onClick={() => setPulse(value => value + 1)} aria-label="Send positive pulse"><i key={pulse} /><strong>CREATE FORWARD MOTION</strong><span>tap to send a pulse through the case</span></button>
            <div className={styles.pulseReadout}>PULSES SENT <b>{String(pulse).padStart(2,'0')}</b></div>
          </div>}

          {active === 'Customer Service' && <div className={styles.service}>
            <div className={styles.serviceNodes}><span>PROVIDER</span><i /><span>OCCU-MED</span><i /><span>CUSTOMER</span></div>
            <div className={styles.serviceLine}><i style={{ left: `${service}%` }} /></div>
            <label><span>MOVE THE CASE BETWEEN PEOPLE</span><input aria-label="Customer service connection" type="range" min="0" max="100" value={service} onChange={event => setService(Number(event.target.value))} /></label>
            <strong>{service < 35 ? 'LISTEN' : service < 70 ? 'COORDINATE' : 'CLOSE THE LOOP'}</strong>
          </div>}

          {active === 'Quality' && <div ref={lensRef} className={styles.quality} onPointerMove={onLensMove}>
            <Image src="/photos/EXAM%20REPORT.png" alt="Medical report under quality inspection" fill sizes="620px" />
            <div className={styles.qualityShade} />
            <div className={styles.lens} style={{ left: `${lens.x}%`, top: `${lens.y}%`, backgroundPosition: `${360 - lens.x * 5.4}px ${270 - lens.y * 4.4}px` }}><span>QA</span></div>
            <div className={styles.qualityLabel}>MOVE THE INSPECTION LENS</div>
          </div>}

          {active === 'Integrity' && <div className={styles.integrity}>
            <div className={styles.integrityGrid}>
              <article style={{ transform: `translateX(${(integrity - 50) * 0.35}px)` }}><span>THE RECORD</span><strong>DOCUMENTED FINDINGS</strong></article>
              <article style={{ transform: `translateX(${(50 - integrity) * 0.35}px)` }}><span>THE DECISION</span><strong>JOB-COMPATIBILITY REVIEW</strong></article>
            </div>
            <div className={styles.integrityNeedle}><i style={{ left: `${integrity}%` }} /></div>
            <label><span>ALIGN EVIDENCE WITH DECISION</span><input aria-label="Integrity alignment" type="range" min="0" max="100" value={integrity} onChange={event => setIntegrity(Number(event.target.value))} /></label>
            <b>{Math.abs(integrity - 50) <= 4 ? 'ALIGNED' : integrity < 50 ? 'RECORD OUT OF BALANCE' : 'DECISION OUT OF BALANCE'}</b>
          </div>}

          {active === 'Diligence' && <div className={styles.diligence}>
            <div className={styles.checkPath}>
              {['REPORT','RESULTS','CORRECTIONS','FINAL REVIEW'].map((item,index) => <button type="button" key={item} data-complete={checks[index]} onClick={() => toggleCheck(index)}><i>{checks[index] ? '✓' : String(index+1).padStart(2,'0')}</i><span>{item}</span></button>)}
            </div>
            <div className={styles.diligenceProgress}><i style={{ width: `${completion / 4 * 100}%` }} /></div>
            <strong>{completion === 4 ? 'CASE COMPLETE' : `${4 - completion} REQUIRED PIECE${4 - completion === 1 ? '' : 'S'} REMAIN`}</strong>
          </div>}
        </div>
      </div>
    </section>
  );
}
