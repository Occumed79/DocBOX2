'use client';

import Image from 'next/image';
import {useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import HistoryWorld from '../immersive/HistoryWorld';
import MemoryBubbleScene from './MemoryBubbleScene';
import styles from './HistoryExperience.module.css';

type Moment=readonly [year:string,title:string,summary:string,image:string,story:string,major?:boolean];
const M:readonly Moment[]=[
 ['1979','The critical discovery.','State-funded research points to a preventable pattern behind first-year workplace injuries.','Founders copy.png','Attorney Jim A. Johnson’s State of California-funded research linked a significant share of workplace injuries to employees hired with pre-existing medical conditions that increased their risk once on the job. The finding reframed placement as more than a question of whether someone was simply “healthy.”'],
 ['1979','Founded in Honolulu.','Medicine, legal requirements, and the actual job become one placement question.','Founders.png','Occu-Med was founded in Honolulu, Hawaii, in 1979. The company’s core idea was to combine medical findings with legal requirements and job-specific demands so placement decisions reflected the work a person actually had to perform.',true],
 ['2000','A formal corporate structure.','Two decades of work are placed inside Occu-Med, Ltd.','California - Hawaii Map.png','In October 2000, Occu-Med, Ltd. was formally incorporated as a Delaware corporation, putting a corporate structure around the occupational-health practice that had been developing since 1979.'],
 ['2003','EXAMQA becomes a training ground.','A Fresno State student joins the EXAMQA department and later moves into business-development leadership.','EXAM REPORT.png','In 2003, a Fresno State student joined Occu-Med’s EXAMQA department as an intern. By 2006 that employee had moved into business-development leadership, connecting the company’s quality-assurance operating knowledge with its next phase of growth.'],
 ['2006','The method goes international.','Occu-Med expands its evaluation services to international companies for the first time.','International Certification.png','In 2006, Occu-Med expanded its evaluation services to international companies for the first time. The same job-centered evaluation model now had to travel across borders, provider systems, deployment requirements, and destination-specific medical standards.',true],
 ['2007','Federal mission support opens.','Federal registration creates a direct path into DoD and DoS deployment-readiness work.','Diverse Workforce.png','Occu-Med registered as a U.S. federal contractor in October 2007. That milestone opened the door to direct Department of Defense and Department of State work and helped establish the deployment-readiness business that remains central to the company’s international operations.',true],
 ['2017','Global infrastructure at scale.','By the mid-2010s, the provider network and overseas operating model are drawing outside recognition.','International Network.png','By roughly 2017, company reporting described pre-placement infrastructure across more than 36 countries. A major Camp Arifjan, Kuwait mission included thousands of evaluations and operational medical support, while Occu-Med also received a Rising Star award from Fresno State’s Institute for Family Business.'],
 ['2018','The next generation moves into operations.','Leadership transition begins while the original job-centered methodology remains intact.','Diverse Healthcare Team Portrait (1).png','In 2018, the next generation of company leadership moved into the Director of Operations role. The transition expanded operational leadership around the same core model: job information, clinical evidence, quality assurance, and defensible medical review.'],
 ['2021','Leadership continuity.','The next-generation transition reaches the President role.','Diverse Workforce2.png','In 2021, the next generation moved into the President role. The company continued building Network Management, Scheduling, Provider Relations, Exam QA, and medical-review infrastructure around the original placement methodology.',true],
 ['TODAY','One connected operating network.','The original 1979 question now moves through a global provider and review system.','Facilities.png','Today the same founding principle runs through the referral lifecycle: authorization, scheduling, clinical examination, record return, quality assurance, medical review, and final recommendation. The live provider atlas currently maps 23,524 usable medical, dental, diagnostic, and pharmacy coordinates.',true],
] as const;

const clamp=(value:number)=>Math.max(0,Math.min(1,value));

export default function HistoryExperience(){
  const root=useRef<HTMLElement>(null);
  const target=useRef(0),rendered=useRef(0),frame=useRef(0);
  const[progress,setProgress]=useState(0);
  const[storyOpen,setStoryOpen]=useState(false);
  const[searchOpen,setSearchOpen]=useState(false);
  const[query,setQuery]=useState('');
  const[detailProgress,setDetailProgress]=useState(0);

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
  const seek=(i:number)=>{
    const el=root.current;if(!el)return;
    const documentTop=scrollY+el.getBoundingClientRect().top;
    const travel=Math.max(1,el.offsetHeight-innerHeight);
    scrollTo({top:documentTop+(i/(M.length-1))*travel,behavior:'smooth'});
  };
  const jump=(i:number)=>{setSearchOpen(false);setStoryOpen(false);seek(i)};
  const filter=(next:string)=>{
    setQuery(next);const q=next.trim().toLowerCase();if(!q)return;
    const nearest=M.map((item,index)=>({index,hit:item.join(' ').toLowerCase().includes(q)})).filter(x=>x.hit).sort((a,b)=>Math.abs(a.index-active)-Math.abs(b.index-active))[0];
    if(nearest)seek(nearest.index);
  };
  const matches=useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(!q)return M.map((item,index)=>({item,index}));
    return M.map((item,index)=>({item,index})).filter(({item})=>item.join(' ').toLowerCase().includes(q));
  },[query]);
  const milestones=useMemo(()=>M.map(item=>({year:item[0],major:!!item[5]})),[]);
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
      <button onClick={()=>{setDetailProgress(0);setStoryOpen(true)}}>OPEN STORY <b>↗</b></button>
    </section>

    <div className={styles.exploreCue} aria-hidden="true"><span>SCROLL TO EXPLORE</span><i/></div>

    <nav className={styles.timeline} aria-label="Occu-Med history timeline">
      <div className={styles.timelineTrack}><i style={{transform:`scaleX(${progress})`}}/></div>
      {M.map((item,i)=><button key={`${item[0]}-${i}`} onClick={()=>jump(i)} aria-current={i===active?'step':undefined} style={{left:`${(i/(M.length-1))*100}%`}}><i/><span>{item[0]}</span></button>)}
    </nav>

    {storyOpen&&<section className={`${styles.storyPanel} ${current[5]?styles.milestonePanel:styles.memoryPanel}`} aria-modal="true" role="dialog" aria-label={`${current[0]} ${current[1]}`} onScroll={e=>setDetailProgress(Math.min(1,e.currentTarget.scrollTop/Math.max(1,innerHeight*.72)))} style={{'--detail':detailProgress} as CSSProperties}>
      {!current[5]&&<div className={styles.bubbleStage} aria-hidden="true"><MemoryBubbleScene/><div className={styles.memoryBubble}><Image src={`/photos/${encodeURIComponent(current[3])}`} alt="" fill sizes="48vw" priority/><i/></div><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M49 48 C32 32 24 30 15 22 M52 51 C68 40 77 31 88 29 M48 54 C34 69 25 75 18 85"/></svg>{[active-1,active+1,active+2].map((n,j)=>{const i=(n+M.length)%M.length;return <button tabIndex={-1} key={i} className={styles.satellite} style={{'--sat':j} as CSSProperties}><span>{M[i][0]}</span>{M[i][1]}</button>})}<div className={styles.memoryControls}><button onClick={()=>setStoryOpen(false)}>← BACK TO EXPERIENCE</button><span>SCROLL TO READ CONTENT <i/></span></div><div className={styles.memoryTitle}><span>{current[0]}</span><h2>{current[1]}</h2></div></div>}
      <div className={styles.storyMedia}><Image src={`/photos/${encodeURIComponent(current[3])}`} alt="" fill sizes="55vw" priority/></div>
      <article className={styles.editorial}>
        <div className={styles.storyMeta}><span>OCCU-MED HISTORY</span><b>{current[0]}</b></div>
        <h2>{current[1]}</h2>
        <p>{current[4]}</p>
        <div className={styles.storyNav}>
          <button disabled={active===0} onClick={()=>jump(Math.max(0,active-1))}>← PREVIOUS</button>
          <button onClick={()=>setStoryOpen(false)}>BACK TO TIMELINE</button>
          <button disabled={active===M.length-1} onClick={()=>jump(Math.min(M.length-1,active+1))}>NEXT →</button>
        </div>
      </article>
    </section>}

    {searchOpen&&<section className={styles.searchPanel} aria-modal="true" role="dialog" aria-label="Search Occu-Med history">
      <header><b>SEARCH THE TIMELINE</b><button onClick={()=>setSearchOpen(false)}>CLOSE ×</button></header>
      <input autoFocus value={query} onChange={e=>filter(e.target.value)} placeholder="TYPE A YEAR OR MOMENT" aria-label="Search history"/>
      <div className={styles.results}>{matches.map(({item,index})=><button key={`${item[0]}-${index}`} onClick={()=>jump(index)}><span>{item[0]}</span><strong>{item[1]}</strong><b>→</b></button>)}</div>
    </section>}
  </main>;
}
