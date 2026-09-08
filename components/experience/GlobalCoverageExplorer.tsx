'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import styles from './GlobalCoverageExplorer.module.css';

type Layer = 'coverage' | 'services' | 'programs' | 'standards';
type Service = 'Medical' | 'Dental' | 'Vaccination' | 'Laboratory' | 'Diagnostics' | 'Specialist';
type Program = 'Pre-placement' | 'Deployment' | 'Fitness / RTW' | 'Periodic / surveillance';

type Marker = {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  kind: 'anchor' | 'scope';
};

const MARKERS: Marker[] = [
  { id: 'fresno', label: 'Fresno', sub: 'Current headquarters', x: 17, y: 42, kind: 'anchor' },
  { id: 'honolulu', label: 'Honolulu', sub: '1979 company origin', x: 6, y: 53, kind: 'anchor' },
  { id: 'us', label: 'United States', sub: 'Coverage in all 50 states', x: 25, y: 38, kind: 'scope' },
  { id: 'territories', label: 'U.S. territories', sub: 'Network scope includes U.S. territories', x: 26, y: 58, kind: 'scope' },
  { id: 'international', label: 'International', sub: '50+ countries abroad', x: 68, y: 44, kind: 'scope' },
];

const SERVICES: Record<Service, { copy: string; image: string; examples: string[] }> = {
  Medical: { copy: 'Job-related physical examinations and specialty evaluation components.', image: '/photos/Medical%20Eval.png', examples: ['Physical examinations', 'Audiometry', 'Spirometry / PFT', 'EKG'] },
  Dental: { copy: 'Dental-readiness examinations and requested radiographic components.', image: '/photos/Dental%20Eval.png', examples: ['Comprehensive evaluation', 'Bitewings', 'Panoramic imaging', 'Readiness documentation'] },
  Vaccination: { copy: 'Routine, travel, and deployment vaccination coordination.', image: '/photos/Pharmacist%20Administering%20a%20Vaccine(1)%20(1).png', examples: ['Routine immunizations', 'Travel vaccines', 'Deployment vaccines', 'Administration records'] },
  Laboratory: { copy: 'Collection and laboratory testing support tied to the evaluation program.', image: '/photos/Calm%20Clinic%20Blood%20Draw%20(1).png', examples: ['Routine panels', 'Urinalysis', 'TB testing', 'Specimen collection'] },
  Diagnostics: { copy: 'Diagnostic studies and specialty testing coordinated into the larger case.', image: '/photos/Audiometry.png', examples: ['Chest imaging', 'Audiometry', 'Cardiovascular testing', 'Other authorized studies'] },
  Specialist: { copy: 'Specialist and subspecialist referrals extend the network beyond general occupational medicine.', image: '/photos/Diverse%20Healthcare%20Team%20Portrait%20(1).png', examples: ['Specialist evaluation', 'Subspecialist review', 'Focused diagnostics', 'Follow-up consultation'] },
};

const PROGRAMS: Record<Program, { headline: string; facts: string[] }> = {
  'Pre-placement': { headline: 'Job-related medical evaluation before placement.', facts: ['Medical history and physical examination', 'Vision / hearing when required', 'Drug / alcohol testing when required', 'Pulmonary, cardiovascular, and laboratory components as authorized'] },
  Deployment: { headline: 'Medical-readiness coordination for deployment programs.', facts: ['Deployment-specific medical scope', 'Vaccination and laboratory support', 'Job / destination requirements', 'Centralized results and review workflow'] },
  'Fitness / RTW': { headline: 'Fitness-for-duty and return-to-work evaluation support.', facts: ['Job-specific question', 'Targeted medical evaluation', 'Relevant records and testing', 'Compatibility-focused medical review'] },
  'Periodic / surveillance': { headline: 'Recurring medical surveillance across distributed workforces.', facts: ['Periodic examinations', 'Program-specific testing', 'Centralized consistency', 'Multi-location coordination'] },
};

