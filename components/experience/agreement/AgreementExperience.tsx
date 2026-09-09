'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import PricingAgreementBuilder from '../PricingAgreementBuilder';
import styles from './AgreementExperience.module.css';
import PortalOrbitalNav from '../immersive/PortalOrbitalNav';

const SERVICES: Record<string, string[]> = {
  'Occupational Medicine': ['Physical examinations','Audiometry','Spirometry / PFT','EKG','Drug & alcohol testing','Vaccinations'],
  'Primary Care': ['General medical examination','Medical history review','Vaccinations','Clinical documentation'],
  Dental: ['Comprehensive dental evaluation','Bitewing radiographs','Panoramic imaging','Dental readiness documentation'],
  Laboratory: ['Routine bloodwork','Urinalysis','QuantiFERON-TB','Specimen collection'],
  'Laboratory / Diagnostics': ['Routine bloodwork','Urinalysis','QuantiFERON-TB','Specimen collection'],
  Audiology: ['Pure-tone audiometry','Hearing conservation testing','Audiology consultation'],
  Cardiology: ['Resting 12-lead EKG','Treadmill stress testing','Cardiology consultation'],
  Imaging: ['Chest X-ray','Diagnostic radiography','Ultrasound'],
  'Pharmacy / Vaccination': ['Routine immunizations','Travel vaccines','Deployment vaccines'],
};

const STAGES = [
  ['01','Facility'],['02','Services'],['03','Pricing'],['04','Acceptance'],['05','Handoff'],
] as const;

export default function AgreementExperience() {
  const [specialty, setSpecialty] = useState('Occupational Medicine');
  const [entered, setEntered] = useState(false);
  const workspaceRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('specialty');
    const saved = window.localStorage.getItem('docbox-provider-specialty');
    const candidate = requested && SERVICES[requested] ? requested : saved && SERVICES[saved] ? saved : 'Occupational Medicine';
    setSpecialty(candidate);
    window.localStorage.setItem('docbox-provider-specialty', candidate);
  }, []);

  useEffect(() => {
    if (!entered) return;
    const frame = window.requestAnimationFrame(() => {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [entered]);

  const services = useMemo(() => SERVICES[specialty] ?? SERVICES['Occupational Medicine'], [specialty]);

  return (
    <main className={styles.root} data-entered={entered ? 'true' : 'false'}>
      <header className={styles.topbar}>
        <a href="/experience#provider-portals">OCCU-MED / AGREEMENT GATEWAY</a>
        <div><a href="/experience/history">HISTORY</a> · <a href="/experience/network">NETWORK</a> · <a href="/experience/resources">RESOURCES</a> · <a href="/experience/questions">Q&A</a></div>
      </header>

      <section className={styles.gateway}>
        <PortalOrbitalNav agreementOnly onEnter={()=>setEntered(true)} portals={[{id:'agreement',href:'#forms-workspace',number:'05',title:'Agreement',note:'Enter the forms workspace',tone:'white'}]}/>
        <div className={styles.content}>
          <span>PORTAL 05 / SECURE HANDOFF</span>
          <h1>Define the<br/>relationship.</h1>
          <p>The selected specialty and matching service list are already attached to this path. Enter the portal to carry them directly into the working Occu-Med pricing proposal.</p>

          <div className={styles.confirm}>
            <div><b>{specialty}</b><small>{services.length} services are preloaded for this provider path.</small></div>
            <button type="button" onClick={()=>setEntered(true)}>ENTER AGREEMENT PORTAL ↓</button>
          </div>

          <div className={styles.stages} aria-label="Provider agreement stages">
            {STAGES.map(([number,label])=><div className={styles.stage} key={number}><span>{number} / STAGE</span><b>{label}</b></div>)}
          </div>
        </div>
      </section>

      {entered && <section ref={workspaceRef} id="forms-workspace" className={styles.workspace}>
        <div className={styles.workspaceHead}>
          <div><span className={styles.label}>OCCU-MED FORMS / {specialty.toUpperCase()}</span><h2>Provider Fee Proposal</h2></div>
          <div><p>This is the existing functional Occu-Med Forms workflow. Your specialty and matching service list arrived with you through the portal and are preloaded below.</p><div className={styles.serviceList}>{services.map(service=><span key={service}>{service}</span>)}</div></div>
        </div>
        <div className={styles.formShell}>
          <PricingAgreementBuilder specialty={specialty} services={services}/>
        </div>
      </section>}
    </main>
  );
}
