'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import ResearchArchive from './ResearchArchive';
import ProblemScene from './ProblemScene';
import PricingAgreementBuilder from './PricingAgreementBuilder';
import styles from './ProviderExperience.module.css';

const PHOTOS = {
  headquarters: '/photos/ChatGPT%20Image%20Sep%206%2C%202026%2C%2010_15_00%20PM.png',
  map: '/photos/California%20-%20Hawaii%20Map.png',
  concerned: '/photos/Concerned%20provider.png',
  employeeId: '/photos/EMPLOYEE%20ID.png',
  examReport: '/photos/EXAM%20REPORT.png',
  facilities: '/photos/Facilities.png',
  medicalEval: '/photos/Medical%20Eval.png',
  appointment: '/photos/Friendly%20Medical%20Appointment%20Call.png',
  team: '/photos/Diverse%20Healthcare%20Team%20Portrait%20(1).png',
  fitness: '/photos/Fitness%20Determination.png',
  dental: '/photos/Dental%20Eval.png',
  audiometry: '/photos/Audiometry.png',
  bloodDraw: '/photos/Calm%20Clinic%20Blood%20Draw%20(1).png',
  vaccine: '/photos/Pharmacist%20Administering%20a%20Vaccine(1)%20(1).png',
  vaccineSchedule: '/photos/Vaccine%20Schedule.png',
  workforce: '/photos/Diverse%20Workforce.png',
  workforce2: '/photos/Diverse%20Workforce2.png',
  internationalCertification: '/photos/International%20Certification.png',
  internationalNetwork: '/photos/International%20Network.png',
  humility: '/photos/Corevalue.png',
  positivity: '/photos/Corevalue2.png',
  customerService: '/photos/Corevalue3.png',
  quality: '/photos/Corevalue4.png',
  integrity: '/photos/Corevalue5.png',
  diligence: '/photos/Corevalue6.png',
} as const;

const HISTORY = [
  {
    year: '1976',
    title: 'The research starts before the company exists.',
    copy: 'A federally funded project is launched to improve physical and medical standards for employment: connect essential job functions, injury-cost reduction, disability rights, and medically appropriate, legally defensible decision-making.',
    image: PHOTOS.concerned,
    imageAlt: 'Illustration of a provider considering an occupational medical problem',
    cue: 'THE QUESTION',
  },
  {
    year: '1979',
    title: 'Occu-Med is founded in Honolulu.',
    copy: 'The research becomes an operating company focused on workforce health-and-safety cost reduction, research, consulting, and a more job-specific approach to employment medical evaluation.',
    image: PHOTOS.map,
    imageAlt: 'Stylized California and Hawaii map artwork',
    cue: 'RESEARCH → COMPANY',
  },
  {
    year: '2006',
    title: 'The model goes international.',
    copy: 'Occu-Med begins serving international markets, extending a standardized evaluation system beyond a single geography and into deployment-focused medical readiness.',
    image: PHOTOS.internationalCertification,
    imageAlt: 'International certification illustration',
    cue: 'A STANDARD THAT TRAVELS',
  },
  {
    year: '2016',
    title: 'Global infrastructure becomes visible.',
    copy: 'A contemporary profile describes examination infrastructure spanning more than 36 countries, reflecting the transition from a specialist consultancy into a global coordination platform.',
    image: PHOTOS.facilities,
    imageAlt: 'Illustration of multiple facility types',
    cue: 'INFRASTRUCTURE',
  },
  {
    year: 'TODAY',
    title: 'A network measured in thousands of locations.',
    copy: 'Occu-Med now describes a worldwide network of more than 15,000 provider locations supporting more than one million employees across all 50 states, U.S. territories, and 50+ countries abroad.',
    image: PHOTOS.internationalNetwork,
    imageAlt: 'Connected global provider network illustration',
    cue: 'ONE CONNECTED NETWORK',
  },
] as const;

