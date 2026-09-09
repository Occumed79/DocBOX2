'use client';

import { Suspense, useEffect, useMemo, useState, type CSSProperties } from 'react';
import PricingAgreementBuilder from './PricingAgreementBuilder';
import SpatialArchiveField from './SpatialArchiveField';
import styles from './ReferencePortals.module.css';

const NAV = [
  ['history', 'History'],
  ['network', 'Network'],
  ['resources', 'Resources'],
  ['questions', 'Q&A'],
  ['agreement', 'Agreement'],
] as const;

function PortalNav({ active }: { active: string }) {
  return (
    <nav className={styles.portalNav} aria-label="Provider portals">
      <a className={styles.portalBrand} href="/experience#provider-world">OCCU-MED / PORTALS</a>
      <div>
        {NAV.map(([id, label]) => <a key={id} data-active={active === id || undefined} href={`/experience/${id}`}>{label}</a>)}
      </div>
      <a className={styles.returnHub} href="/experience#provider-world">Return to hub ↗</a>
    </nav>
  );
}

const HISTORY = [
  {
    year: '1976',
    topic: 'Research',
    title: 'Research before the company.',
    copy: 'A federally funded project investigates improved physical and medical standards for employment, linking essential job functions, injury-cost reduction, disability rights, and medically appropriate decision-making.',
    cue: 'THE QUESTION',
  },
  {
    year: '1979',
    topic: 'Company',
    title: 'Occu-Med is founded in Honolulu.',
    copy: 'The research becomes an operating company focused on workforce health and safety, research, consulting, and job-specific employment medical evaluation.',
    cue: 'RESEARCH → COMPANY',
  },
  {
    year: '1980',
    topic: 'Method',
    title: 'The standards are already operational.',
    copy: 'Archival evidence shows comprehensive pre-employment medical standards being used with formal analysis of the physical effort required by individual positions.',
    cue: 'JOB + MEDICAL',
  },
  {
    year: '1994',
    topic: 'Method',
    title: 'A national occupational-health system.',
    copy: 'An archival record describes job profiles built from physical and environmental demands, physical-ability categories, and medical-specialist input—a mature system rather than a generic exam.',
    cue: 'STRUCTURED SYSTEM',
  },
  {
    year: '2006',
    topic: 'International',
    title: 'The model goes international.',
    copy: 'Occu-Med begins serving international markets and applying the operating model to global and deployment-oriented medical readiness.',
    cue: 'A STANDARD THAT TRAVELS',
  },
  {
    year: '2013',
    topic: 'Growth',
    title: 'A distributed U.S. footprint.',
    copy: 'Public records describe Fresno headquarters plus secondary offices in multiple U.S. regions, reflecting a distributed operating platform before later global expansion.',
    cue: 'DISTRIBUTED OPERATIONS',
  },
  {
    year: '2016',
    topic: 'International',
    title: 'Infrastructure across 36+ countries.',
    copy: 'A contemporary business profile describes pre-placement examination infrastructure in more than 36 countries and outside recognition of the company’s growth.',
    cue: 'GLOBAL INFRASTRUCTURE',
  },
  {
    year: 'TODAY',
    topic: 'Network',
    title: 'One connected provider network.',
    copy: 'Occu-Med currently describes more than 15,000 provider locations, all 50 states and U.S. territories, 50+ countries abroad, and more than one million employees supported.',
    cue: '15,000+ LOCATIONS',
  },
] as const;

