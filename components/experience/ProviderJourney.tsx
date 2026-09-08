'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './ProviderJourney.module.css';

const P = '/photos/';

const STORY = [
  { chapter: '01 / ORIGIN', title: 'A different answer, since 1979.', body: 'Founded in Honolulu by attorney Jim A. Johnson and Dr. Devonna M. Kaji, Occu-Med began with one conviction: a medical finding only becomes useful when it is understood in the context of the job.', images: ['Founders.png', 'Founders copy.png', 'California - Hawaii Map.png'] },
  { chapter: '02 / THE PROBLEM', title: 'Healthy is not the same as ready.', body: 'Traditional examinations gave physicians too little information about the work itself. Occu-Med connected medical evidence, legal requirements, and essential job demands.', images: ['Concerned provider.png'] },
  { chapter: '03 / THE METHOD', title: 'Three dimensions. One defensible decision.', body: 'Valid job information. A job-related medical examination. A compatibility assessment performed by specialists and subject-matter experts.', images: ['EMPLOYEE ID.png', 'Diverse Healthcare Team Portrait (1).png'] },
  { chapter: '04 / REFERRAL', title: 'One referral enters the system.', body: 'Scheduling connects the examinee and clinic, confirms availability, and delivers an authorization and exam packet before the appointment.', images: ['Friendly Medical Appointment Call.png'] },
  { chapter: '05 / CLINICAL SERVICES', title: 'The service changes. The standard does not.', body: 'Physical examinations, laboratory collection, dental readiness, audiometry, and vaccination are coordinated around the exact authorized scope.', images: ['Medical Eval.png', 'Calm Clinic Blood Draw (1).png', 'Dental Eval.png', 'Audiometry.png', 'Pharmacist Administering a Vaccine(1) (1).png'] },
  { chapter: '06 / DOCUMENTATION', title: 'Every result comes back into focus.', body: 'Provider Relations follows the case until records arrive. Quality Assurance checks each report for completeness and accuracy.', images: ['EXAM REPORT.png'] },
  { chapter: '07 / DETERMINATION', title: 'Evidence becomes an outcome.', body: 'Medical Review evaluates findings against the job classification and applicable guidelines. The employer receives the outcome—never the confidential medical detail.', images: ['Fitness Determination.png'] },
  { chapter: '08 / THE WORK', title: 'Different work creates different demands.', body: 'From public safety to construction, energy, education, government, and deployment, the job remains central to the medical question.', images: ['Diverse Workforce.png', 'Diverse Workforce2.png'] },
  { chapter: '09 / DEPLOYMENT', title: 'Readiness has no single border.', body: 'Deployment standards, medical clearances, immunization schedules, and destination requirements are coordinated as one connected readiness process.', images: ['International Certification.png', 'Vaccine Schedule.png'] },
  { chapter: '10 / THE NETWORK', title: 'One operating model. Thousands of locations.', body: 'A worldwide medical and dental network gives every referral a place to land—stateside or abroad.', images: ['Facilities.png', 'International Network.png'] },
  { chapter: '11 / VALUES', title: 'The standard is how we work.', body: 'Humility. Positivity. Customer service. Quality. Integrity. Diligence.', images: ['Corevalue.png', 'Corevalue2.png', 'Corevalue3.png', 'Corevalue4.png', 'Corevalue5.png', 'Corevalue6.png'] },
] as const;

const PORTALS = [
  { id: 'history', href: '/experience/history', number: '01', title: 'Company history', note: 'From Honolulu to a global medical network', tone: 'gold' },
  { id: 'network', href: '/experience/network', number: '02', title: 'Explore the network', note: '23,544 anonymized facility records', tone: 'cyan' },
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
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.toggleAttribute('data-active', entry.isIntersecting);
      if (entry.isIntersecting) setActiveScene(Number((entry.target as HTMLElement).dataset.sceneIndex ?? 0));
    }), { threshold: .34 });
    scenes.forEach(scene => observer.observe(scene));

    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const viewport = Math.max(window.innerHeight, 1);
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
      setActiveScene(Math.min(nearest, STORY.length - 1));
    };
    const queueProgress = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };
    updateProgress();
    window.addEventListener('scroll', queueProgress, { passive: true });
    window.addEventListener('resize', queueProgress);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', queueProgress);
      window.removeEventListener('resize', queueProgress);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main ref={rootRef} className={styles.root}>
      <section className={styles.prologue}>
        <Image src={`${P}Founders.png`} alt="Occu-Med founders illustration" fill priority sizes="100vw" />
        <div className={styles.prologueShade} />
        <div className={styles.prologueCopy}>
          <span>OCCU-MED / THE COMPANY STORY</span>
          <h1>Before the network,<br /><em>there was a question.</em></h1>
          <p>Scroll to follow one idea from Honolulu to a worldwide provider network.</p>
          <a href="#cinematic-story">Begin the story <b>↓</b></a>
        </div>
      </section>

      <div id="cinematic-story" className={styles.story}>
        <nav className={styles.storyRail} aria-label="Company story chapters">
          <span>STORY</span>
          {STORY.map((scene, index) => <a key={scene.chapter} href={`#story-${index + 1}`} aria-current={activeScene === index ? 'step' : undefined}><i /> <b>{String(index + 1).padStart(2, '0')}</b><small>{scene.chapter.split('/ ')[1]}</small></a>)}
        </nav>
        {STORY.map((scene, sceneIndex) => (
          <section id={`story-${sceneIndex + 1}`} className={styles.scene} data-scene data-scene-index={sceneIndex} key={scene.chapter} style={{ '--scene-index': sceneIndex } as CSSProperties}>
            <div className={styles.sceneCanvas}>
              {scene.images.map((image, imageIndex) => (
                <figure className={styles.storyFrame} key={image} style={{ '--image-index': imageIndex, '--image-count': scene.images.length } as CSSProperties}>
                  <Image src={`${P}${encodeURIComponent(image)}`} alt={`${scene.title} — visual ${imageIndex + 1} of ${scene.images.length}`} fill sizes="(max-width: 800px) 92vw, 64vw" />
                </figure>
              ))}
              <div className={styles.orb} aria-hidden="true" />
            </div>
            <div className={styles.sceneCopy}>
              <span>{scene.chapter}</span>
              <h2>{scene.title}</h2>
              <p>{scene.body}</p>
              <small>{String(sceneIndex + 1).padStart(2, '0')} / {STORY.length}</small>
            </div>
          </section>
        ))}
      </div>

      <section className={styles.arrival} data-scene>
        <div className={styles.arrivalFigure} aria-hidden="true"><i /><b /></div>
        <div className={styles.arrivalCopy}>
          <span>YOU HAVE ARRIVED</span>
          <h2>Your facility can become<br />the next point in the network.</h2>
          <p>Choose a portal. Explore Occu-Med in the order that matters to you.</p>
        </div>
        <div className={styles.portalOrbit}>
          {PORTALS.map((portal, index) => (
            <a key={portal.id} href={portal.href} className={styles.portal} data-tone={portal.tone} style={{ '--portal-index': index } as CSSProperties}>
              <span>{portal.number}</span><strong>{portal.title}</strong><small>{portal.note}</small><b>ENTER ↘</b>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
