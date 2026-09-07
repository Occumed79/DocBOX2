'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ImmersiveArchive.module.css';

type Theme = 'All' | 'Research' | 'Method' | 'Scale';

type Artifact = {
  year: string;
  theme: Exclude<Theme, 'All'>;
  eyebrow: string;
  title: string;
  body: string;
  datum: string;
  image: string;
  alt: string;
};

const ARTIFACTS: Artifact[] = [
  {
    year: '1976',
    theme: 'Research',
    eyebrow: 'THE QUESTION BEFORE THE COMPANY',
    title: 'How do you judge fitness for a real job without reducing the person to a generic physical?',
    body: 'A federally funded employment-standards project brought job demands, medical findings, injury cost, disability rights, and defensible decision-making into the same research problem.',
    datum: '$2M+ cash / in-kind research support documented in later procurement records',
    image: '/photos/Concerned%20provider.png',
    alt: 'Provider considering an occupational-health problem',
  },
  {
    year: '1979',
    theme: 'Research',
    eyebrow: 'RESEARCH → COMPANY',
    title: 'Occu-Med is founded in Honolulu to operationalize the work.',
    body: 'The company begins as a research and consulting organization focused on workforce health, safety, and medically appropriate employment standards.',
    datum: 'Honolulu, Hawaii',
    image: '/photos/California%20-%20Hawaii%20Map.png',
    alt: 'California and Hawaii map artwork',
  },
  {
    year: '1980',
    theme: 'Method',
    eyebrow: 'STANDARDS ENTER OPERATIONS',
    title: 'Medical standards are paired with position-specific physical-effort analysis.',
    body: 'Archival civil-rights findings document comprehensive employment medical standards being used together with analyses of the physical effort required by positions.',
    datum: 'Job demand + medical standard, used together',
    image: '/photos/EMPLOYEE%20ID.png',
    alt: 'Employee identification document artwork',
  },
  {
    year: '12 SYSTEMS',
    theme: 'Method',
    eyebrow: 'SPECIALIST RESEARCH',
    title: 'A body of specialist standards becomes a repeatable medical reference system.',
    body: 'Procurement records describe research across twelve separate body systems, forming a Compendium of Medical Standards and later Medical Guidelines.',
    datum: '12 body systems → Compendium → Medical Guidelines',
    image: '/photos/EXAM%20REPORT.png',
    alt: 'Medical examination report artwork',
  },
  {
    year: 'EXAMQA',
    theme: 'Method',
    eyebrow: 'THE OPERATING MODEL',
    title: 'The research becomes a three-dimensional compatibility method.',
    body: 'Valid job information, a job-related medical examination, and a compatibility assessment are treated as one connected evaluation system rather than isolated steps.',
    datum: 'Job information × medical evidence × compatibility',
    image: '/photos/Fitness%20Determination.png',
    alt: 'Fitness determination artwork',
  },
  {
    year: '2006',
    theme: 'Scale',
    eyebrow: 'THE STANDARD TRAVELS',
    title: 'Occu-Med begins serving international markets.',
    body: 'The operating model expands beyond a domestic network into deployment and international medical-readiness work while preserving a consistent review process.',
    datum: 'International markets begin',
    image: '/photos/International%20Certification.png',
    alt: 'International certification artwork',
  },
  {
    year: '2016',
    theme: 'Scale',
    eyebrow: 'GLOBAL INFRASTRUCTURE',
    title: 'A contemporary profile describes examination infrastructure in more than 36 countries.',
    body: 'The organization is no longer just a specialist consultancy. It is coordinating a distributed provider infrastructure across national borders.',
    datum: '36+ countries documented in 2016 profile',
    image: '/photos/Facilities.png',
    alt: 'Healthcare facilities artwork',
  },
  {
    year: 'TODAY',
    theme: 'Scale',
    eyebrow: 'ONE CONNECTED NETWORK',
    title: 'The system now spans more than 15,000 provider locations worldwide.',
    body: 'Occu-Med describes coverage across all 50 states, U.S. territories, and more than 50 countries, supporting more than one million employees.',
    datum: '15,000+ locations · 50+ countries · 1M+ employees',
    image: '/photos/International%20Network.png',
    alt: 'Global provider network artwork',
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function ImmersiveArchive() {
  const [theme, setTheme] = useState<Theme>('All');
  const [active, setActive] = useState(0);
  const shellRef = useRef<HTMLElement | null>(null);
  const dragStart = useRef<number | null>(null);
  const dragOrigin = useRef(0);
  const wheelLock = useRef(0);

  const artifacts = useMemo(() => theme === 'All' ? ARTIFACTS : ARTIFACTS.filter(item => item.theme === theme), [theme]);

  useEffect(() => {
    setActive(0);
  }, [theme]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!shellRef.current) return;
      const rect = shellRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      if (event.key === 'ArrowRight') setActive(current => clamp(current + 1, 0, artifacts.length - 1));
      if (event.key === 'ArrowLeft') setActive(current => clamp(current - 1, 0, artifacts.length - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [artifacts.length]);

  const onWheel = (event: React.WheelEvent) => {
    const now = performance.now();
    if (now - wheelLock.current < 280 || Math.abs(event.deltaY) < 12) return;
    wheelLock.current = now;
    setActive(current => clamp(current + (event.deltaY > 0 ? 1 : -1), 0, artifacts.length - 1));
  };

  const onPointerDown = (event: React.PointerEvent) => {
    dragStart.current = event.clientX;
    dragOrigin.current = active;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const delta = event.clientX - dragStart.current;
    if (Math.abs(delta) < 70) return;
    const shift = Math.round(-delta / 170);
    setActive(clamp(dragOrigin.current + shift, 0, artifacts.length - 1));
  };

  const onPointerUp = (event: React.PointerEvent) => {
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <section ref={shellRef} className={styles.archive} aria-label="Occu-Med history exhibition" onWheel={onWheel}>
      <div className={styles.sky} aria-hidden="true" />
      <div className={styles.scan} aria-hidden="true" />

      <header className={styles.header}>
        <div>
          <span>OCCU-MED / ARCHIVE EXHIBITION</span>
          <h2>Walk through the research,<br />not a stack of slides.</h2>
        </div>
        <p>Drag, scroll, use the arrow keys, or choose a year. Every object is built from Occu-Med history and source artwork.</p>
      </header>

      <nav className={styles.filters} aria-label="Filter archive">
        {(['All', 'Research', 'Method', 'Scale'] as Theme[]).map(item => (
          <button key={item} type="button" onClick={() => setTheme(item)} data-active={theme === item}>{item}</button>
        ))}
      </nav>

      <div className={styles.viewport} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <div className={styles.floor} aria-hidden="true" />
        <div className={styles.rail} aria-hidden="true" />
        <div className={styles.world} style={{ '--active': active } as React.CSSProperties}>
          {artifacts.map((item, index) => {
            const offset = index - active;
            return (
              <article
                key={`${item.year}-${item.title}`}
                className={styles.artifact}
                data-active={index === active}
                data-past={offset < 0}
                style={{ '--offset': offset, '--distance': Math.abs(offset) } as React.CSSProperties}
                onClick={() => setActive(index)}
              >
                <div className={styles.objectFrame}>
                  <Image src={item.image} alt={index === active ? item.alt : ''} fill sizes="(max-width: 900px) 78vw, 44vw" priority={index < 2} />
                  <div className={styles.objectGlass} />
                  <span className={styles.objectYear}>{item.year}</span>
                  <span className={styles.objectTheme}>{item.theme}</span>
                </div>
                <div className={styles.caption}>
                  <small>{item.eyebrow}</small>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <strong>{item.datum}</strong>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className={styles.timeline}>
        <button type="button" className={styles.arrow} onClick={() => setActive(current => clamp(current - 1, 0, artifacts.length - 1))} disabled={active === 0} aria-label="Previous archive object">←</button>
        <div className={styles.years}>
          {artifacts.map((item, index) => (
            <button key={`${item.year}-nav`} type="button" onClick={() => setActive(index)} data-active={index === active}>
              <i />
              <span>{item.year}</span>
            </button>
          ))}
        </div>
        <button type="button" className={styles.arrow} onClick={() => setActive(current => clamp(current + 1, 0, artifacts.length - 1))} disabled={active === artifacts.length - 1} aria-label="Next archive object">→</button>
      </div>

      <div className={styles.counter}>{String(active + 1).padStart(2, '0')} / {String(artifacts.length).padStart(2, '0')}</div>
    </section>
  );
}