export function HistoryPortal() {
  const [selected, setSelected] = useState(0);
  const [topic, setTopic] = useState('All');
  const topics = ['All', ...Array.from(new Set(HISTORY.map(item => item.topic)))] as string[];
  const visible = useMemo(() => HISTORY.map((item, index) => ({ item, index })).filter(({ item }) => topic === 'All' || item.topic === topic), [topic]);
  const active = HISTORY[selected];

  useEffect(() => {
    if (topic !== 'All' && active.topic !== topic) {
      const first = HISTORY.findIndex(item => item.topic === topic);
      if (first >= 0) setSelected(first);
    }
  }, [topic, active.topic]);

  return (
    <main className={`${styles.portalRoot} ${styles.historyRoot}`}>
      <PortalNav active="history" />
      <SpatialArchiveField />
      <section className={styles.historyWorld} data-spatial-archive>
        <header className={styles.historyHeader}>
          <span>PORTAL 01 / OCCU-MED ARCHIVE</span>
          <h1>History should feel<br /><em>like entering evidence.</em></h1>
          <p>Move across the chronology instead of reading a conventional vertical company timeline.</p>
        </header>

        <div className={styles.historyControls}>
          {topics.map(item => <button key={item} type="button" data-active={topic === item || undefined} onClick={() => setTopic(item)}>{item}</button>)}
        </div>

        <div className={styles.historyField}>
          <div className={styles.historyParticles} aria-hidden="true">
            {Array.from({ length: 72 }, (_, i) => {
              const x = (i * 37) % 100;
              const y = (i * 61) % 100;
              const size = 2 + (i % 3);
              const duration = 5 + (i % 9) * .6;
              return <i key={i} style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, animationDuration: `${duration}s` }} />;
            })}
          </div>

          <div className={styles.yearRail} role="list" aria-label="Occu-Med history years">
            {visible.map(({ item, index }, visibleIndex) => (
              <button
                key={item.year}
                type="button"
                role="listitem"
                data-active={selected === index || undefined}
                onClick={() => setSelected(index)}
                style={{ '--rail-index': visibleIndex } as CSSProperties}
              >
                <small>{String(index + 1).padStart(2, '0')}</small>
                <strong>{item.year}</strong>
                <span>{item.topic}</span>
              </button>
            ))}
          </div>

          <article className={styles.archiveCard} aria-live="polite">
            <span>{active.cue}</span>
            <strong>{active.year}</strong>
            <h2>{active.title}</h2>
            <p>{active.copy}</p>
            <div><b>{active.topic}</b><small>ARCHIVE ENTRY {String(selected + 1).padStart(2, '0')} / {HISTORY.length}</small></div>
          </article>
        </div>
      </section>
    </main>
  );
}

const NETWORK_VIEWS = {
  'All locations': {
    total: 23544,
    note: 'Every active anonymized directory record',
    rows: [['Medical provider', 9420], ['Pharmacy', 3309], ['Dental', 3143], ['Urgent care', 2635], ['Laboratory', 1919], ['Occupational medicine', 1415], ['Hospitals', 590], ['Diagnostics & specialists', 1063]],
  },
  'United States': {
    total: 22678,
    note: 'United States and U.S. territories',
    rows: [['California', 2512], ['Texas', 2065], ['Florida', 1211], ['New York', 936], ['Georgia', 808], ['Illinois', 802], ['North Carolina', 793], ['Pennsylvania', 760]],
  },
  'International': {
    total: 866,
    note: 'Records beyond the United States and territories',
    rows: [['South Africa', 160], ['India', 63], ['Australia', 42], ['Canada', 32], ['Turkey', 30], ['United Kingdom', 29], ['Jordan', 22], ['Afghanistan', 22]],
  },
  Medical: {
    total: 14133,
    note: 'Medical, occupational, urgent-care, and hospital capacity',
    rows: [['Medical provider', 9420], ['Urgent care', 2635], ['Occupational medicine', 1415], ['Hospitals', 590], ['Primary care', 76]],
  },
  Dental: {
    total: 3143,
    note: 'Dental and dental-readiness capacity',
    rows: [['Dental facilities', 3143]],
  },
  Diagnostic: {
    total: 2885,
    note: 'Laboratory, imaging, cardiology, and audiology capacity',
    rows: [['Laboratory', 1919], ['Drug testing laboratory', 294], ['Imaging / radiology', 278], ['Cardiology', 267], ['Audiology / hearing', 127]],
  },
} as const;
type NetworkView = keyof typeof NETWORK_VIEWS;

const MAP_NODES = Array.from({ length: 64 }, (_, index) => {
  const x = 6 + ((index * 37 + Math.floor(index / 4) * 11) % 88);
  const y = 10 + ((index * 53 + Math.floor(index / 5) * 7) % 76);
  const size = 2 + (index % 5);
  return { x, y, size, group: index % 6 };
});

