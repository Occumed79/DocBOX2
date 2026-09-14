'use client';

import Image from 'next/image';
import {useEffect,useMemo,useRef,useState} from 'react';
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

const clamp=(value:number)=>Math.max(0,Math.min(1,value));

export default function HistoryExperience(){
  const root=useRef<HTMLElement>(null);
  const target=useRef(0),rendered=useRef(0),frame=useRef(0);
  const[progress,setProgress]=useState(0);
  const[storyOpen,setStoryOpen]=useState(false);
  const[searchOpen,setSearchOpen]=useState(false);
  const[query,setQuery]=useState('');

  useEffect(()=>{
    const measure=()=>{
      const el=root.current;if(!el)return;
      const travel=Math.max(1,el.offsetHeight-innerHeight);
      const documentTop=scrollY+el.getBoundingClientRect().top;
      target.current=clamp((scrollY-documentTop)/travel);
    };
    const animate=()=>{
      frame.current=0;
      const delta=target.current-rendered.current;
      if(Math.abs(delta)<.00012){rendered.current=target.current;setProgress(target.current);return}
      rendered.current+=delta*.14;setProgress(rendered.current);frame.current=requestAnimationFrame(animate);
    };
    const queue=()=>{measure();if(!frame.current)frame.current=requestAnimationFrame(animate)};
    measure();rendered.current=target.current;setProgress(target.current);
    addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);
    return()=>{removeEventListener('scroll',queue);removeEventListener('resize',queue);if(frame.current)cancelAnimationFrame(frame.current)};
  },[]);

  const active=Math.min(M.length-1,Math.max(0,Math.round(progress*(M.length-1))));
  const jump=(i:number)=>{
    const el=root.current;if(!el)return;
    setSearchOpen(false);setStoryOpen(false);
    const documentTop=scrollY+el.getBoundingClientRect().top;
    const travel=Math.max(1,el.offsetHeight-innerHeight);
    scrollTo({top:documentTop+(i/(M.length-1))*travel,behavior:'smooth'});
  };
  const matches=useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(!q)return M.map((item,index)=>({item,index}));
    return M.map((item,index)=>({item,index})).filter(({item})=>item.join(' ').toLowerCase().includes(q));
  },[query]);
  const milestones=M.map(item=>({year:item[0],image:item[3]}));
  const current=M[active];

  return <main ref={root} className={styles.root} data-story-open={storyOpen||undefined}>
    <HistoryWorld progress={progress} milestones={milestones}/>

    <header className={styles.header}>
      <a className={styles.brand} href="/experience#provider-portals">OCCU-MED</a>
      <span className={styles.range}>HISTORY&nbsp;&nbsp; / &nbsp;&nbsp;1979 — TODAY</span>
      <div className={styles.tools}>
        <button onClick={()=>setSearchOpen(true)}>SEARCH</button>
        <a href="/experience#provider-portals">EXIT</a>
      </div>
    </header>

    <section className={styles.activeStory} key={active} aria-live="polite">
      <span>{String(active+1).padStart(2,'0')} / {String(M.length).padStart(2,'0')}</span>
      <h1>{current[1]}</h1>
      <p>{current[2]}</p>
      <button onClick={()=>setStoryOpen(true)}>OPEN STORY <b>↗</b></button>
    </section>

    <div className={styles.exploreCue} aria-hidden="true"><span>SCROLL TO EXPLORE</span><i/></div>

    <nav className={styles.timeline} aria-label="Occu-Med history timeline">
      <div className={styles.timelineTrack}><i style={{transform:`scaleX(${progress})`}}/></div>
      {M.map((item,i)=><button key={`${item[0]}-${i}`} onClick={()=>jump(i)} aria-current={i===active?'step':undefined} style={{left:`${(i/(M.length-1))*100}%`}}><i/><span>{item[0]}</span></button>)}
    </nav>

    {storyOpen&&<section className={styles.storyPanel} aria-modal="true" role="dialog" aria-label={`${current[0]} ${current[1]}`}>
      <div className={styles.storyMedia}><Image src={`/photos/${encodeURIComponent(current[3])}`} alt="" fill sizes="55vw" priority/></div>
      <article>
        <div className={styles.storyMeta}><span>OCCU-MED HISTORY</span><b>{current[0]}</b></div>
        <h2>{current[1]}</h2>
        <p>{current[2]}</p>
        <div className={styles.storyNav}>
          <button disabled={active===0} onClick={()=>jump(Math.max(0,active-1))}>← PREVIOUS</button>
          <button onClick={()=>setStoryOpen(false)}>BACK TO TIMELINE</button>
          <button disabled={active===M.length-1} onClick={()=>jump(Math.min(M.length-1,active+1))}>NEXT →</button>
        </div>
      </article>
    </section>}

    {searchOpen&&<section className={styles.searchPanel} aria-modal="true" role="dialog" aria-label="Search Occu-Med history">
      <header><b>SEARCH THE TIMELINE</b><button onClick={()=>setSearchOpen(false)}>CLOSE ×</button></header>
      <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="TYPE A YEAR OR MOMENT" aria-label="Search history"/>
      <div className={styles.results}>{matches.map(({item,index})=><button key={`${item[0]}-${index}`} onClick={()=>jump(index)}><span>{item[0]}</span><strong>{item[1]}</strong><b>→</b></button>)}</div>
    </section>}
  </main>;
}
