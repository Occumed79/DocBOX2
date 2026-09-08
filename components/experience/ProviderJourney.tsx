'use client';

import Image from 'next/image';
import { Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import PricingAgreementBuilder from './PricingAgreementBuilder';
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

const SPECIALTIES = ['Occupational medicine', 'Dental', 'Laboratory', 'Cardiology', 'Imaging', 'Pharmacy / vaccination'] as const;
const SERVICES = ['Physical examinations', 'Audiometry', 'Laboratory collection', 'Dental evaluation', 'EKG / cardiology', 'Vaccination'];

const FAQ = [
  ['How does a referral begin?', 'Occu-Med contacts your facility with the authorized services, examinee information, scheduling needs, and the forms required for that case.'],
  ['Do we make the final employment decision?', 'No. Your facility performs and documents the authorized clinical services. Occu-Med reviews the results against the applicable occupational or deployment requirements.'],
  ['What records should we return?', 'Return the completed examination forms and every requested report, tracing, image, laboratory result, or vaccination record listed in the authorization.'],
  ['Can we perform additional services?', 'Contact Occu-Med before performing anything outside the authorization. Additional services require approval before they are completed.'],
  ['How does payment work?', 'The standard relationship is direct pay. Your facility invoices Occu-Med using the accepted fee schedule and agreed payment terms.'],
] as const;

export default function ProviderJourney() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [specialty, setSpecialty] = useState<(typeof SPECIALTIES)[number]>('Occupational medicine');
  const [openQuestion, setOpenQuestion] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-scene]'));
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.toggleAttribute('data-active', entry.isIntersecting);
    }), { threshold: .34 });
    scenes.forEach(scene => observer.observe(scene));
    return () => observer.disconnect();
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
        {STORY.map((scene, sceneIndex) => (
          <section className={styles.scene} data-scene key={scene.chapter} style={{ '--scene-index': sceneIndex } as CSSProperties}>
            <div className={styles.sceneCanvas}>
              {scene.images.map((image, imageIndex) => (
                <figure className={styles.storyFrame} key={image} style={{ '--image-index': imageIndex, '--image-count': scene.images.length } as CSSProperties}>
                  <Image src={`${P}${encodeURIComponent(image)}`} alt="" fill sizes="(max-width: 800px) 92vw, 64vw" />
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

      <section id="history" className={`${styles.destination} ${styles.history}`}>
        <header><span>PORTAL 01 / COMPANY HISTORY</span><h2>Forty-six years,<br />still moving forward.</h2></header>
        <div className={styles.timeline}>
          {[
            ['1979', 'Founded in Honolulu', 'A legal, medical, and job-specific response to the workers’ compensation crisis.'],
            ['2000', 'A company formalized', 'Occu-Med, Ltd. is incorporated after two decades of operating experience.'],
            ['2006', 'The model travels', 'Evaluation services expand to international companies and deployment work.'],
            ['TODAY', 'A connected network', 'More than one million employees supported through thousands of medical and dental facilities.'],
          ].map(([year, title, copy]) => <article key={year}><b>{year}</b><div><h3>{title}</h3><p>{copy}</p></div></article>)}
        </div>
      </section>

      <section id="network" className={`${styles.destination} ${styles.network}`}>
        <div className={styles.networkMap} aria-hidden="true">
          {Array.from({ length: 96 }, (_, i) => <i key={i} style={{ '--x': `${(i * 47) % 100}%`, '--y': `${(i * 71) % 100}%`, '--delay': `${(i % 12) * -.3}s` } as CSSProperties} />)}
        </div>
        <div className={styles.networkCopy}><span>PORTAL 02 / NETWORK</span><h2>Every point is a place a case can land.</h2><p>The directory contains 23,544 anonymized facility records spanning occupational medicine, dental, laboratories, imaging, specialists, hospitals, and pharmacies across the United States and abroad.</p><div><b>23,544</b><small>ANONYMIZED FACILITY RECORDS</small></div></div>
      </section>

      <section id="resources" className={`${styles.destination} ${styles.resources}`}>
        <header><span>PORTAL 03 / PROVIDER RESOURCES</span><h2>Guidance that starts<br />with your specialty.</h2></header>
        <div className={styles.specialtyPicker}>{SPECIALTIES.map(item => <button key={item} className={item === specialty ? styles.selected : ''} onClick={() => setSpecialty(item)}><span>+</span>{item}</button>)}</div>
        <div className={styles.resourcePanel}><span>SELECTED PATH</span><h3>{specialty}</h3><p>Your resource library will collect current authorizations, service instructions, required forms, documentation checklists, and billing guidance for this specialty in one place.</p><div>{['Referral checklist', 'Required documentation', 'Clinical guidance', 'Billing & invoices'].map(item => <button key={item}>{item}<b>↗</b></button>)}</div></div>
      </section>

      <section id="questions" className={`${styles.destination} ${styles.questions}`}>
        <header><span>PORTAL 04 / PROVIDER Q&A</span><h2>Know what happens<br />before the first case.</h2></header>
        <div className={styles.faq}>{FAQ.map(([question, answer], index) => <article key={question}><button onClick={() => setOpenQuestion(index)} aria-expanded={openQuestion === index}><span>{String(index + 1).padStart(2, '0')}</span><strong>{question}</strong><b>{openQuestion === index ? '−' : '+'}</b></button>{openQuestion === index && <p>{answer}</p>}</article>)}</div>
      </section>

      <section id="agreement" className={`${styles.destination} ${styles.agreement}`}>
        <header><span>PORTAL 05 / BECOME A PROVIDER</span><h2>Let’s define the<br />relationship.</h2><p>Select services, enter your pricing, and prepare a Provider Fee Proposal for Network Management review.</p></header>
        <Suspense fallback={<div className={styles.agreementLoading}>Preparing your provider proposal…</div>}>
          <PricingAgreementBuilder specialty={specialty} services={SERVICES} />
        </Suspense>
      </section>
    </main>
  );
}
