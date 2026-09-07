'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './ProviderExperience.module.css';

const HISTORY = [
  {
    year: '1979',
    title: 'A research-and-consulting company is born in Honolulu.',
    copy: 'Occu-Med begins with a narrow problem: generic medical exams do not explain whether a person can safely perform a specific job. The early business focuses on research, consulting, and workforce health-and-safety cost reduction.',
  },
  {
    year: '1980s–1990s',
    title: 'The methodology becomes an operating system.',
    copy: 'The work expands beyond research into job analysis, occupational medical clinic management, workers’ compensation cost containment, vocational rehabilitation, and medically appropriate, legally defensible employment evaluations.',
  },
  {
    year: '2006',
    title: 'The model goes international.',
    copy: 'Occu-Med begins serving international markets, extending a standardized evaluation system beyond a single geography and into deployment-focused medical readiness.',
  },
  {
    year: '2016',
    title: 'Global infrastructure becomes visible.',
    copy: 'A contemporary profile describes examination infrastructure spanning more than 36 countries, reflecting the transition from a specialist consultancy into a global coordination platform.',
  },
  {
    year: 'TODAY',
    title: 'A network measured in thousands of locations.',
    copy: 'Occu-Med now describes a worldwide network of more than 15,000 provider locations supporting more than one million employees across the United States, its territories, and 50+ countries abroad.',
  },
];

const PROCESS = [
  ['01', 'Referral', 'The employer request enters Occu-Med’s system.'],
  ['02', 'Scheduling', 'Availability is coordinated with the examinee and clinic.'],
  ['03', 'Clinic', 'The authorized exam packet and requested services reach the provider.'],
  ['04', 'Exam', 'The provider performs the requested evaluation and documents findings.'],
  ['05', 'Records', 'Provider Relations follows the case until required results are received.'],
  ['06', 'QA', 'Documentation is checked for completeness and accuracy.'],
  ['07', 'Review', 'Medical findings are interpreted against the applicable job and deployment requirements.'],
];

export default function ProviderExperience() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [activeHistory, setActiveHistory] = useState(0);
  const [activeProcess, setActiveProcess] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.dataset.visible = 'true';
        });
      },
      { threshold: 0.22 }
    );

    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const updateTilt = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty('--rx', `${-y * 7}deg`);
    event.currentTarget.style.setProperty('--ry', `${x * 9}deg`);
  };

  const resetTilt = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--rx', '0deg');
    event.currentTarget.style.setProperty('--ry', '0deg');
  };

  return (
    <main ref={rootRef} className={styles.root}>
      <section className={styles.threshold} data-reveal>
        <Image className={styles.thresholdArt} src="/docbox-landing.png" alt="" fill priority sizes="100vw" />
        <div className={styles.thresholdShade} />
        <div className={styles.thresholdCopy}>
          <span>OCCU-MED / PROVIDER EXPERIENCE</span>
          <h1>Before the network,<br />there was a question.</h1>
          <p>What happens when a medical exam is asked to answer a job-specific question without job-specific context?</p>
          <a href="#history">Enter the story <b>↓</b></a>
        </div>
      </section>

      <section id="history" className={styles.history} data-reveal>
        <div className={styles.historyIntro}>
          <span>COMPANY HISTORY</span>
          <h2>Not a timeline.<br /><em>An evolution.</em></h2>
          <p>The company story is built around how the system changed: research became methodology, methodology became operations, and operations became a global network.</p>
        </div>

        <div className={styles.historyStage}>
          <div className={styles.historyYears}>
            {HISTORY.map((item, index) => (
              <button
                type="button"
                key={item.year}
                onClick={() => setActiveHistory(index)}
                className={index === activeHistory ? styles.activeYear : ''}
              >
                <span>{item.year}</span>
                <small>{String(index + 1).padStart(2, '0')}</small>
              </button>
            ))}
          </div>

          <div className={styles.historyContent}>
            <div className={styles.historyNumber}>{HISTORY[activeHistory].year}</div>
            <div className={styles.historyCard}>
              <span>CHAPTER {String(activeHistory + 1).padStart(2, '0')}</span>
              <h3>{HISTORY[activeHistory].title}</h3>
              <p>{HISTORY[activeHistory].copy}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.method} data-reveal>
        <div className={styles.methodCopy}>
          <span>THE PROPRIETARY MODEL</span>
          <h2>Three dimensions.<br /><em>One decision.</em></h2>
          <p>The point was never to invent another physical. It was to connect three things that ordinary exams often separate.</p>
        </div>
        <div className={styles.orbit} onPointerMove={updateTilt} onPointerLeave={resetTilt}>
          <div className={styles.orbitRingA} />
          <div className={styles.orbitRingB} />
          <div className={styles.core}>OCCU-MED</div>
          <div className={`${styles.orbitNode} ${styles.nodeJob}`}><b>01</b><strong>Valid Job Information</strong><span>Physical, cognitive, and environmental demands.</span></div>
          <div className={`${styles.orbitNode} ${styles.nodeMedical}`}><b>02</b><strong>Job-Related Medical Exam</strong><span>Testing aligned to actual essential functions.</span></div>
          <div className={`${styles.orbitNode} ${styles.nodeLegal}`}><b>03</b><strong>Compatibility Assessment</strong><span>Medical findings interpreted with legal and job context.</span></div>
        </div>
      </section>

      <section className={styles.process} data-reveal>
        <div className={styles.processLead}>
          <span>HOW THE SYSTEM MOVES</span>
          <h2>Follow one referral<br /><em>through Occu-Med.</em></h2>
        </div>

        <div className={styles.processStage}>
          <div className={styles.processRail}>
            {PROCESS.map((item, index) => (
              <button
                type="button"
                key={item[0]}
                onClick={() => setActiveProcess(index)}
                className={index === activeProcess ? styles.processActive : ''}
              >
                <span>{item[0]}</span>
                <strong>{item[1]}</strong>
              </button>
            ))}
          </div>
          <div className={styles.processVisual}>
            <div className={styles.packet}>
              <small>OCCU-MED</small>
              <b>{PROCESS[activeProcess][0]}</b>
              <strong>{PROCESS[activeProcess][1]}</strong>
              <p>{PROCESS[activeProcess][2]}</p>
            </div>
            <div className={styles.signalA} />
            <div className={styles.signalB} />
            <div className={styles.signalC} />
          </div>
        </div>
      </section>

      <section className={styles.scale} data-reveal>
        <div className={styles.scaleGlow} />
        <div className={styles.scaleCopy}>
          <span>GLOBAL INFRASTRUCTURE</span>
          <h2><b>15,000+</b><br />provider locations.</h2>
          <p>All 50 states, U.S. territories, and 50+ countries abroad — one network coordinated through a consistent operating model.</p>
        </div>
        <div className={styles.constellation} aria-hidden="true">
          {Array.from({ length: 34 }, (_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties} />)}
        </div>
      </section>

      <section className={styles.handoff} data-reveal>
        <span>YOUR FACILITY</span>
        <h2>The spectacle ends here.<br /><em>The useful part begins.</em></h2>
        <p>From this point forward, the site becomes quieter and specific to the provider: specialty, services, documentation, payment terms, FAQs, locations, and the pricing agreement.</p>
        <button type="button">Begin provider onboarding →</button>
      </section>
    </main>
  );
}
