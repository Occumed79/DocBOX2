'use client';

import Image from 'next/image';
import styles from './ProblemScene.module.css';

const FAILURES = [
  ['01', 'Limited context', 'A generic physical can describe health without explaining whether findings matter for the actual job.'],
  ['02', 'Insufficient job information', 'Without essential functions, physical demands, and environmental conditions, the exam is missing part of the question.'],
  ['03', 'Disconnected decision-making', 'Medical evidence, job requirements, and accommodation analysis can end up living in separate systems.'],
] as const;

export default function ProblemScene() {
  return (
    <section className={styles.problem} data-reveal data-scrub>
      <div className={styles.visual}>
        <Image src="/photos/Concerned%20provider.png" alt="Illustration of a concerned occupational medical provider" fill sizes="(max-width: 900px) 100vw, 48vw" />
        <div className={styles.visualShade} />
      </div>

      <div className={styles.stat} aria-label="36 percent of workplace injuries in a five-year claims analysis involved workers in their first year on the job">
        <span>36</span><b>%</b>
        <small>of workplace injuries occurred during a worker&apos;s first year on the job in a five-year analysis of 1.2M claims.</small>
      </div>

      <div className={styles.copy}>
        <span>THE PROBLEM</span>
        <h2>A physical can be<br /><em>medically correct</em><br />and still answer<br />the wrong question.</h2>
      </div>

      <div className={styles.failures}>
        {FAILURES.map(([id, title, copy]) => (
          <article key={id}>
            <span>{id}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>

      <div className={styles.source}>Independent benchmark: Travelers 2025 Injury Impact Report.</div>
    </section>
  );
}
