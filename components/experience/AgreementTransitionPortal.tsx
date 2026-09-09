'use client';

import { Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import PricingAgreementBuilder from './PricingAgreementBuilder';
import styles from './AgreementTransitionPortal.module.css';

const AGREEMENT_SERVICES: Record<string,string[]> = {
  'Occupational Medicine':['Physical examinations','Audiometry','Spirometry / PFT','EKG','Drug & alcohol testing','Vaccinations'],
  Dental:['Comprehensive dental evaluation','Bitewing radiographs','Panoramic imaging','Dental readiness documentation'],
  Laboratory:['Routine bloodwork','Urinalysis','QuantiFERON-TB','Specimen collection'],
  Cardiology:['Resting 12-lead EKG','Treadmill stress testing','Cardiology consultation'],
  Imaging:['Chest X-ray','Diagnostic radiography','Ultrasound'],
  'Pharmacy / Vaccination':['Routine immunizations','Travel vaccines','Deployment vaccines'],
};

export default function AgreementTransitionPortal(){
  const transitionRef=useRef<HTMLElement|null>(null);
  const [specialty,setSpecialty]=useState('Occupational Medicine');

  useEffect(()=>{
    const requested=new URLSearchParams(window.location.search).get('specialty');
    if(requested&&AGREEMENT_SERVICES[requested])setSpecialty(requested);
  },[]);

  useEffect(()=>{
    const section=transitionRef.current;if(!section)return;
    let raf=0;
    const update=()=>{
      raf=0;const rect=section.getBoundingClientRect();const vh=window.innerHeight||1;
      const p=Math.max(0,Math.min(1,(vh-rect.top)/Math.max(vh,rect.height-vh*.15)));
      section.style.setProperty('--tunnel-scale',`${.45+p*2.25}`);
      section.style.setProperty('--tunnel-y',`${p*-10}vh`);
      section.style.setProperty('--copy-y',`${p*-6}vh`);
      section.style.setProperty('--copy-opacity',`${Math.max(0,1-p*1.3)}`);
      section.style.setProperty('--gate-brightness',`${.35+p*.65}`);
    };
    const queue=()=>{if(!raf)raf=requestAnimationFrame(update)};update();
    window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue);
    return()=>{window.removeEventListener('scroll',queue);window.removeEventListener('resize',queue);if(raf)cancelAnimationFrame(raf)};
  },[]);

  return <main className={styles.root}>
    <nav className={styles.topNav} aria-label="Provider portals"><a href="/experience#provider-world">OCCU-MED / PORTALS</a><div><a href="/experience/history">History</a><a href="/experience/network">Network</a><a href="/experience/resources">Resources</a><a href="/experience/questions">Q&A</a><a data-active href="/experience/agreement">Agreement</a></div><a href="/experience#provider-world">Return to hub ↗</a></nav>

    <section ref={transitionRef} className={styles.threshold}>
      <div className={styles.sticky}>
        <div className={styles.stars} aria-hidden="true">{Array.from({length:78},(_,i)=><i key={i} style={{left:`${(i*41)%100}%`,top:`${(i*67)%100}%`,opacity:.18+(i%5)*.12}}/>)}</div>
        <div className={styles.tunnel} aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i} style={{'--ring':i} as CSSProperties}/>)}</div>
        <div className={styles.gate} aria-hidden="true"><i/><b/><span/></div>
        <div className={styles.copy}><span>PORTAL 05 / PROVIDER AGREEMENT</span><h1>Define the<br/><em>relationship.</em></h1><p>The public journey ends with a Provider Fee Proposal for Network Management review. Accepted pricing can continue into the secure Occu-Med Forms agreement workflow.</p><a href="#proposal">Enter proposal ↓</a></div>
      </div>
    </section>

    <section className={styles.workspace} id="proposal">
      <header><span>OCCU-MED FORMS / {specialty.toUpperCase()}</span><h2>Provider Fee Proposal</h2><p>Document the facility, authorized services and proposed rates without changing the existing Forms workflow.</p></header>
      <Suspense fallback={<div className={styles.loading}>Preparing proposal…</div>}>
        <PricingAgreementBuilder specialty={specialty} services={AGREEMENT_SERVICES[specialty]} />
      </Suspense>
    </section>
  </main>;
}