const PROCESS = [
  { id: '01', label: 'Referral', copy: 'The employer request enters Occu-Med’s system with the job and requested medical scope.', image: PHOTOS.employeeId, imageAlt: 'Employee identification illustration' },
  { id: '02', label: 'Scheduling', copy: 'Availability is coordinated with the examinee and clinic before the appointment is confirmed.', image: PHOTOS.appointment, imageAlt: 'Medical appointment scheduling illustration' },
  { id: '03', label: 'Clinic', copy: 'The authorized exam packet and requested services reach the selected provider facility.', image: PHOTOS.facilities, imageAlt: 'Illustration of healthcare facilities' },
  { id: '04', label: 'Exam', copy: 'The provider performs the authorized evaluation and documents findings for Occu-Med review.', image: PHOTOS.medicalEval, imageAlt: 'Medical evaluation illustration' },
  { id: '05', label: 'Records', copy: 'Provider Relations follows the case until the required reports, tracings, images, or laboratory results are received.', image: PHOTOS.examReport, imageAlt: 'Medical examination report illustration' },
  { id: '06', label: 'QA', copy: 'Documentation is checked for completeness and accuracy before medical review.', image: PHOTOS.team, imageAlt: 'Diverse healthcare team illustration' },
  { id: '07', label: 'Review', copy: 'Medical findings are interpreted against the applicable job and deployment requirements.', image: PHOTOS.fitness, imageAlt: 'Fitness determination illustration' },
] as const;

const CLINICAL = [
  { label: 'Medical evaluation', image: PHOTOS.medicalEval, alt: 'Medical evaluation illustration' },
  { label: 'Laboratory collection', image: PHOTOS.bloodDraw, alt: 'Blood draw illustration' },
  { label: 'Dental readiness', image: PHOTOS.dental, alt: 'Dental examination illustration' },
  { label: 'Audiometry', image: PHOTOS.audiometry, alt: 'Audiometry testing illustration' },
  { label: 'Vaccination', image: PHOTOS.vaccine, alt: 'Pharmacist administering a vaccine illustration' },
] as const;

