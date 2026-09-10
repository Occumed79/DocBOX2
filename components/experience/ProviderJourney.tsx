'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import CinematicWorld from './immersive/CinematicWorld';
import PortalOrbitalNav from './immersive/PortalOrbitalNav';
import styles from './ProviderJourney.module.css';

const P = '/photos/';

type StoryMode = 'hero' | 'split' | 'lab' | 'editorial' | 'service' | 'report' | 'result' | 'workforce' | 'deployment' | 'network' | 'values';

type StoryScene = {
  chapter: string;
  title: string;
  body: string;
  images: readonly string[];
  mode: StoryMode;
  signal: string;
  signalLabel: string;
  annotation: string;
};

const STORY: readonly StoryScene[] = [
  {
    chapter: '01 / ORIGIN',
    title: 'A different answer, since 1979.',
    body: 'Founded in Honolulu by attorney Jim A. Johnson and Dr. Devonna M. Kaji, Occu-Med began with one conviction: a medical finding only becomes useful when it is understood in the context of the job.',
    images: ['Founders.png', 'Founders copy.png', 'California - Hawaii Map.png'],
    mode: 'hero',
    signal: '1979',
    signalLabel: 'Honolulu / origin',
    annotation: 'Job context changes the meaning of medical evidence.',
  },
  {
    chapter: '02 / THE PROBLEM',
    title: 'Healthy is not the same as ready.',
    body: 'Traditional examinations gave physicians too little information about the work itself. Occu-Med connected medical evidence, legal requirements, and essential job demands.',
    images: ['Concerned provider.png'],
    mode: 'split',
    signal: '≠',
    signalLabel: 'healthy / job-ready',
    annotation: 'The examination is only one part of the decision.',
  },
  {
    chapter: '03 / THE METHOD',
    title: 'Three dimensions. One defensible decision.',
    body: 'Valid job information. A job-related medical examination. A compatibility assessment performed by specialists and subject-matter experts.',
    images: ['EMPLOYEE ID.png', 'Diverse Healthcare Team Portrait (1).png'],
    mode: 'lab',
    signal: '03',
    signalLabel: 'connected dimensions',
    annotation: 'JOB + EXAM + COMPATIBILITY',
  },
  {
    chapter: '04 / REFERRAL',
    title: 'One referral enters the system.',
    body: 'Scheduling connects the examinee and clinic, confirms availability, and delivers an authorization and exam packet before the appointment.',
    images: ['Friendly Medical Appointment Call.png'],
    mode: 'editorial',
    signal: '01',
    signalLabel: 'authorized referral',
    annotation: 'A single request becomes a coordinated clinical workflow.',
  },
  {
    chapter: '05 / CLINICAL SERVICES',
    title: 'The service changes. The standard does not.',
    body: 'Physical examinations, laboratory collection, dental readiness, audiometry, and vaccination are coordinated around the exact authorized scope.',
    images: ['Medical Eval.png', 'Calm Clinic Blood Draw (1).png', 'Dental Eval.png', 'Audiometry.png', 'Pharmacist Administering a Vaccine(1) (1).png'],
    mode: 'service',
    signal: '05',
    signalLabel: 'clinical disciplines',
    annotation: 'Every service is attached to the same authorization logic.',
  },
  {
    chapter: '06 / DOCUMENTATION',
    title: 'Every result comes back into focus.',
    body: 'Provider Relations follows the case until records arrive. Quality Assurance checks each report for completeness and accuracy.',
    images: ['EXAM REPORT.png'],
    mode: 'report',
    signal: 'QA',
    signalLabel: 'documentation control',
    annotation: 'Complete. Legible. Correct. Returned.',
  },
  {
    chapter: '07 / DETERMINATION',
    title: 'Evidence becomes an outcome.',
    body: 'Medical Review evaluates findings against the job classification and applicable guidelines. The employer receives the outcome—never the confidential medical detail.',
    images: ['Fitness Determination.png'],
    mode: 'result',
    signal: '→',
    signalLabel: 'evidence / outcome',
    annotation: 'The provider documents findings. Occu-Med performs the review.',
  },
  {
    chapter: '08 / THE WORK',
    title: 'Different work creates different demands.',
    body: 'From public safety to construction, energy, education, government, and deployment, the job remains central to the medical question.',
    images: ['Diverse Workforce.png', 'Diverse Workforce2.png'],
    mode: 'workforce',
    signal: '∞',
    signalLabel: 'different job demands',
    annotation: 'The job—not a generic physical—is the reference point.',
  },
  {
    chapter: '09 / DEPLOYMENT',
    title: 'Readiness has no single border.',
    body: 'Deployment standards, medical clearances, immunization schedules, and destination requirements are coordinated as one connected readiness process.',
    images: ['International Certification.png', 'Vaccine Schedule.png'],
    mode: 'deployment',
    signal: 'GLOBAL',
    signalLabel: 'destination readiness',
    annotation: 'Standards travel with the assignment.',
  },
  {
    chapter: '10 / THE NETWORK',
    title: 'One operating model. Thousands of locations.',
    body: 'A worldwide medical and dental network gives every referral a place to land—stateside or abroad.',
    images: ['Facilities.png', 'International Network.png'],
    mode: 'network',
    signal: '23,524',
    signalLabel: 'valid mapped coordinates',
    annotation: 'A referral can enter the same operating model from thousands of points.',
  },
  {
    chapter: '11 / VALUES',
    title: 'The standard is how we work.',
    body: 'Humility. Positivity. Customer service. Quality. Integrity. Diligence.',
    images: ['Corevalue.png', 'Corevalue2.png', 'Corevalue3.png', 'Corevalue4.png', 'Corevalue5.png', 'Corevalue6.png'],
    mode: 'values',
    signal: '06',
    signalLabel: 'core values',
    annotation: 'The operating model ends where the culture begins.',
  },
];

