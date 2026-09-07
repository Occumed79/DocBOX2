'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './ProviderExperience.module.css';

const HISTORY = [
  {
    year: '1976',
    title: 'The research starts before the company exists.',
    copy: 'A federally funded project is launched to improve physical and medical standards for employment: connect essential job functions, injury-cost reduction, disability rights, and medically appropriate, legally defensible decision-making.',
  },
  {
    year: '1979',
    title: 'Occu-Med is founded in Honolulu.',
    copy: 'The research becomes an operating company focused on workforce health-and-safety cost reduction, research, consulting, and a more job-specific approach to employment medical evaluation.',
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
    copy: 'Occu-Med now describes a worldwide network of more than 15,000 provider locations supporting more than one million employees across all 50 states, U.S. territories, and 50+ countries abroad.',
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

const SPECIALTIES = {
  occupational: {
    label: 'Occupational Medicine',
    intro: 'The broadest fit for recurring exam referrals and multi-component occupational health services.',
    services: ['Physical examinations', 'Audiometry', 'Spirometry / PFT', 'EKG', 'Respirator fit testing', 'Drug & alcohol testing', 'Vaccinations'],
    sends: ['Authorization and requested services', 'Exam packet / forms', 'Examinee demographics', 'Scheduling coordination'],
    returns: ['Completed exam documentation', 'Test results / tracings when applicable', 'Requested supporting records', 'Invoice under the agreed fee schedule'],
  },
  cardiology: {
    label: 'Cardiology',
    intro: 'Focused specialty referrals for cardiovascular testing, interpretation, and follow-up evaluation.',
    services: ['Resting 12-lead EKG', 'Treadmill stress testing', 'Cardiology consultation', 'Follow-up evaluation'],
    sends: ['Specific requested test or consultation', 'Relevant authorization', 'Available occupational context', 'Scheduling coordination'],
    returns: ['Final report / interpretation', 'Tracing or test output when applicable', 'Requested clinical documentation', 'Invoice under the agreed fee schedule'],
  },
  dental: {
    label: 'Dental',
    intro: 'Dental-readiness referrals with clear requested imaging and examination components.',
    services: ['Comprehensive dental evaluation', 'Bitewing radiographs', 'Panoramic imaging', 'Full-mouth series when requested', 'Dental readiness documentation'],
    sends: ['Authorized dental scope', 'Required dental forms', 'Examinee demographics', 'Scheduling coordination'],
    returns: ['Completed dental evaluation', 'Requested imaging / findings', 'Required dental documentation', 'Invoice under the agreed fee schedule'],
  },
  laboratory: {
    label: 'Laboratory',
    intro: 'Collection and testing support for employment and deployment medical requirements.',
    services: ['Routine bloodwork', 'Urinalysis', 'QuantiFERON-TB', 'Specimen collection', 'Specialty laboratory panels'],
    sends: ['Requested tests / panel', 'Collection instructions when applicable', 'Examinee demographics', 'Billing authorization'],
    returns: ['Final laboratory results', 'Collection documentation if required', 'Reference / accession information when applicable', 'Invoice under the agreed fee schedule'],
  },
  pharmacy: {
    label: 'Pharmacy / Vaccination',
    intro: 'Vaccination referrals for routine occupational needs, travel, and deployment readiness.',
    services: ['Routine immunizations', 'Travel vaccines', 'Deployment vaccines', 'Vaccine administration records'],
    sends: ['Requested vaccine(s)', 'Authorization', 'Examinee demographics', 'Destination / program context when relevant'],
    returns: ['Administration record', 'Lot / manufacturer documentation when required', 'Updated vaccine record', 'Invoice under the agreed fee schedule'],
  },
  imaging: {
    label: 'Imaging / Diagnostics',
    intro: 'Direct diagnostic referrals for requested imaging and testing that support the larger evaluation.',
    services: ['Chest X-ray', 'Diagnostic radiography', 'Ultrasound when requested', 'Other authorized diagnostic studies'],
    sends: ['Requested study', 'Order / authorization', 'Available clinical context', 'Scheduling coordination'],
    returns: ['Final report', 'Images or access instructions when requested', 'Supporting documentation', 'Invoice under the agreed fee schedule'],
  },
} as const;

type SpecialtyKey = keyof typeof SPECIALTIES;

export default function ProviderExperience() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [activeHistory, setActiveHistory] = useState(0);
  const [activeProcess, setActiveProcess] = useState(0);
  const [specialty, setSpecialty] = useState<SpecialtyKey>('occupational');
  const [selectedServices, setSelectedServices] = useState<string[]>([...SPECIALTIES.occupational.services]);

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

  const chooseSpecialty = (next: SpecialtyKey) => {
    setSpecialty(next);
    setSelectedServices([...SPECIALTIES[next].services]);
  };

  const toggleService = (service: string) => {
    setSelectedServices(previous => previous.includes(service)
      ? previous.filter(item => item !== service)
      : [...previous, service]);
  };

  const activeSpecialty = SPECIALTIES[specialty];

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
          <p>The company story begins with research before Occu-Med existed: research became methodology, methodology became operations, and operations became a global network.</p>
        </div>

        <div className={styles.historyStage}>
          <div className={styles.historyYears}>
            {HISTORY.map((item, index) => (
              <button type="button" key={item.year} onClick={() => setActiveHistory(index)} className={index === activeHistory ? styles.activeYear : ''}>
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
              <button type="button" key={item[0]} onClick={() => setActiveProcess(index)} className={index === activeProcess ? styles.processActive : ''}>
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
        <a className={styles.handoffButton} href="#provider-details">Begin provider onboarding →</a>
      </section>

      <section id="provider-details" className={styles.providerStatic} data-reveal>
        <div className={styles.providerIntro}>
          <span>PROVIDER INFORMATION</span>
          <h2>Show us what your facility does.</h2>
          <p>The content below changes with the provider. The goal is to answer the questions that matter to that specialty before asking for pricing.</p>
        </div>

        <div className={styles.specialtyGrid}>
          {(Object.keys(SPECIALTIES) as SpecialtyKey[]).map(key => (
            <button key={key} type="button" onClick={() => chooseSpecialty(key)} className={key === specialty ? styles.specialtyActive : ''}>
              <strong>{SPECIALTIES[key].label}</strong>
              <span>{SPECIALTIES[key].intro}</span>
            </button>
          ))}
        </div>

        <div className={styles.providerPanel}>
          <div className={styles.providerPanelLead}>
            <span>YOUR CAPABILITIES</span>
            <h3>{activeSpecialty.label}</h3>
            <p>{activeSpecialty.intro}</p>
          </div>
          <div className={styles.capabilityCloud}>
            {activeSpecialty.services.map(service => (
              <button key={service} type="button" onClick={() => toggleService(service)} className={selectedServices.includes(service) ? styles.capabilitySelected : ''}>
                <i>{selectedServices.includes(service) ? '✓' : '+'}</i>{service}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.exchangeGrid}>
          <article>
            <span>WHAT OCCU-MED SENDS</span>
            <h3>A clear authorization.</h3>
            <ul>{activeSpecialty.sends.map(item => <li key={item}>{item}</li>)}</ul>
          </article>
          <article>
            <span>WHAT COMES BACK</span>
            <h3>Exactly what the case needs.</h3>
            <ul>{activeSpecialty.returns.map(item => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>

        <div className={styles.agreementPreview}>
          <div>
            <span>PRICING AGREEMENT</span>
            <h3>Your selected services become the fee schedule.</h3>
            <p>{selectedServices.length} service{selectedServices.length === 1 ? '' : 's'} currently selected. The next build step is the editable rate table, location handling, business terms, review, and submission.</p>
          </div>
          <div className={styles.agreementServices}>
            {selectedServices.length ? selectedServices.map(service => <span key={service}>{service}</span>) : <em>Select at least one service above.</em>}
          </div>
          <button type="button" disabled={!selectedServices.length}>Build pricing agreement →</button>
        </div>
      </section>
    </main>
  );
}