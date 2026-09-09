'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import styles from './HistoryExperience.module.css';

const P = '/photos/';

const MILESTONES = [
  {
    id: 'research-1979',
    year: '1979',
    title: 'The critical discovery.',
    copy: 'The company story begins with occupational-health research focused on a basic problem: medical information cannot be interpreted responsibly without understanding the work the person is expected to perform.',
    evidence: '1979',
    evidenceLabel: 'research origin in the supplied company history',
    image: 'Founders copy.png',
  },
  {
    id: 'founding-1979',
    year: '1979',
    title: 'Founded in Honolulu.',
    copy: 'Attorney Jim A. Johnson and Dr. Devonna M. Kaji established Occu-Med around the intersection of medicine, legal requirements, and job-specific information.',
    evidence: 'HONOLULU',
    evidenceLabel: 'original operating base',
    image: 'Founders.png',
  },
  {
    id: 'continuity-2000',
    year: '2000',
    title: 'The operating model formalizes.',
    copy: 'After two decades of occupational-health work, the organization entered a new corporate phase while preserving the method built around job information, examination evidence, and compatibility review.',
    evidence: '20+ YRS',
    evidenceLabel: 'operating experience before incorporation',
    image: 'California - Hawaii Map.png',
  },
  {
    id: 'examqa',
    year: '2003',
    title: 'Quality becomes a system.',
    copy: 'The examination process matured into a repeatable workflow for authorizations, case packets, returned records, quality review, corrections, and medical evaluation rather than a one-off clinic visit.',
    evidence: 'EXAMQA',
    evidenceLabel: 'structured examination-quality workflow',
    image: 'EXAM REPORT.png',
  },
  {
    id: 'international-2006',
    year: '2006',
    title: 'The method moves internationally.',
    copy: 'Occu-Med expanded the same job-centered approach into international and deployment-related work, where destination requirements and occupational standards had to be coordinated together.',
    evidence: 'GLOBAL',
    evidenceLabel: 'international operating expansion',
    image: 'International Certification.png',
  },
  {
    id: 'federal-2007',
    year: '2007',
    title: 'Federal mission support expands.',
    copy: 'Federal-contractor registration opened a broader path for direct government and defense-mission support while keeping the clinical provider focused on findings rather than employment decisions.',
    evidence: 'FEDERAL',
    evidenceLabel: 'government-mission operating phase',
    image: 'Diverse Workforce.png',
  },
  {
    id: 'infrastructure-2017',
    year: '2017',
    title: 'Infrastructure becomes global.',
    copy: 'International mission work demonstrated the value of a coordinated network, repeatable deployment examinations, trained operating teams, and a centralized quality process at scale.',
    evidence: '50+ COUNTRIES',
    evidenceLabel: 'network reach described in supplied materials',
    image: 'International Network.png',
  },
  {
    id: 'impact-2017',
    year: '2017',
    title: 'The system produces measurable impact.',
    copy: 'The company story ties its operating model to measurable reductions in avoidable medical and workforce disruption by connecting the job, the examination, and the review process.',
    evidence: '41%',
    evidenceLabel: 'first-year injury figure presented in supplied materials',
    image: 'Facilities.png',
  },
  {
    id: 'leadership-2018',
    year: '2018',
    title: 'Leadership begins to transition.',
    copy: 'A new generation of operational leadership took on greater responsibility while the company continued expanding its provider infrastructure and examination programs.',
    evidence: 'NEXT',
    evidenceLabel: 'leadership transition phase',
    image: 'Diverse Healthcare Team Portrait (1).png',
  },
  {
    id: 'leadership-2021',
    year: '2021',
    title: 'Continuity becomes the next chapter.',
    copy: 'The leadership transition continued while the original operating principles—job relevance, clinical quality, provider coordination, and defensible review—remained the connective tissue.',
    evidence: 'CONTINUITY',
    evidenceLabel: 'operating model carried forward',
    image: 'Diverse Workforce2.png',
  },
  {
    id: 'today',
    year: 'TODAY',
    title: 'One connected provider network.',
    copy: 'The same question that began the company now travels through a worldwide medical and dental network: what does this person need to do the job safely, and what evidence is required to answer that question?',
    evidence: '15,000+',
    evidenceLabel: 'medical and dental locations described in supplied materials',
    image: 'International Network.png',
  },
] as const;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export default function HistoryExperience() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const [trackDistance, setTrackDistance] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;

    const measure = () => {
      const width = window.innerWidth;
      const card = Math.min(width * .58, 760);
      const gap = width * .05;
      setTrackDistance((card + gap) * (MILESTONES.length - 1));
    };

    const update = () => {
      frame = 0;
      if (window.innerWidth <= 820) return;
      const rect = root.getBoundingClientRect();
      const travel = Math.max(root.offsetHeight - window.innerHeight, 1);
      const next = clamp(-rect.top / travel);
      setProgress(next);
      setActive(Math.min(MILESTONES.length - 1, Math.round(next * (MILESTONES.length - 1))));
    };

    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const onResize = () => {
      measure();
      queue();
    };

    measure();
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', onResize);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const duplicatedTicker = useMemo(() => {
    const items = ['1979 ORIGIN', 'HONOLULU', 'EXAMQA', 'GLOBAL NETWORK', '50+ COUNTRIES', '15,000+ LOCATIONS', 'ONE OPERATING MODEL'];
    return [...items, ...items];
  }, []);

  const jumpTo = (index: number) => {
    const root = rootRef.current;
    if (!root) return;
    if (window.innerWidth <= 820) {
      document.getElementById(`history-${MILESTONES[index].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActive(index);
      return;
    }
    const travel = Math.max(root.offsetHeight - window.innerHeight, 1);
    const target = root.getBoundingClientRect().top + window.scrollY + (index / (MILESTONES.length - 1)) * travel;
    window.scrollTo({ top: target, behavior: 'smooth' });
  };

  return (
    <main
      ref={rootRef}
      className={styles.root}
      style={{ '--history-progress': progress.toFixed(4) } as CSSProperties}
    >
      <section className={styles.stage} aria-label="Occu-Med history archive">
        <header className={styles.header}>
          <a className={styles.brand} href="/experience#provider-portals">OCCU-MED / HISTORY ARCHIVE</a>
          <div className={styles.progress} aria-label={`${Math.round(progress * 100)} percent through company history`}>
            <i />
            <span>{String(active + 1).padStart(2, '0')} / {MILESTONES.length}</span>
          </div>
        </header>

        <div className={styles.backdrop} aria-hidden="true">
          {MILESTONES.map((milestone, index) => (
            <figure key={`${milestone.id}-image`} data-active={index === active}>
              <Image src={`${P}${encodeURIComponent(milestone.image)}`} alt="" fill sizes="70vw" priority={index < 2} />
            </figure>
          ))}
        </div>

        <div className={styles.kicker}>
          <span>PORTAL 01 / ANNIVERSARY EXHIBITION</span>
          <h1>History you<br />move through.</h1>
          <p>Scroll across the eras or choose a year directly. The archive keeps the active evidence, artwork, and chronology connected in one spatial stage.</p>
        </div>

        <nav className={styles.nav} aria-label="History eras">
          {MILESTONES.map((milestone, index) => (
            <button key={milestone.id} type="button" data-active={index === active} onClick={() => jumpTo(index)}>
              {milestone.year}
            </button>
          ))}
        </nav>

        <div className={styles.trackViewport}>
          <div className={styles.track} style={{ transform: `translate3d(${-progress * trackDistance}px, 0, 0)` }}>
            {MILESTONES.map((milestone, index) => (
              <article id={`history-${milestone.id}`} className={styles.milestone} data-active={index === active} key={milestone.id}>
                <b className={styles.year}>{milestone.year}</b>
                <div>
                  <h2>{milestone.title}</h2>
                  <p>{milestone.copy}</p>
                  <div className={styles.evidence}>
                    <b>{milestone.evidence}</b>
                    <small>{milestone.evidenceLabel}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.ticker} aria-hidden="true">
          <div>{duplicatedTicker.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
        </div>
      </section>
    </main>
  );
}
