'use client';

import Image from 'next/image';
import styles from './ResearchArchive.module.css';

const GOALS = [
  ['01', 'Safe performance', 'Determine whether a worker can safely perform the essential functions of a specific job.'],
  ['02', 'Injury-cost reduction', 'Use better employment medical standards to reduce preventable workforce injury costs.'],
  ['03', 'Defensible accommodation', 'Create a medically appropriate and legally defensible framework for reasonable accommodation decisions.'],
] as const;

export default function ResearchArchive() {
  return (
    <section className={styles.archive} data-reveal data-scrub>
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.frame}>
        <div className={styles.kicker}>ARCHIVAL RECORD / 1976</div>
        <div className={styles.year} aria-hidden="true">1976</div>

        <div className={styles.copy}>
          <h2>The company starts<br /><em>before the company.</em></h2>
          <p>
            A federally funded research project set out to improve physical and medical standards for employment.
            The work centered on a problem Occu-Med would keep refining for decades: a medical finding only becomes useful
            when it is interpreted against the actual job.
          </p>
          <div className={styles.evidenceLine}>
            <span>$2M+</span>
            <small>cash and in-kind support described in the public archival record</small>
          </div>
        </div>

        <div className={styles.document} aria-label="Research objectives">
          <div className={styles.paperTop}>
            <span>RESEARCH OBJECTIVES</span>
            <b>Improved physical &amp; medical standards for employment</b>
          </div>
          <div className={styles.goalList}>
            {GOALS.map(([id, title, copy]) => (
              <article key={id}>
                <span>{id}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.scan} aria-hidden="true" />
        </div>

        <div className={styles.mapFloat} aria-hidden="true">
          <Image src="/photos/California%20-%20Hawaii%20Map.png" alt="" fill sizes="360px" />
        </div>

        <div className={styles.footerNote}>
          Public archival source describes the methodology as originating in this research and later expanding through a broader California public-sector advisory effort.
        </div>
      </div>
    </section>
  );
}
