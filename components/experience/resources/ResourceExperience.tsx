'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ResourceExperience.module.css';
import handoffStyles from './ResourceHandoff.module.css';
import DiveWorld from '../immersive/DiveWorld';
import SpecialtyField from './SpecialtyField';

type Specialty = {
  id: string;
  label: string;
  color: string;
  description: string;
  protocol: Array<{ title: string; copy: string }>;
  documents: Array<{ title: string; meta: string; ready?: boolean }>;
};

const SPECIALTIES: Specialty[] = [
  {
    id: 'Occupational Medicine', label: 'Occupational Medicine', color: '#72dcff',
    description: 'Authorizations, examination packets, occupational testing, return requirements, and quality-assurance expectations.',
    protocol: [
      { title: 'Receive the authorization', copy: 'Confirm the examinee, authorized services, requested forms, and return instructions before the visit.' },
      { title: 'Perform only the authorized scope', copy: 'Document findings for the requested occupational-health services and contact Occu-Med before adding anything outside the authorization.' },
      { title: 'Return the complete record set', copy: 'Send every requested form, report, tracing, result, and supporting record needed for QA and medical review.' },
      { title: 'Invoice against the accepted fee schedule', copy: 'Use the agreed rates and billing directions associated with the referral.' },
    ],
    documents: [
      { title: 'Stateside Provider Guide', meta: 'Current general provider workflow', ready: true },
      { title: 'Occupational Examination Packet Guide', meta: 'Awaiting approved upload' },
      { title: 'Records Return Checklist', meta: 'Awaiting approved upload' },
    ],
  },
  {
    id: 'Dental', label: 'Dental', color: '#b18cff',
    description: 'Dental-readiness examinations, radiographs, documentation, emergency-risk findings, and direct-pay billing guidance.',
    protocol: [
      { title: 'Confirm the requested examination', copy: 'Review the authorization for the dental evaluation and any requested imaging before the appointment.' },
      { title: 'Document readiness findings', copy: 'Perform the authorized clinical assessment and document findings without issuing the employer’s final deployment determination.' },
      { title: 'Return the required forms and imaging record', copy: 'Send the completed dental documentation and requested radiographic information back to Occu-Med.' },
      { title: 'Invoice the authorized services', copy: 'Bill only the services approved for the referral at the accepted self-pay rates.' },
    ],
    documents: [
      { title: 'Stateside Provider Guide', meta: 'Current general provider workflow', ready: true },
      { title: 'Dental Readiness Checklist', meta: 'Awaiting approved upload' },
      { title: 'Dental Imaging Return Guide', meta: 'Awaiting approved upload' },
    ],
  },
  {
    id: 'Laboratory / Diagnostics', label: 'Laboratory / Diagnostics', color: '#7fd4ff',
    description: 'Collection orders, requested panels, specimen handling, result transmission, and referral-specific billing.',
    protocol: [
      { title: 'Match the order to the authorization', copy: 'Confirm the exact requested panels, collection requirements, and any destination-specific testing.' },
      { title: 'Collect and process correctly', copy: 'Use the laboratory’s standard handling process while staying within the authorized test scope.' },
      { title: 'Return complete results', copy: 'Transmit every ordered result and identifying case information using the referral instructions.' },
      { title: 'Invoice the authorized testing', copy: 'Apply the agreed direct-pay rates for the completed panels and collection services.' },
    ],
    documents: [
      { title: 'Stateside Provider Guide', meta: 'Current general provider workflow', ready: true },
      { title: 'Laboratory Handling Instructions', meta: 'Awaiting approved upload' },
      { title: 'Results Transmission Checklist', meta: 'Awaiting approved upload' },
    ],
  },
  {
    id: 'Primary Care', label: 'Primary Care', color: '#ff9f8f',
    description: 'General medical evaluation, medical-history review, baseline findings, vaccination support, and referral-specific documentation.',
    protocol: [
      { title: 'Confirm the requested visit', copy: 'Review the authorization for the exact medical examination, history review, vaccination, or supporting clinical service requested.' },
      { title: 'Perform the authorized assessment', copy: 'Complete the requested clinical work using normal standards while staying within the written authorization.' },
      { title: 'Return the requested documentation', copy: 'Provide the completed examination forms, findings, and supporting records identified in the referral.' },
      { title: 'Invoice the agreed services', copy: 'Bill only the authorized services using the accepted direct-pay rates.' },
    ],
    documents: [
      { title: 'Stateside Provider Guide', meta: 'Current general provider workflow', ready: true },
      { title: 'Primary Care Documentation Guide', meta: 'Awaiting approved upload' },
      { title: 'Medical Records Return Checklist', meta: 'Awaiting approved upload' },
    ],
  },
  {
    id: 'Audiology', label: 'Audiology', color: '#8cb3ff',
    description: 'Pure-tone audiometry, hearing-conservation testing, baseline or periodic documentation, and complete result return.',
    protocol: [
      { title: 'Confirm the requested audiogram', copy: 'Match the authorization to the required baseline, periodic, or referral-specific hearing test before the appointment.' },
      { title: 'Perform the authorized hearing test', copy: 'Complete the requested audiometry using the facility’s normal clinical protocol and required frequencies.' },
      { title: 'Return the tracing and report', copy: 'Provide the completed audiogram and any requested interpretation or supporting documentation to Occu-Med.' },
      { title: 'Invoice the authorized service', copy: 'Use the accepted direct-pay fee for the completed hearing test and any separately authorized consultation.' },
    ],
    documents: [
      { title: 'Stateside Provider Guide', meta: 'Current general provider workflow', ready: true },
      { title: 'Audiometry Return Instructions', meta: 'Awaiting approved upload' },
      { title: 'Hearing Conservation Checklist', meta: 'Awaiting approved upload' },
    ],
  },
  {
    id: 'Pharmacy / Vaccination', label: 'Pharmacy / Vaccination', color: '#e6bd73',
    description: 'Requested immunizations, administration documentation, lot information, and updated vaccination-history return.',
    protocol: [
      { title: 'Confirm the requested vaccine', copy: 'Review the authorization for the exact immunization and any destination or deployment requirement.' },
      { title: 'Administer the authorized dose', copy: 'Follow normal vaccine-screening and administration procedures.' },
      { title: 'Document the administration completely', copy: 'Return the vaccine name, date, lot and manufacturer details, and any requested record update.' },
      { title: 'Invoice the authorized vaccine and administration', copy: 'Apply the accepted direct-pay price for the vaccine and any separately authorized administration fee.' },
    ],
    documents: [
      { title: 'Stateside Provider Guide', meta: 'Current general provider workflow', ready: true },
      { title: 'Vaccination Documentation Guide', meta: 'Awaiting approved upload' },
      { title: 'Deployment Vaccine Checklist', meta: 'Awaiting approved upload' },
    ],
  },
];

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export default function ResourceExperience() {
  const router = useRouter();
  const diveRef = useRef<HTMLElement | null>(null);
  const routeTimer = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedId, setSelectedId] = useState('Occupational Medicine');
  const [handoff, setHandoff] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('docbox-provider-specialty');
    if (saved && SPECIALTIES.some(item => item.id === saved)) setSelectedId(saved);
    return () => { if (routeTimer.current) window.clearTimeout(routeTimer.current); };
  }, []);

  useEffect(() => {
    window.localStorage.setItem('docbox-provider-specialty', selectedId);
  }, [selectedId]);

  useEffect(() => {
    const dive = diveRef.current;
    if (!dive) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = dive.getBoundingClientRect();
      const travel = Math.max(dive.offsetHeight - window.innerHeight, 1);
      setProgress(clamp(-rect.top / travel));
    };
    const queue = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const selected = useMemo(() => SPECIALTIES.find(item => item.id === selectedId) ?? SPECIALTIES[0], [selectedId]);
  const fieldItems = useMemo(() => SPECIALTIES.map(({id,label,color}) => ({id,label,color})), []);
  const agreementHref = `/experience/agreement?specialty=${encodeURIComponent(selected.id)}`;
  const beginAgreement = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (handoff) return;
    setHandoff(true);
    routeTimer.current = window.setTimeout(() => router.push(agreementHref), 820);
  };

  return (
    <main className={styles.root} style={{ '--accent': selected.color, '--dive-progress': progress.toFixed(4) } as CSSProperties}>
      <header className={styles.topbar}>
        <a href="/experience#provider-portals">OCCU-MED / PROVIDER RESOURCES</a>
        <nav aria-label="Provider portals">
          <a href="/experience/history">History</a><a href="/experience/network">Network</a><a href="/experience/resources" aria-current="page">Resources</a><a href="/experience/questions">Q&A</a><a href="/experience/agreement">Agreement</a>
        </nav>
      </header>

      <section ref={diveRef} className={styles.dive} aria-label="Portal transition into provider resources">
        <div className={styles.diveStage}>
          <div className={styles.space}><DiveWorld progress={progress}/></div>
          <div className={styles.diveCopy}><span>PORTAL 03 / ENTER THE RESOURCE FIELD</span><h1>Fall into<br />your specialty.</h1><p>Keep scrolling. The portal resolves into a workspace built around the services your facility actually provides.</p></div>
          <div className={styles.arrivalMessage}><b>{selected.label}</b><span>The transition is resolving into your provider workspace.</span></div>
        </div>
      </section>

      <section className={styles.workspace}>
        <div className={styles.workspaceHead}><div><span>PROVIDER CONTROL ROOM / SPECIALTY PATH</span><h2>Start with what you do.</h2></div><p>Select the provider type that best matches your facility. The resource field, workflow, library, and pricing handoff reconfigure around that specialty and remain selected when you continue to the agreement portal.</p></div>
        <SpecialtyField items={fieldItems} selectedId={selected.id} onSelect={setSelectedId}/>
        <div className={styles.controlGrid} style={{ '--specialty-color': selected.color } as CSSProperties}>
          <article className={styles.protocol}><span className={styles.panelLabel}>REFERRAL PROTOCOL / {selected.label.toUpperCase()}</span><h3>{selected.description}</h3><ol>{selected.protocol.map(step => <li key={step.title}><div><b>{step.title}</b>{step.copy}</div></li>)}</ol></article>
          <article className={styles.library}><span className={styles.panelLabel}>RESOURCE LIBRARY / CURRENT PATH</span><h3>Documents for {selected.label}</h3><div className={styles.docs}>{selected.documents.map(document => <div className={styles.doc} key={document.title}><div><b>{document.title}</b><small>{document.meta}</small></div>{document.ready ? <a href="/api/provider-resources/stateside-guide">Download ↓</a> : <em>Awaiting upload</em>}</div>)}</div></article>
        </div>
        <div className={styles.next} style={{ '--specialty-color': selected.color } as CSSProperties}><p><strong>{selected.label}</strong> will carry forward with its matching service list.</p><a href={agreementHref} onClick={beginAgreement}>Enter agreement portal →</a></div>
      </section>

      {handoff && <div className={handoffStyles.handoff} aria-live="polite" aria-label={`Entering agreement portal for ${selected.label}`}>
        <div className={handoffStyles.portal} style={{'--handoff-color':selected.color} as CSSProperties}>
          <i/><i/><i/><i/><i/><div><small>PORTAL 05</small><b>{selected.label}</b><span>Entering Agreement</span></div>
        </div>
      </div>}
    </main>
  );
}
