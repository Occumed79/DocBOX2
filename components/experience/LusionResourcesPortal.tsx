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
    const update=()=>{
      raf=0;
      const r=section.getBoundingClientRect();const vh=window.innerHeight||1;
      const p=Math.max(0,Math.min(1,(vh-r.top)/Math.max(vh,r.height-vh*.15)));
      section.style.setProperty('--space-y',`${p*-8}vh`);
      section.style.setProperty('--space-scale',`${1+p*.18}`);
      section.style.setProperty('--ring-scale',`${.38+p*2.1}`);
      section.style.setProperty('--astronaut-y',`${p*42}vh`);
      section.style.setProperty('--astronaut-rotate',`${(p-.5)*22}deg`);
      section.style.setProperty('--astronaut-scale',`${1-p*.25}`);
      section.style.setProperty('--copy-opacity',`${Math.max(0,1-p*1.35)}`);
      section.style.setProperty('--copy-y',`${p*-5}vh`);
    };
    const queue=()=>{if(!raf)raf=requestAnimationFrame(update)};
    update();window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue);
    return()=>{window.removeEventListener('scroll',queue);window.removeEventListener('resize',queue);if(raf)cancelAnimationFrame(raf)};
  },[]);

  const active=RESOURCE[selected];
  return <main className={styles.root}>
    <nav className={styles.topNav} aria-label="Provider portals"><a href="/experience#provider-world">OCCU-MED / PORTALS</a><div><a href="/experience/history">History</a><a href="/experience/network">Network</a><a data-active href="/experience/resources">Resources</a><a href="/experience/questions">Q&A</a><a href="/experience/agreement">Agreement</a></div><a href="/experience#provider-world">Return to hub ↗</a></nav>

    <section className={styles.lead}>
      <span>PORTAL 03 / PROVIDER RESOURCES</span>
      <h1>Where provider guidance<br/>becomes an immersive experience.</h1>
      <p>Keep scrolling. The interface gives way to the resource world.</p>
    </section>

    <section ref={transitionRef} className={styles.fallWorld} style={{'--space-y':'0vh','--space-scale':'1','--ring-scale':'.38','--astronaut-y':'0vh','--astronaut-rotate':'-11deg','--astronaut-scale':'1','--copy-opacity':'1','--copy-y':'0vh'} as CSSProperties}>
      <div className={styles.sticky}>
        <div className={styles.space} style={{transform:'translateY(var(--space-y)) scale(var(--space-scale))'}} aria-hidden="true">{Array.from({length:90},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,top:`${(i*61)%100}%`,opacity:.2+(i%5)*.13}}/>)}</div>
        <div className={styles.portalRings} style={{transform:'translate(-50%, -50%) perspective(900px) rotateX(69deg) scale(var(--ring-scale))'}} aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{'--ring':i} as CSSProperties}/>)}</div>
        <div className={styles.fallingAstronaut} style={{transform:'translate(-50%, var(--astronaut-y)) rotate(var(--astronaut-rotate)) scale(var(--astronaut-scale))'}} aria-hidden="true"><div/><i/><b/><span/></div>
        <div className={styles.fallCopy} style={{opacity:'var(--copy-opacity)',transform:'translateY(var(--copy-y))'}}><span>STEP INTO A NEW WORLD</span><h2>Provider<br/>Resources</h2><p>Guidance organized around the specialty performing the work.</p></div>
      </div>
    </section>

    <section className={styles.workspace}>
      <header><span>CHOOSE YOUR SPECIALTY</span><h2>Start with what you do.</h2><p>Select a provider type and the workspace changes around the guidance that actually applies.</p></header>
      <div className={styles.specialtyGrid}>{RESOURCE.map((item,index)=><button key={item[0]} type="button" data-active={selected===index||undefined} onClick={()=>setSelected(index)}><small>{String(index+1).padStart(2,'0')}</small><strong>{item[0]}</strong><i>↘</i></button>)}</div>
      <article className={styles.activePath}><div><span>ACTIVE RESOURCE PATH</span><h3>{active[0]}</h3><p>{active[1]}</p></div><div className={styles.actions}><a href="/api/provider-resources/stateside-guide">Open provider guide ↓</a><a href={`/experience/agreement?specialty=${encodeURIComponent(active[0])}`}>Continue to pricing proposal →</a></div></article>
    </section>
  </main>;
}