export function NetworkPortal() {
  const [viewName, setViewName] = useState<NetworkView>('All locations');
  const [layers, setLayers] = useState({ density: true, providers: true, routes: true });
  const view = NETWORK_VIEWS[viewName];
  const largest = Math.max(...view.rows.map(([, count]) => count));

  const toggleLayer = (key: keyof typeof layers) => setLayers(current => ({ ...current, [key]: !current[key] }));

  return (
    <main className={`${styles.portalRoot} ${styles.networkRoot}`}>
      <PortalNav active="network" />
      <section className={styles.networkWorld}>
        <aside className={styles.mapDrawer}>
          <span>PORTAL 02 / NETWORK EXPLORER</span>
          <h1>Explore<br />the network.</h1>
          <p>An anonymized directory view organized like a geographic data explorer rather than a static list.</p>

          <div className={styles.modeGroup}>
            <small>EXPLORE BY</small>
            {(Object.keys(NETWORK_VIEWS) as NetworkView[]).map(name => (
              <button key={name} type="button" data-active={viewName === name || undefined} onClick={() => setViewName(name)}>{name}</button>
            ))}
          </div>

          <div className={styles.layerGroup}>
            <small>MAP LAYERS</small>
            {(Object.keys(layers) as (keyof typeof layers)[]).map(key => (
              <button key={key} type="button" data-active={layers[key] || undefined} onClick={() => toggleLayer(key)}>
                <i /> {key[0].toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </aside>

        <div className={styles.mapStage} aria-label="Anonymized provider network visualization">
          <div className={styles.mapGrid} />
          <div className={styles.worldShape} aria-hidden="true">
            <i /><i /><i /><i /><i /><i />
          </div>
          {layers.density && <div className={styles.densityField} aria-hidden="true" />}
          {layers.routes && <div className={styles.routeField} aria-hidden="true">{Array.from({ length: 18 }, (_, i) => {
            const left = 12 + ((i * 17) % 76);
            const top = 18 + ((i * 29) % 62);
            const width = 100 + (i % 5) * 38;
            const angle = -35 + (i % 9) * 9;
            return <i key={i} style={{ left: `${left}%`, top: `${top}%`, width, transform: `rotate(${angle}deg)` }} />;
          })}</div>}
          {layers.providers && <div className={styles.providerNodes} aria-hidden="true">{MAP_NODES.map((node, i) => <i key={i} style={{ left: `${node.x}%`, top: `${node.y}%`, width: node.size, height: node.size, '--group': node.group } as CSSProperties} />)}</div>}

          <div className={styles.mapStat}>
            <span>{viewName.toUpperCase()}</span>
            <strong>{view.total.toLocaleString()}</strong>
            <p>{view.note}</p>
          </div>

          <div className={styles.mapLegend}>
            <span><i /> Provider point</span>
            <span><i /> Coverage field</span>
            <span><i /> Network route</span>
          </div>
        </div>

        <aside className={styles.resultDrawer}>
          <span>VISIBLE RESULTS</span>
          <strong>{view.total.toLocaleString()}</strong>
          <p>{view.note}</p>
          <div className={styles.resultBars}>
            {view.rows.map(([name, count]) => (
              <div key={name}>
                <header><span>{name}</span><b>{count.toLocaleString()}</b></header>
                <i><b style={{ transform: `scaleX(${count / largest})` }} /></i>
              </div>
            ))}
          </div>
          <small>Public explorer uses anonymized provider-directory data and does not expose clinic identities here.</small>
        </aside>
      </section>
    </main>
  );
}

const RESOURCE = [
  ['Occupational Medicine', 'Physical examinations, audiometry, spirometry, EKG, fit testing, drug/alcohol testing, and vaccination workflows.'],
  ['Dental', 'Dental-readiness examinations, required imaging, documentation, and invoicing guidance.'],
  ['Laboratory', 'Collections, panels, handling requirements, results transmission, and billing guidance.'],
  ['Cardiology', 'EKG, treadmill testing, consultation reports, tracings, and interpretation requirements.'],
  ['Imaging', 'Authorized diagnostic studies, final reports, and image-access instructions.'],
  ['Pharmacy / Vaccination', 'Requested immunizations, administration records, lot details, and updated vaccine histories.'],
] as const;

export function ResourcesPortal() {
  const [selected, setSelected] = useState(0);
  const active = RESOURCE[selected];

  return (
    <main className={`${styles.portalRoot} ${styles.resourcesRoot}`}>
      <PortalNav active="resources" />
      <section className={styles.resourceIntro}>
        <span>PORTAL 03 / PROVIDER RESOURCES</span>
        <h1>Where provider guidance<br /><em>becomes usable.</em></h1>
        <p>Scroll into the resource world, then choose the specialty that matches your facility.</p>
      </section>

      <section className={styles.fallWorld}>
        <div className={styles.fallSticky}>
          <div className={styles.fallRings} aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div>
          <div className={styles.fallCopy}>
            <span>STEP INTO A NEW WORLD</span>
            <h2>Provider resources</h2>
            <p>Guidance organized around what you actually do.</p>
          </div>
        </div>
      </section>

      <section className={styles.resourceWorkspace}>
        <header>
          <span>CHOOSE YOUR SPECIALTY</span>
          <h2>Start with what you do.</h2>
        </header>
        <div className={styles.specialtyDeck}>
          {RESOURCE.map((item, index) => (
            <button key={item[0]} type="button" data-active={selected === index || undefined} onClick={() => setSelected(index)}>
              <small>{String(index + 1).padStart(2, '0')}</small><strong>{item[0]}</strong><i>↘</i>
            </button>
          ))}
        </div>
        <article className={styles.resourcePanel} aria-live="polite">
          <span>ACTIVE RESOURCE PATH</span>
          <h3>{active[0]}</h3>
          <p>{active[1]}</p>
          <div>
            <a href="/api/provider-resources/stateside-guide">Stateside provider guide <b>↓</b></a>
            <a href={`/experience/agreement?specialty=${encodeURIComponent(active[0])}`}>Continue to pricing proposal <b>→</b></a>
          </div>
        </article>
      </section>
    </main>
  );
}

const QA = {
  'Before a referral': [
    ['What is Occu-Med’s role?', 'Occu-Med coordinates referral scope, scheduling, documentation follow-up, quality assurance, and applicable medical review.'],
    ['What does our clinic receive?', 'A written authorization identifying the examinee, requested services, required forms, and records-return instructions.'],
    ['Does our provider make the employment decision?', 'No. The provider documents findings; Occu-Med performs the applicable job/program review and communicates the appropriate outcome.'],
  ],
  'Appointment & scope': [
    ['Who schedules the appointment?', 'Occu-Med coordinates the examinee’s availability with the clinic and confirms the appointment with the involved parties.'],
    ['May we perform services outside the authorization?', 'Contact Occu-Med for approval before providing a service that is not listed on the authorization.'],
    ['What happens after a missed appointment?', 'Scheduling follows up with the examinee and coordinates a replacement appointment as needed.'],
  ],
  'Records & QA': [
    ['What records must be returned?', 'Return every requested form, report, tracing, image, laboratory result, and vaccination record required by the case.'],
    ['How are missing records handled?', 'Provider Relations follows up with the clinic and Quality Assurance identifies incomplete, missing, or inconsistent documentation.'],
    ['What happens when findings require follow-up?', 'Occu-Med communicates the applicable follow-up requirement and coordinates the case as appropriate.'],
  ],
  'Billing & relationship': [
    ['How should we invoice?', 'Invoice Occu-Med using the accepted fee schedule and the billing directions supplied with the referral.'],
    ['Can multiple locations participate?', 'Yes. Each location and its available services can be documented for Network Management review.'],
    ['What information reaches the employer?', 'Occu-Med communicates the applicable outcome; confidential medical detail remains handled through the appropriate medical process.'],
  ],
} as const;
type QAGroup = keyof typeof QA;

export function QuestionsPortal() {
  const groups = Object.keys(QA) as QAGroup[];
  const [group, setGroup] = useState<QAGroup>(groups[0]);
  const [question, setQuestion] = useState(0);
  const active = QA[group][question] || QA[group][0];

  const chooseGroup = (next: QAGroup) => {
    setGroup(next);
    setQuestion(0);
  };

  return (
    <main className={`${styles.portalRoot} ${styles.questionsRoot}`}>
      <PortalNav active="questions" />
      <section className={styles.knowledgeWorld}>
        <header>
          <span>PORTAL 04 / PROVIDER KNOWLEDGE</span>
          <h1>Find the answer<br />by layer.</h1>
          <p>Provider guidance behaves like an explorer: choose a category, then move through the questions inside it.</p>
        </header>

        <div className={styles.knowledgeExplorer}>
          <aside className={styles.knowledgeLayers}>
            <small>GUIDANCE LAYERS</small>
            {groups.map((name, index) => (
              <button key={name} type="button" data-active={group === name || undefined} onClick={() => chooseGroup(name)}>
                <i>{String(index + 1).padStart(2, '0')}</i><span>{name}</span><b>{QA[name].length}</b>
              </button>
            ))}
          </aside>

          <div className={styles.questionList}>
            {QA[group].map(([q], index) => (
              <button key={q} type="button" data-active={question === index || undefined} onClick={() => setQuestion(index)}>
                <small>{String(index + 1).padStart(2, '0')}</small><strong>{q}</strong><i>→</i>
              </button>
            ))}
          </div>

          <article className={styles.answerField} aria-live="polite">
            <span>{group.toUpperCase()}</span>
            <small>QUESTION {String(question + 1).padStart(2, '0')}</small>
            <h2>{active[0]}</h2>
            <p>{active[1]}</p>
            <div className={styles.answerSignal} aria-hidden="true"><i /><b /><span /></div>
          </article>
        </div>
      </section>
    </main>
  );
}

const AGREEMENT_SERVICES: Record<string, string[]> = {
  'Occupational Medicine': ['Physical examinations', 'Audiometry', 'Spirometry / PFT', 'EKG', 'Drug & alcohol testing', 'Vaccinations'],
  Dental: ['Comprehensive dental evaluation', 'Bitewing radiographs', 'Panoramic imaging', 'Dental readiness documentation'],
  Laboratory: ['Routine bloodwork', 'Urinalysis', 'QuantiFERON-TB', 'Specimen collection'],
  Cardiology: ['Resting 12-lead EKG', 'Treadmill stress testing', 'Cardiology consultation'],
  Imaging: ['Chest X-ray', 'Diagnostic radiography', 'Ultrasound'],
  'Pharmacy / Vaccination': ['Routine immunizations', 'Travel vaccines', 'Deployment vaccines'],
};

export function AgreementPortal() {
  const [specialty, setSpecialty] = useState('Occupational Medicine');

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('specialty');
    if (requested && AGREEMENT_SERVICES[requested]) setSpecialty(requested);
  }, []);

  return (
    <main className={`${styles.portalRoot} ${styles.agreementRoot}`}>
      <PortalNav active="agreement" />
      <section className={styles.agreementThreshold}>
        <div className={styles.agreementTunnel} aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div>
        <div>
          <span>PORTAL 05 / PROVIDER AGREEMENT</span>
          <h1>Define the<br /><em>relationship.</em></h1>
          <p>Open provider onboarding stops at a fee proposal for Network Management review. Accepted pricing can then move into the secure Occu-Med Forms agreement workflow.</p>
          <a href="#proposal">Enter proposal <b>↓</b></a>
        </div>
      </section>

      <section id="proposal" className={styles.agreementWorkspace}>
        <header>
          <span>OCCU-MED FORMS / {specialty.toUpperCase()}</span>
          <h2>Provider Fee Proposal</h2>
          <p>Document your facility, authorized services, and proposed fees.</p>
        </header>
        <Suspense fallback={<p className={styles.formLoading}>Preparing proposal…</p>}>
          <PricingAgreementBuilder specialty={specialty} services={AGREEMENT_SERVICES[specialty]} />
        </Suspense>
      </section>
    </main>
  );
}
