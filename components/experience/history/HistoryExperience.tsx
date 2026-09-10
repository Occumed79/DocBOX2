'use client';
import {useEffect,useRef,useState} from 'react';
import HistoryWorld from '../immersive/HistoryWorld';
import styles from './HistoryExperience.module.css';
const M=[
 ['1979','The critical discovery.','Medical evidence becomes meaningful when it is understood against the work a person must perform.','Founders copy.png'],
 ['1979','Founded in Honolulu.','Jim A. Johnson and Dr. Devonna M. Kaji connect medicine, law, and job-specific information.','Founders.png'],
 ['2000','The operating model formalizes.','Two decades of occupational-health work become a repeatable operating model.','California - Hawaii Map.png'],
 ['2003','Quality becomes a system.','Authorizations, records, corrections, and medical evaluation become one controlled workflow.','EXAM REPORT.png'],
 ['2006','The method travels.','Deployment standards and destination requirements join the connected process.','International Certification.png'],
 ['2007','Federal mission support.','The network expands while clinical providers remain focused on findings.','Diverse Workforce.png'],
 ['2017','Infrastructure becomes global.','A coordinated provider network makes consistent examinations possible at scale.','International Network.png'],
 ['2018','A new generation.','Operational leadership grows around the original job-centered principles.','Diverse Healthcare Team Portrait (1).png'],
 ['2021','Continuity.','Job relevance, clinical quality, and defensible review remain the connective tissue.','Diverse Workforce2.png'],
 ['TODAY','One connected network.','The founding question now travels through a worldwide medical and dental network.','Facilities.png'],
] as const;
export default function HistoryExperience(){
  const root=useRef<HTMLElement>(null);const[progress,setProgress]=useState(0);
  useEffect(()=>{let f=0;const update=()=>{f=0;const el=root.current;if(el)setProgress(Math.max(0,Math.min(1,-el.getBoundingClientRect().top/Math.max(1,el.offsetHeight-innerHeight))))};const q=()=>{if(!f)f=requestAnimationFrame(update)};update();addEventListener('scroll',q,{passive:true});addEventListener('resize',q);return()=>{removeEventListener('scroll',q);removeEventListener('resize',q);cancelAnimationFrame(f)}},[]);
  const active=Math.min(M.length-1,Math.round(progress*(M.length-1)));
  const jump=(i:number)=>{const el=root.current;if(el)scrollTo({top:el.offsetTop+i/(M.length-1)*(el.offsetHeight-innerHeight),behavior:'smooth'})};
  const milestones=M.map(item=>({year:item[0],image:item[3]}));
  return <main ref={root} className={styles.root}>
    <HistoryWorld progress={progress} milestones={milestones}/>
    <header className={styles.header}><a href="/experience#provider-portals">OCCU-MED / SPATIAL ARCHIVE</a><span>CAMERA TRAVEL&nbsp;&nbsp; {String(active+1).padStart(2,'0')} / {M.length}</span></header>
    <nav className={styles.years} aria-label="Jump to year">{M.map((x,i)=><button key={`${x[0]}${i}`} onClick={()=>jump(i)} aria-current={i===active}>{x[0]}</button>)}</nav>
    <section className={styles.copy} key={active}><span>ARCHIVE NODE / {String(active+1).padStart(2,'0')}</span><h1>{M[active][0]}</h1><h2>{M[active][1]}</h2><p>{M[active][2]}</p></section>
    <div className={styles.axis} aria-hidden="true"><i style={{height:`${progress*100}%`}}/></div>
    <div className={styles.coordinates} aria-hidden="true"><span>EXHIBITION PATH</span><b>{(progress*94.7).toFixed(1)} M</b></div>
    <div className={styles.scrollCue} aria-hidden="true"><i/>SCROLL TO TRAVEL</div>
  </main>
}
