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
      { title: 'Start with the authorization', copy: 'Treat the Authorization for Examination as the definitive scope. Complete every listed component and contact Occu-Med immediately if any item cannot be performed.' },
      { title: 'Perform only the authorized scope', copy: 'Document the requested occupational-health services clearly. Do not add services outside the written authorization without Occu-Med approval.' },
      { title: 'Return the complete record set', copy: 'Send every requested form, report, tracing, result, and supporting record so Provider Relations and Exam QA can complete the case.' },
      { title: 'Invoice after the authorized work is complete', copy: 'Submit a complete itemized invoice using the accepted rates. Undisputed invoices are paid NET 30 after all authorized results and the complete invoice have been received.' },
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
      { title: 'Confirm the authorized dental scope', copy: 'Review the Authorization for Examination before the appointment and complete only the listed evaluation and imaging components.' },
      { title: 'Document the clinical findings', copy: 'Perform the authorized dental assessment and document the findings. The provider supplies the clinical record; Occu-Med completes the downstream medical review.' },
      { title: 'Return all requested records', copy: 'Send the completed dental documentation and requested radiographic information so the case can move through Provider Relations and QA.' },
      { title: 'Invoice the authorized services', copy: 'Submit a complete itemized invoice at the accepted direct-pay rates. Undisputed invoices are paid NET 30 once all authorized results and the invoice are complete.' },
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
      { title: 'Match the order to the authorization', copy: 'Confirm the exact listed panels, collections, tracings, imaging, or other diagnostic components before the appointment.' },
      { title: 'Perform only the listed testing', copy: 'Use normal clinical handling standards while staying inside the written authorization. Contact Occu-Med if a listed component cannot be completed.' },
      { title: 'Return complete results', copy: 'Transmit every ordered result, tracing, interpretation, and supporting record required by the referral so QA can verify completeness.' },
      { title: 'Invoice the completed authorized testing', copy: 'Submit the itemized services and accepted fees. Undisputed invoices are paid NET 30 after all authorized results and the complete invoice are received.' },
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
      { title: 'Review the authorization first', copy: 'Use the Authorization for Examination as the definitive list of the medical-history, examination, vaccination, or supporting components to complete.' },
      { title: 'Perform the authorized assessment', copy: 'Complete the requested clinical work and document findings clearly. Contact Occu-Med before adding anything outside the written scope.' },
      { title: 'Return the requested documentation', copy: 'Provide the completed forms, findings, reports, and supporting records identified in the referral so the case can advance through QA and medical review.' },
      { title: 'Submit the complete invoice', copy: 'Bill only the authorized services using the accepted rates. Undisputed invoices are paid NET 30 after all authorized results and a complete itemized invoice are received.' },
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
      { title: 'Confirm the requested audiogram', copy: 'Match the Authorization for Examination to the required baseline, periodic, or referral-specific hearing test before the appointment.' },
      { title: 'Complete the authorized hearing test', copy: 'Perform the requested audiometry using the facility’s normal clinical protocol and the frequencies or documentation specified in the referral.' },
      { title: 'Return the tracing and report', copy: 'Provide the completed audiogram and any requested interpretation or supporting documentation so Exam QA can verify the record set.' },
      { title: 'Invoice the authorized service', copy: 'Use the accepted fee for the completed hearing test and any separately authorized service. Undisputed invoices are paid NET 30 after results and invoice are complete.' },
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
      { title: 'Confirm the authorized vaccine', copy: 'Review the Authorization for Examination for the exact immunization, dose, and any deployment or destination-specific requirement.' },
      { title: 'Administer the authorized dose', copy: 'Follow normal vaccine-screening and administration procedures while staying within the written authorization.' },
      { title: 'Return complete administration documentation', copy: 'Provide the vaccine name, administration date, lot and manufacturer details, and any requested updated record so the case can be completed.' },
      { title: 'Invoice the authorized vaccine and administration', copy: 'Submit the itemized authorized services at the accepted rate. Undisputed invoices are paid NET 30 after all required documentation and the complete invoice are received.' },
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
  const selectedIndex = useMemo(() => Math.max(0, SPECIALTIES.findIndex(item => item.id === selected.id)), [selected.id]);
  const fieldItems = useMemo(() => SPECIALTIES.map(({id,label,color}) => ({id,label,color})), []);
  const agreementHref = `/experience/agreement?specialty=${encodeURIComponent(selected.id)}&from=resources`;
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
          <div className={styles.depthGauge} aria-hidden="true"><span>DESCENT</span><i/><b>{Math.round(progress*100).toString().padStart(2,'0')}</b></div>
          <div className={styles.arrivalMessage}><b>{selected.label}</b><span>The transition is resolving into your provider workspace.</span></div>
        </div>
      </section>

      <section className={styles.selectionWorld} aria-label="Choose provider specialty">
        <div className={styles.selectionHeader}>
          <span>PROVIDER RESOURCE FIELD / 01</span>
          <p>Choose the specialty closest to the work your facility performs. The entire workflow and agreement path follows that selection.</p>
        </div>
        <div className={styles.specialtyBackdrop} aria-hidden="true"><span>{selected.label}</span><span>{selected.label}</span></div>
        <div className={styles.fieldIndex} aria-hidden="true"><b>{String(selectedIndex+1).padStart(2,'0')}</b><i/><span>{String(SPECIALTIES.length).padStart(2,'0')}</span></div>
        <SpecialtyField items={fieldItems} selectedId={selected.id} onSelect={setSelectedId}/>
        <aside className={styles.activeSpecialty} style={{'--specialty-color':selected.color} as CSSProperties}>
          <small>ACTIVE SPECIALTY</small><h2>{selected.label}</h2><p>{selected.description}</p>
        </aside>
      </section>

      <section className={styles.detailSurface}>
        <div className={styles.workspaceHead}><div><span>PROVIDER WORKFLOW / SELECTED PATH</span><h2>What happens<br/>after referral.</h2></div><p>Occu-Med sends the authorization, your clinic completes only the listed components, Provider Relations obtains the records, Exam QA checks completeness and accuracy, and the Medical Review team issues the final recommendation.</p></div>
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