export default function GlobalCoverageExplorer() {
  const [layer, setLayer] = useState<Layer>('coverage');
  const [service, setService] = useState<Service>('Medical');
  const [program, setProgram] = useState<Program>('Pre-placement');
  const [marker, setMarker] = useState('us');
  const selectedMarker = MARKERS.find(item => item.id === marker) ?? MARKERS[2];
  const selectedService = SERVICES[service];
  const selectedProgram = PROGRAMS[program];

  const reset = () => {
    setLayer('coverage');
    setService('Medical');
    setProgram('Pre-placement');
    setMarker('us');
  };

  const scopeCopy = useMemo(() => {
    if (layer === 'coverage') return selectedMarker.sub;
    if (layer === 'services') return `${service}: ${selectedService.copy}`;
    if (layer === 'programs') return selectedProgram.headline;
    return 'A single operating model connects authorization, provider documentation, quality assurance, and medical review across geography.';
  }, [layer, selectedMarker.sub, selectedService.copy, selectedProgram.headline, service]);

  return (
    <section className={styles.explorer} aria-label="Occu-Med global network explorer">
      <header className={styles.head}>
        <div><span>GLOBAL NETWORK / EXPLORE</span><h2>The spectacle becomes<br />something you can interrogate.</h2></div>
        <p>This is not a decorative map. Every control changes the same network instrument while verified anchors stay separate from broader coverage scope.</p>
      </header>

      <div className={styles.workspace}>
        <div className={styles.map} data-layer={layer}>
          <div className={styles.mapImage} aria-hidden="true"><Image src="/photos/International%20Network.png" alt="" fill sizes="100vw" /></div>
          <svg className={styles.graticule} viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true">
            {Array.from({length:8},(_,i)=><line key={`v${i}`} x1={(i+1)*11.1} y1="0" x2={(i+1)*11.1} y2="70" />)}
            {Array.from({length:5},(_,i)=><line key={`h${i}`} x1="0" y1={(i+1)*11.6} x2="100" y2={(i+1)*11.6} />)}
            <path className={styles.corridor} d="M6 53 C12 47 15 45 17 42 S22 38 25 38 S42 32 52 37 S62 44 68 44 S80 39 92 46" />
            <path className={styles.corridor2} d="M17 42 C25 49 30 54 26 58 S47 62 58 53 S68 44 83 34" />
            <circle className={styles.travelDot} r=".7"><animateMotion dur="15s" repeatCount="indefinite" path="M6 53 C12 47 15 45 17 42 S22 38 25 38 S42 32 52 37 S62 44 68 44 S80 39 92 46" /></circle>
            <circle className={styles.travelDot2} r=".45"><animateMotion begin="-5s" dur="15s" repeatCount="indefinite" path="M17 42 C25 49 30 54 26 58 S47 62 58 53 S68 44 83 34" /></circle>
          </svg>

          <div className={styles.metrics} aria-label="Network scale">
            <article><strong>15,000+</strong><span>provider locations</span></article>
            <article><strong>50</strong><span>U.S. states</span></article>
            <article><strong>50+</strong><span>countries abroad</span></article>
            <article><strong>1M+</strong><span>employees supported</span></article>
          </div>

          <div className={styles.layerBar} aria-label="Network data layers">
            {(['coverage','services','programs','standards'] as Layer[]).map(item => <button type="button" key={item} data-active={layer===item} onClick={() => setLayer(item)}>{item}</button>)}
            <button type="button" onClick={reset}>reset</button>
          </div>

          {MARKERS.map(item => (
            <button type="button" key={item.id} className={styles.marker} data-kind={item.kind} data-active={item.id===marker} style={{left:`${item.x}%`,top:`${item.y}%`}} onClick={() => setMarker(item.id)}>
              <i /><span>{item.label}</span>
            </button>
          ))}

          <div className={styles.mapNote}>{layer === 'coverage' ? 'Verified coverage scope' : layer === 'services' ? `${service} provider-category layer` : layer === 'programs' ? `${program} program layer` : 'Operating-standard layer'} / illustrative pathways</div>
        </div>

        <aside className={styles.panel}>
          <span className={styles.panelKicker}>{layer.toUpperCase()} / {selectedMarker.label.toUpperCase()}</span>
          <h3>{scopeCopy}</h3>

          {layer === 'coverage' && <div className={styles.factList}>
            <span><b>HQ</b> 2121 West Bullard Avenue, Fresno, California</span>
            <span><b>Origin</b> Honolulu, Hawaii · 1979</span>
            <span><b>U.S.</b> all 50 states + territories</span>
            <span><b>International</b> 50+ countries abroad</span>
          </div>}

          {layer === 'services' && <>
            <div className={styles.serviceTabs}>{(Object.keys(SERVICES) as Service[]).map(item => <button type="button" key={item} data-active={service===item} onClick={() => setService(item)}>{item}</button>)}</div>
            <div className={styles.serviceVisual}><Image src={selectedService.image} alt="" fill sizes="340px" /></div>
            <div className={styles.factList}>{selectedService.examples.map(item => <span key={item}>{item}</span>)}</div>
          </>}

          {layer === 'programs' && <>
            <div className={styles.serviceTabs}>{(Object.keys(PROGRAMS) as Program[]).map(item => <button type="button" key={item} data-active={program===item} onClick={() => setProgram(item)}>{item}</button>)}</div>
            <div className={styles.factList}>{selectedProgram.facts.map(item => <span key={item}>{item}</span>)}</div>
          </>}

          {layer === 'standards' && <div className={styles.standardFlow}>
            <span>01 <b>Valid job information</b></span><i>→</i><span>02 <b>Job-related medical exam</b></span><i>→</i><span>03 <b>Compatibility assessment</b></span>
          </div>}
        </aside>
      </div>

      <div className={styles.disclaimer}><b>Data rule:</b> exact anchors are labeled as anchors. Geographic scope is shown as scope. The animated pathways are illustrative network connections, not claims about specific provider routes or regional provider counts.</div>
    </section>
  );
}
