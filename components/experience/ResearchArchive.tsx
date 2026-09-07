'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import milestoneStyles from './ResearchArchiveMilestones.module.css';
import styles from './ResearchArchive.module.css';

const GOALS = [
  ['01', 'Safe performance', 'Determine whether a worker can safely perform the essential functions of a specific job.'],
  ['02', 'Injury-cost reduction', 'Use better employment medical standards to reduce preventable workforce injury costs.'],
  ['03', 'Defensible accommodation', 'Create a medically appropriate and legally defensible framework for reasonable accommodation decisions.'],
] as const;

const SYSTEMS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));

export default function ResearchArchive() {
  return (
    <section className={styles.archive} data-reveal data-scrub>
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.frame}>
        <div className={styles.originLayer}>
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
            Public archival records describe the later Occu-Med methodology as growing from this research and a broader California advisory effort.
          </div>
        </div>

        <div className={styles.guidelinesLayer}>
          <div className={styles.guidelinesCopy}>
            <span>THE RESEARCH MATURES</span>
            <h2>One research program becomes<br /><em>a living medical framework.</em></h2>
            <p>
              Later public records describe specialists and subspecialists representing <strong>12 separate body systems</strong>
              helping formulate Occu-Med&apos;s Compendium of Medical Standards. Continuing research meetings reviewed and revised
              that body of work as it evolved into what the company termed its Medical Guidelines.
            </p>
          </div>

          <div className={styles.systemField} aria-label="Twelve body-system research groups converging into the Medical Guidelines">
            <div className={styles.systemOrbit} aria-hidden="true" />
            {SYSTEMS.map((system, index) => (
              <span key={system} className={styles.systemNode} style={{ '--system-index': index } as CSSProperties}>
                <i>{system}</i>
              </span>
            ))}
            <div className={styles.compendium}>
              <small>RESEARCH-BASED / PROPRIETARY</small>
              <b>COMPENDIUM<br />OF MEDICAL<br />STANDARDS</b>
              <span>↓</span>
              <strong>MEDICAL GUIDELINES</strong>
            </div>
          </div>

          <div className={`${styles.growthMarkers} ${milestoneStyles.three}`}>
            <article>
              <span>1980</span>
              <p>Comprehensive employment medical standards are already being used alongside formal position physical-effort analyses.</p>
            </article>
            <article>
              <span>1994</span>
              <p>An archival description shows a national system using quantified job profiles, including 19 physical-ability categories, with specialist medical input.</p>
            </article>
            <article>
              <span>2013</span>
              <p>Public records show a mature EXAMQA / QA2 operating system and a distributed U.S. footprint centered on Fresno.</p>
            </article>
          </div>

          <div className={styles.guidelinesEvidence}>
            <span>12</span>
            <p><b>separate body systems</b><br />specialist and subspecialist research described in public Occu-Med records</p>
          </div>

          <div className={styles.guidelinesFoot}>
            Archival milestones describe the historical system; they are not presented as testimonials. No patent claim is implied. Public records describe a proprietary, research-based methodology and an evolving body of medical guidance.
          </div>
        </div>
      </div>
    </section>
  );
}