const VALUES = [
  { label: 'Humility', image: PHOTOS.humility },
  { label: 'Positivity', image: PHOTOS.positivity },
  { label: 'Customer Service', image: PHOTOS.customerService },
  { label: 'Quality', image: PHOTOS.quality },
  { label: 'Integrity', image: PHOTOS.integrity },
  { label: 'Diligence', image: PHOTOS.diligence },
] as const;

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
  const [activeClinical, setActiveClinical] = useState(0);
  const [activeValue, setActiveValue] = useState(0);
  const [workforceView, setWorkforceView] = useState<0 | 1>(0);
  const [specialty, setSpecialty] = useState<SpecialtyKey>('occupational');
  const [selectedServices, setSelectedServices] = useState<string[]>([...SPECIALTIES.occupational.services]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const revealSections = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.setAttribute('data-visible', 'true');
      }),
      { threshold: 0.16 }
    );
    revealSections.forEach(section => observer.observe(section));

    let raf = 0;
    const updateScrub = () => {
      raf = 0;
      const height = window.innerHeight || 1;
      const scrubSections = Array.from(root.querySelectorAll<HTMLElement>('[data-scrub]'));
      scrubSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const raw = (height - rect.top) / (height + rect.height);
        const progress = Math.max(0, Math.min(1, raw));
        section.style.setProperty('--scene', progress.toFixed(4));
      });
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(updateScrub);
    };
    updateScrub();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const updateTilt = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty('--rx', `${-y * 6}deg`);
    event.currentTarget.style.setProperty('--ry', `${x * 8}deg`);
  };

  const resetTilt = (event: PointerEvent<HTMLDivElement>) => {
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
  const history = HISTORY[activeHistory];
  const process = PROCESS[activeProcess];
  const clinical = CLINICAL[activeClinical];

  return (
    <main ref={rootRef} className={styles.root}>
      <section className={styles.threshold} data-reveal data-scrub>
        <Image className={styles.thresholdArt} src={PHOTOS.headquarters} alt="Illustrated Occu-Med headquarters" fill priority sizes="100vw" />
        <div className={styles.thresholdShade} />
        <div className={styles.thresholdGrid} aria-hidden="true" />
        <div className={styles.thresholdCopy}>
          <span>OCCU-MED / PROVIDER EXPERIENCE</span>
          <h1>Before the network,<br />there was a question.</h1>
          <p>What happens when a medical exam is asked to answer a job-specific question without job-specific context?</p>
          <a href="#history">Enter the story <b>↓</b></a>
        </div>
        <div className={styles.thresholdMarker}>FRESNO / CALIFORNIA</div>
      </section>

      <section id="history" className={styles.history} data-reveal data-scrub>
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
            <div className={styles.historyVisual} key={history.year}>
              <Image src={history.image} alt={history.imageAlt} fill sizes="(max-width: 900px) 100vw, 58vw" />
              <div className={styles.historyVisualShade} />
              <span>{history.cue}</span>
            </div>
            <div className={styles.historyNumber}>{history.year}</div>
            <div className={styles.historyCard}>
              <span>CHAPTER {String(activeHistory + 1).padStart(2, '0')}</span>
              <h3>{history.title}</h3>
              <p>{history.copy}</p>
            </div>
          </div>
        </div>
      </section>

      <ResearchArchive />
      <ProblemScene />

      <section className={styles.method} data-reveal data-scrub>
        <div className={styles.methodBackdrop} aria-hidden="true">
          <Image src={PHOTOS.concerned} alt="" fill sizes="50vw" />
        </div>
        <div className={styles.methodCopy}>
          <span>THE PROPRIETARY MODEL</span>
          <h2>Three dimensions.<br /><em>One decision.</em></h2>
          <p>The point was never to invent another physical. It was to connect things that ordinary exams often separate: the job, the medical evidence, and the compatibility decision.</p>
        </div>
        <div className={styles.orbit} onPointerMove={updateTilt} onPointerLeave={resetTilt}>
          <div className={styles.methodArtifactA}><Image src={PHOTOS.employeeId} alt="Employee ID artifact" fill sizes="220px" /></div>
          <div className={styles.methodArtifactB}><Image src={PHOTOS.examReport} alt="Medical exam report artifact" fill sizes="260px" /></div>
          <div className={styles.orbitRingA} />
          <div className={styles.orbitRingB} />
          <div className={styles.core}>OCCU-MED</div>
          <div className={`${styles.orbitNode} ${styles.nodeJob}`}><b>01</b><strong>Valid Job Information</strong><span>Physical, cognitive, and environmental demands.</span></div>
          <div className={`${styles.orbitNode} ${styles.nodeMedical}`}><b>02</b><strong>Job-Related Medical Exam</strong><span>Testing aligned to actual essential functions.</span></div>
          <div className={`${styles.orbitNode} ${styles.nodeLegal}`}><b>03</b><strong>Compatibility Assessment</strong><span>Medical findings interpreted with job and legal context.</span></div>
        </div>
      </section>

      <section className={styles.process} data-reveal data-scrub>
        <div className={styles.processLead}>
          <span>HOW THE SYSTEM MOVES</span>
          <h2>Follow one referral<br /><em>through Occu-Med.</em></h2>
        </div>
        <div className={styles.processStage}>
          <div className={styles.processRail}>
            {PROCESS.map((item, index) => (
              <button type="button" key={item.id} onClick={() => setActiveProcess(index)} className={index === activeProcess ? styles.processActive : ''}>
                <span>{item.id}</span><strong>{item.label}</strong>
              </button>
            ))}
          </div>
          <div className={styles.processVisual}>
            {PROCESS.map((item, index) => (
              <Image
                key={item.id}
                className={`${styles.processImage} ${index === activeProcess ? styles.processImageActive : ''}`}
                src={item.image}
                alt={item.imageAlt}
                fill
                sizes="(max-width: 900px) 100vw, 65vw"
              />
            ))}
            <div className={styles.processImageShade} />
            <div className={styles.processPacket}>
              <small>OCCU-MED / CASE FLOW</small>
              <b>{process.id}</b>
              <strong>{process.label}</strong>
              <p>{process.copy}</p>
            </div>
            <div className={styles.signalA} /><div className={styles.signalB} />
          </div>
        </div>
      </section>

      <section className={styles.clinicalWorld} data-reveal data-scrub>
        <div className={styles.clinicalLead}>
          <span>ONE NETWORK / MANY CAPABILITIES</span>
          <h2>The exam changes.<br /><em>The operating model doesn’t.</em></h2>
        </div>
        <div className={styles.clinicalStage}>
          <div className={styles.clinicalImageWrap}>
            {CLINICAL.map((item, index) => (
              <Image
                key={item.label}
                className={`${styles.clinicalImage} ${index === activeClinical ? styles.clinicalImageActive : ''}`}
                src={item.image}
                alt={item.alt}
                fill
                sizes="(max-width: 900px) 100vw, 68vw"
              />
            ))}
            <div className={styles.clinicalImageShade} />
            <div className={styles.clinicalCounter}>{String(activeClinical + 1).padStart(2, '0')} / {String(CLINICAL.length).padStart(2, '0')}</div>
            {activeClinical === 4 && <div className={styles.vaccineSchedule}><Image src={PHOTOS.vaccineSchedule} alt="Vaccine schedule icon" fill sizes="150px" /></div>}
          </div>
          <div className={styles.clinicalRail}>
            {CLINICAL.map((item, index) => (
              <button type="button" key={item.label} onClick={() => setActiveClinical(index)} className={index === activeClinical ? styles.clinicalActive : ''}>
                <span>{String(index + 1).padStart(2, '0')}</span>{item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.workforce} data-reveal data-scrub>
        <div className={styles.workforceImage}>
          <Image src={workforceView === 0 ? PHOTOS.workforce : PHOTOS.workforce2} alt={workforceView === 0 ? 'Diverse industrial workforce illustration' : 'Public safety and military workforce illustration'} fill sizes="100vw" />
          <div className={styles.workforceShade} />
        </div>
        <div className={styles.workforceCopy}>
          <span>JOB-SPECIFIC MEDICINE</span>
          <h2>Different work.<br /><em>Different demands.</em></h2>
          <p>The system has to understand the job before a medical finding can mean anything useful about fitness, readiness, or safe performance.</p>
          <div className={styles.workforceToggle}>
            <button type="button" className={workforceView === 0 ? styles.workforceActive : ''} onClick={() => setWorkforceView(0)}>Industrial &amp; operational</button>
            <button type="button" className={workforceView === 1 ? styles.workforceActive : ''} onClick={() => setWorkforceView(1)}>Public safety &amp; readiness</button>
          </div>
        </div>
      </section>

      <section className={styles.scale} data-reveal data-scrub>
        <Image className={styles.scaleImage} src={PHOTOS.internationalNetwork} alt="Connected global provider network" fill sizes="100vw" />
        <div className={styles.scaleShade} />
        <div className={styles.scaleCopy}>
          <span>GLOBAL INFRASTRUCTURE</span>
          <h2><b>15,000+</b><br />provider locations.</h2>
          <p>All 50 states, U.S. territories, and 50+ countries abroad — one network coordinated through a consistent operating model.</p>
        </div>
        <div className={styles.certificationFloat} aria-hidden="true"><Image src={PHOTOS.internationalCertification} alt="" fill sizes="180px" /></div>
        <div className={styles.constellation} aria-hidden="true">
          {Array.from({ length: 28 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}
        </div>
      </section>

      <section className={styles.values} data-reveal>
        <div className={styles.valuesLead}>
          <span>HOW THE COMPANY WORKS</span>
          <h2>Six values.<br /><em>One operating culture.</em></h2>
          <p>These are treated as active behaviors rather than a footer list. Select one to bring it forward.</p>
        </div>
        <div className={styles.valuesStage}>
          <div className={styles.valuePoster}>
            <Image key={VALUES[activeValue].label} src={VALUES[activeValue].image} alt={`${VALUES[activeValue].label} core value`} fill sizes="(max-width: 700px) 75vw, 380px" />
          </div>
          <div className={styles.valueIndex}>
            {VALUES.map((value, index) => (
              <button type="button" key={value.label} onClick={() => setActiveValue(index)} className={index === activeValue ? styles.valueActive : ''}>
                <span>{String(index + 1).padStart(2, '0')}</span><strong>{value.label}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.handoff} data-reveal>
        <div className={styles.handoffTeam} aria-hidden="true"><Image src={PHOTOS.team} alt="" fill sizes="55vw" /></div>
        <div className={styles.handoffCopy}>
          <span>YOUR FACILITY</span>
          <h2>The spectacle ends here.<br /><em>The useful part begins.</em></h2>
          <p>From this point forward, the site becomes quieter and specific to the provider: specialty, services, documentation, payment terms, FAQs, locations, and the pricing agreement.</p>
          <a className={styles.handoffButton} href="#provider-details">Begin provider onboarding →</a>
        </div>
      </section>

      <section id="provider-details" className={styles.providerStatic} data-reveal>
        <div className={styles.providerIntro}>
          <span>PROVIDER INFORMATION</span>
          <h2>Show us what your facility does.</h2>
          <p>The content below changes with the provider. The goal is to answer the questions that matter to that specialty before asking for pricing.</p>
        </div>

        <div className={styles.specialtyNav}>
          {(Object.keys(SPECIALTIES) as SpecialtyKey[]).map(key => (
            <button key={key} type="button" onClick={() => chooseSpecialty(key)} className={key === specialty ? styles.specialtyActive : ''}>
              <span>{SPECIALTIES[key].label}</span>
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

        <PricingAgreementBuilder services={selectedServices} specialty={activeSpecialty.label} />
      </section>
    </main>
  );
}
