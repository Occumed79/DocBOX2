'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import PricingAgreementBuilder from '../PricingAgreementBuilder';
import styles from './AgreementExperience.module.css';

const SERVICES: Record<string, string[]> = {
  'Occupational Medicine': ['Physical examinations','Audiometry','Spirometry / PFT','EKG','Drug & alcohol testing','Vaccinations'],
  Dental: ['Comprehensive dental evaluation','Bitewing radiographs','Panoramic imaging','Dental readiness documentation'],
  Laboratory: ['Routine bloodwork','Urinalysis','QuantiFERON-TB','Specimen collection'],
  Cardiology: ['Resting 12-lead EKG','Treadmill stress testing','Cardiology consultation'],
  Imaging: ['Chest X-ray','Diagnostic radiography','Ultrasound'],
  'Pharmacy / Vaccination': ['Routine immunizations','Travel vaccines','Deployment vaccines'],
};

const STAGES = [
  ['01','Facility'],['02','Services'],['03','Pricing'],['04','Acceptance'],['05','Handoff'],
] as const;

export default function AgreementExperience() {
  const [specialty, setSpecialty] = useState('Occupational Medicine');

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('specialty');
    const saved = window.localStorage.getItem('docbox-provider-specialty');
    const candidate = requested && SERVICES[requested] ? requested : saved && SERVICES[saved] ? saved : 'Occupational Medicine';
    setSpecialty(candidate);
    window.localStorage.setItem('docbox-provider-specialty', candidate);
  }, []);

  const services = useMemo(() => SERVICES[specialty] ?? SERVICES['Occupational Medicine'], [specialty]);

  return (
    <main className={styles.root}>
      <header className={styles.topbar}>
        <a href="/experience#provider-portals">OCCU-MED / AGREEMENT GATEWAY</a>
        <div><a href="/experience/history">HISTORY</a> · <a href="/experience/network">NETWORK</a> · <a href="/experience/resources">RESOURCES</a> · <a href="/experience/questions">Q&A</a></div>
      </header>

      <section className={styles.gateway}>
        <div className={styles.rings} aria-hidden="true">
          {Array.from({length:7},(_,index)=><i key={index} style={{'--i':index} as CSSProperties}/>) }
          <div className={styles.core}/>
        </div>
        <div className={styles.content}>
          <span>PORTAL 05 / SECURE HANDOFF</span>
          <h1>Define the<br/>relationship.</h1>
          <p>The cinematic journey ends here. Your selected specialty and its matching service list move into the functional Occu-Med Forms workflow for facility details, proposed fees, provider acceptance, and Network Management review.</p>

          <div className={styles.confirm}>
            <div><b>{specialty}</b><small>{services.length} services are preloaded for this provider path.</small></div>
            <a href="#forms-workspace">ENTER FORMS WORKSPACE ↓</a>
          </div>

          <div className={styles.stages} aria-label="Provider agreement stages">
            {STAGES.map(([number,label])=><div className={styles.stage} key={number}><span>{number} / STAGE</span><b>{label}</b></div>)}
          </div>
        </div>
      </section>

      <section id="forms-workspace" className={styles.workspace}>
        <div className={styles.workspaceHead}>
          <div><span className={styles.label}>OCCU-MED FORMS / {specialty.toUpperCase()}</span><h2>Provider Fee Proposal</h2></div>
          <div><p>This open proposal captures facility information, available services, and proposed pricing. It does not anonymously execute a final Provider Service Agreement; accepted pricing proceeds through the secure invitation workflow.</p><div className={styles.serviceList}>{services.map(service=><span key={service}>{service}</span>)}</div></div>
        </div>
        <div className={styles.formShell}>
          <PricingAgreementBuilder specialty={specialty} services={services}/>
        </div>
      </section>
    </main>
  );
}
