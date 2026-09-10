'use client';

import { useEffect, useRef, useState } from 'react';
import HistoryWorld from '../immersive/HistoryWorld';
import styles from './HistoryExperience.module.css';

const MILESTONES=[
 {year:'1979',title:'The critical discovery.',copy:'Medical evidence becomes meaningful when it is understood against the work a person must perform.',image:'Founders copy.png',tag:'Research origin'},
 {year:'1979',title:'Founded in Honolulu.',copy:'Jim A. Johnson and Dr. Devonna M. Kaji connect medicine, law, and job-specific information.',image:'Founders.png',tag:'Honolulu, Hawai‘i'},
 {year:'2000',title:'The operating model formalizes.',copy:'Two decades of occupational-health work become a repeatable operating model.',image:'California - Hawaii Map.png',tag:'Connected operations'},
 {year:'2003',title:'Quality becomes a system.',copy:'Authorizations, records, corrections, and medical evaluation become one controlled workflow.',image:'EXAM REPORT.png',tag:'EXAMQA'},
 {year:'2006',title:'The method travels.',copy:'Deployment standards and destination requirements join the connected process.',image:'International Certification.png',tag:'International expansion'},
 {year:'2007',title:'Federal mission support.',copy:'The network expands while clinical providers remain focused on findings.',image:'Diverse Workforce.png',tag:'Federal programs'},
 {year:'2017',title:'Infrastructure becomes global.',copy:'A coordinated provider network makes consistent examinations possible at scale.',image:'International Network.png',tag:'50+ countries'},
 {year:'2018',title:'A new generation.',copy:'Operational leadership grows around the original job-centered principles.',image:'Diverse Healthcare Team Portrait (1).png',tag:'Leadership'},
 {year:'2021',title:'Continuity.',copy:'Job relevance, clinical quality, and defensible review remain the connective tissue.',image:'Diverse Workforce2.png',tag:'Next chapter'},
 {year:'TODAY',title:'One connected network.',copy:'The founding question now travels through a worldwide medical and dental network.',image:'Facilities.png',tag:'23,524 coordinates'},
] as const;

export default function HistoryExperience(){
 const root=useRef<HTMLElement>(null);const [progress,setProgress]=useState(0);
 useEffect(()=>{let frame=0;const update=()=>{frame=0;const el=root.current;if(!el)return;setProgress(Math.max(0,Math.min(1,-el.getBoundingClientRect().top/Math.max(1,el.offsetHeight-innerHeight))))};const queue=()=>{if(!frame)frame=requestAnimationFrame(update)};update();addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);return()=>{removeEventListener('scroll',queue);removeEventListener('resize',queue);cancelAnimationFrame(frame)}},[]);
 const active=Math.min(MILESTONES.length-1,Math.round(progress*(MILESTONES.length-1))),item=MILESTONES[active];
 const jump=(index:number)=>{const el=root.current;if(el)scrollTo({top:el.offsetTop+index/(MILESTONES.length-1)*(el.offsetHeight-innerHeight),behavior:'smooth'})};
 return <main ref={root} className={styles.root}><HistoryWorld progress={progress} milestones={MILESTONES}/><header className={styles.header}><a href="/experience#provider-portals">OCCU-MED® <span>/ LIVING ARCHIVE</span></a><div>1979 — TODAY</div><b>{String(active+1).padStart(2,'0')} / {MILESTONES.length}</b></header><aside className={styles.index}><span>EXHIBITION INDEX</span>{MILESTONES.map((m,i)=><button key={`${m.year}-${i}`} aria-current={active===i} onClick={()=>jump(i)}><i/><b>{m.year}</b><small>{m.tag}</small></button>)}</aside><section className={styles.caption}><span>ARCHIVE OBJECT {String(active+1).padStart(2,'0')}</span><div className={styles.year}>{item.year}</div><h1>{item.title}</h1><p>{item.copy}</p></section><div className={styles.progress}><i style={{transform:`scaleX(${progress})`}}/><span>SCROLL TO TRAVEL</span></div></main>;
}