const PORTALS = [
  { id: 'history', href: '/experience/history', number: '01', title: 'Company history', note: 'From Honolulu to a global medical network', tone: 'gold' },
  { id: 'network', href: '/experience/network', number: '02', title: 'Explore the network', note: '23,524 anonymized mapped facilities', tone: 'cyan' },
  { id: 'resources', href: '/experience/resources', number: '03', title: 'Provider resources', note: 'Guidance organized around your specialty', tone: 'violet' },
  { id: 'questions', href: '/experience/questions', number: '04', title: 'Provider Q&A', note: 'Clear answers before the first referral', tone: 'blue' },
  { id: 'agreement', href: '/experience/agreement', number: '05', title: 'Service agreement', note: 'Build and submit your pricing proposal', tone: 'white' },
] as const;

export default function ProviderJourney() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-scene]'));
    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const viewport = Math.max(window.innerHeight, 1);
      const pageTravel = Math.max(root.scrollHeight - viewport, 1);
      root.style.setProperty('--journey-progress', Math.max(0, Math.min(1, window.scrollY / pageTravel)).toFixed(4));
      let nearest = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      scenes.forEach((scene, index) => {
        const rect = scene.getBoundingClientRect();
        const travel = Math.max(rect.height - viewport, viewport * .35);
        const progress = Math.max(0, Math.min(1, (viewport * .5 - rect.top) / travel));
        const distance = Math.abs(rect.top + rect.height * .5 - viewport * .5);
        scene.style.setProperty('--scene-progress', progress.toFixed(4));
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = index;
        }
      });
      setActiveScene(nearest);
    };
    const queueProgress = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };
    updateProgress();
    window.addEventListener('scroll', queueProgress, { passive: true });
    window.addEventListener('resize', queueProgress);

    return () => {
      window.removeEventListener('scroll', queueProgress);
      window.removeEventListener('resize', queueProgress);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main ref={rootRef} className={styles.root}>
      <CinematicWorld sceneIndex={activeScene} />

      <section className={styles.prologue}>
        <div className={styles.prologueObject} aria-hidden="true">
          <Image src={`${P}Founders.png`} alt="" fill priority sizes="74vw" />
        </div>
        <div className={styles.prologueCopy}>
          <span>OCCU-MED / EST. 1979</span>
          <h1>Built around<br /><em>the job.</em></h1>
          <p>A medical network designed around one deceptively simple question: what does this person actually need to do?</p>
        </div>
        <div className={styles.prologueMeta}>
          <span>MEDICAL / DENTAL / DEPLOYMENT</span>
          <b>SCROLL TO EXPLORE ↓</b>
        </div>
      </section>

      <div id="cinematic-story" className={styles.story}>
        {STORY.map((scene, sceneIndex) => (
          <section
            id={`story-${sceneIndex + 1}`}
            className={styles.scene}
            data-scene
            data-active={activeScene === sceneIndex ? true : undefined}
            data-scene-index={sceneIndex}
            data-mode={scene.mode}
            data-world-chapter={scene.chapter}
            key={scene.chapter}
            style={{ '--scene-index': sceneIndex } as CSSProperties}
          >
            <div className={styles.sceneGhost} aria-hidden="true">{String(sceneIndex + 1).padStart(2, '0')}</div>
            <div className={styles.sceneTitleField} aria-hidden="true">{scene.title}</div>

            <div className={styles.sceneMedia}>
              {scene.images.map((image, imageIndex) => (
                <figure
                  className={styles.storyFrame}
                  data-webgl-image
                  data-image-index={imageIndex}
                  key={image}
                  style={{ '--image-index': imageIndex, '--image-count': scene.images.length } as CSSProperties}
                >
                  <Image
                    src={`${P}${encodeURIComponent(image)}`}
                    alt={`${scene.title} — visual ${imageIndex + 1} of ${scene.images.length}`}
                    fill
                    sizes="(max-width: 800px) 92vw, 68vw"
                  />
                </figure>
              ))}
            </div>

            <div className={styles.sceneCopy}>
              <span>{scene.chapter}</span>
              <h2 aria-label={scene.title}>{scene.title.split(' ').map((word, wordIndex) => <span key={`${word}-${wordIndex}`} style={{ '--word-index': wordIndex } as CSSProperties} aria-hidden="true">{word}</span>)}</h2>
              <p>{scene.body}</p>
            </div>

            <aside className={styles.sceneSignal}>
              <b>{scene.signal}</b>
              <span>{scene.signalLabel}</span>
            </aside>

            <div className={styles.sceneAnnotation}>
              <i />
              <span>{scene.annotation}</span>
            </div>
          </section>
        ))}
      </div>

      <section id="provider-portals" className={styles.arrival} data-scene data-scene-index={STORY.length}>
        <header className={styles.arrivalHeader}>
          <span>ZERO-STYLE DESTINATION FIELD / OCCU-MED</span>
          <p>Five destinations. One connected provider world.</p>
        </header>
        <PortalOrbitalNav portals={PORTALS} />
      </section>
    </main>
  );
}
