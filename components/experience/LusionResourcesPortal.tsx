'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './LusionResourcesPortal.module.css';

const RESOURCE = [
  ['Occupational Medicine','Physical examinations, audiometry, spirometry, EKG, fit testing, drug/alcohol testing, vaccination and occupational exam workflows.'],
  ['Dental','Dental-readiness examinations, required imaging, documentation and invoicing guidance.'],
  ['Laboratory','Collections, panels, handling requirements, results transmission and billing guidance.'],
  ['Cardiology','EKG, treadmill testing, consultation reports, tracings and interpretation requirements.'],
  ['Imaging','Authorized diagnostic studies, final reports and image-access instructions.'],
  ['Pharmacy / Vaccination','Requested immunizations, administration records, lot details and updated vaccine histories.'],
] as const;

export default function LusionResourcesPortal(){
  const transitionRef=useRef<HTMLElement|null>(null);
  const [selected,setSelected]=useState(0);

  useEffect(()=>{
    const section=transitionRef.current;if(!section)return;
    let raf=0;
    const update=()=>{raf=0;const r=section.getBoundingClientRect();const vh=window.innerHeight||1;const p=Math.max(0,Math.min(1,(vh-r.top)/Math.max(vh,r.height-vh*.15)));section.style.setProperty('--fall',p.toFixed(4))};
    const queue=()=>{if(!raf)raf=requestAnimationFrame(update)};update();window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue);return()=>{window.removeEventListener('scroll',queue);window.removeEventListener('resize',queue);if(raf)cancelAnimationFrame(raf)};
  },[]);

  const active=RESOURCE[selected];
  return <main className={styles.root}>
    <nav className={styles.topNav} aria-label="Provider portals"><a href="/experience#provider-world">OCCU-MED / PORTALS</a><div><a href="/experience/history">History</a><a href="/experience/network">Network</a><a data-active href="/experience/resources">Resources</a><a href="/experience/questions">Q&A</a><a href="/experience/agreement">Agreement</a></div><a href="/experience#provider-world">Return to hub ↗</a></nav>

    <section className={styles.lead}>
      <span>PORTAL 03 / PROVIDER RESOURCES</span>
      <h1>Where provider guidance<br/>becomes an immersive experience.</h1>
      <p>Keep scrolling. The interface gives way to the resource world.</p>
    </section>

    <section ref={transitionRef} className={styles.fallWorld}>
      <div className={styles.sticky}>
        <div className={styles.space} aria-hidden="true">{Array.from({length:90},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,top:`${(i*61)%100}%`,opacity:.2+(i%5)*.13}}/>)}</div>
        <div className={styles.portalRings} aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{'--ring':i} as CSSProperties}/>)}</div>
        <div className={styles.fallingAstronaut} aria-hidden="true"><div/><i/><b/><span/></div>
        <div className={styles.fallCopy}><span>STEP INTO A NEW WORLD</span><h2>Provider<br/>Resources</h2><p>Guidance organized around the specialty performing the work.</p></div>
      </div>
    </section>

    <section className={styles.workspace}>
      <header><span>CHOOSE YOUR SPECIALTY</span><h2>Start with what you do.</h2><p>Select a provider type and the workspace changes around the guidance that actually applies.</p></header>
      <div className={styles.specialtyGrid}>{RESOURCE.map((item,index)=><button key={item[0]} type="button" data-active={selected===index||undefined} onClick={()=>setSelected(index)}><small>{String(index+1).padStart(2,'0')}</small><strong>{item[0]}</strong><i>↘</i></button>)}</div>
      <article className={styles.activePath}><div><span>ACTIVE RESOURCE PATH</span><h3>{active[0]}</h3><p>{active[1]}</p></div><div className={styles.actions}><a href="/api/provider-resources/stateside-guide">Open provider guide ↓</a><a href={`/experience/agreement?specialty=${encodeURIComponent(active[0])}`}>Continue to pricing proposal →</a></div></article>
    </section>
  </main>;
}
