'use client';

import Image from 'next/image';
import {useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import HistoryWorld from '../immersive/HistoryWorld';
import styles from './HistoryExperience.module.css';

type Category='FOUNDATION'|'METHOD'|'GROWTH'|'OPERATIONS'|'GLOBAL'|'CULTURE';
type Kind='milestone'|'story';
type HistoryItem={
  id:string;
  kind:Kind;
  position:number;
  year:string;
  title:string;
  summary:string;
  body:string;
  category:Category;
  image?:string;
  related?:readonly string[];
  person?:string;
  detail?:string;
};

const ITEMS:readonly HistoryItem[]=[
  {id:'founded',kind:'milestone',position:.00,year:'1979',title:'Occu-Med is founded in Honolulu',summary:'A new placement model begins with the job—not a generic physical.',body:'Occu-Med was founded in Honolulu, Hawaii, in 1979 by attorney Jim A. Johnson together with Dr. Devonna M. Kaji. The company was created during a workers’ compensation cost crisis affecting public agencies and private employers. From the beginning, the idea was to interpret medical findings together with legal requirements and the actual demands of the job.',category:'FOUNDATION',image:'Founders.png',related:['discovery','traditional-exams','solution']},
  {id:'discovery',kind:'story',position:.055,year:'1979',title:'The Critical Discovery',summary:'State-funded research identifies a preventable pattern behind first-year workplace injuries.',body:'Research funded by the State of California linked a significant share of workplace injuries to employees hired with pre-existing medical conditions that increased their risk of harm once on the job. The research reframed placement as a compatibility question rather than a simple determination of whether someone was healthy.',category:'FOUNDATION',related:['traditional-exams','solution'],person:'THE RESEARCH QUESTION',detail:'41% of workplace injuries occur during an employee’s first year.'},
  {id:'traditional-exams',kind:'story',position:.105,year:'1979',title:'The Problem With Traditional Exams',summary:'The standard pre-placement physical lacked the job context needed for a defensible decision.',body:'General practitioners were being asked to make placement decisions without adequate information about job demands or the legal requirements tied to the position. Traditional local-clinic pre-placement exams could document health, but they were not designed to determine whether a medical finding mattered for a specific job.',category:'FOUNDATION',related:['discovery','solution'],person:'THE OLD MODEL',detail:'Healthy and job-ready are not the same question.'},
  {id:'solution',kind:'story',position:.155,year:'1979',title:'Occu-Med’s Solution',summary:'Medical evidence, legal requirements and job-specific demands become one decision framework.',body:'Occu-Med replaced the generic physical model with a research-based framework that combines specialist medical knowledge, valid job information, legal requirements and evidence-based review. The objective is an objective and consistent placement recommendation tied to the essential functions of the work.',category:'METHOD',related:['discovery','examqa'],person:'THE THREE-DIMENSIONAL MODEL',detail:'Medical findings + legal context + actual job demands.'},
  {id:'incorporated',kind:'milestone',position:.405,year:'2000',title:'Occu-Med, Ltd. is formally incorporated',summary:'A corporate structure is placed around two decades of occupational-health work.',body:'Occu-Med, Ltd. was formally incorporated as a Delaware corporation in October 2000, placing a corporate structure around the practice and methodology that had been developing since 1979.',category:'GROWTH',image:'California - Hawaii Map.png',related:['examqa']},
  {id:'examqa',kind:'story',position:.465,year:'2003',title:'EXAMQA Becomes a Training Ground',summary:'Quality assurance and the evaluation method become part of the company’s next stage of growth.',body:'In 2003, a Fresno State student joined the EXAMQA department as an intern and later moved into business-development leadership. The episode illustrates how deeply the company’s growth remained tied to understanding the examination, documentation and quality-assurance process itself.',category:'METHOD',related:['solution','international'],person:'EXAMQA',detail:'Job information, examination findings and compatibility assessment.'},
  {id:'international',kind:'milestone',position:.535,year:'2006',title:'The method goes international',summary:'Occu-Med expands evaluation services to international companies for the first time.',body:'In 2006, Occu-Med expanded its evaluation services to international companies. The same job-centered evaluation model now had to operate across borders, provider systems, deployment requirements and destination-specific medical standards.',category:'GLOBAL',image:'International Certification.png',related:['federal','global-network']},
  {id:'federal',kind:'milestone',position:.585,year:'2007',title:'Federal mission support opens',summary:'Federal registration creates a direct path into DoD and DoS deployment-readiness work.',body:'Occu-Med formally registered as a U.S. federal contractor in October 2007. That milestone opened the door to direct Department of Defense and Department of State work and helped establish the deployment-readiness work that became a major part of the company’s international operations.',category:'GLOBAL',image:'Diverse Workforce.png',related:['international','growth-2017']},
  {id:'growth-2017',kind:'milestone',position:.735,year:'~2017',title:'Global infrastructure at scale',summary:'International coverage and mission support draw outside recognition.',body:'By the mid-2010s, Occu-Med had built pre-placement infrastructure across more than 36 countries. A Camp Arifjan, Kuwait mission included more than 2,500 evaluations as well as medical-clinic staffing and training, and the company was recognized with a Rising Star award from Fresno State’s Institute for Family Business.',category:'GROWTH',image:'International Network.png',related:['global-network','leadership-2018']},
  {id:'leadership-2018',kind:'milestone',position:.775,year:'2018',title:'The next generation moves into operations',summary:'Leadership transition begins while the founding methodology remains intact.',body:'In 2018, the next generation of company leadership moved into the Director of Operations role. The transition expanded operational leadership around the same core model: job information, clinical evidence, quality assurance and defensible medical review.',category:'GROWTH',image:'Diverse Healthcare Team Portrait (1).png',related:['leadership-2021']},
  {id:'leadership-2021',kind:'milestone',position:.835,year:'2021',title:'Leadership continuity',summary:'The next-generation transition reaches the President role.',body:'In 2021, the next generation moved into the President role while Occu-Med continued building Network Management, Scheduling, Provider Relations, ExamQA and medical-review infrastructure around the original placement methodology.',category:'GROWTH',image:'Diverse Workforce2.png',related:['today']},
  {id:'process',kind:'story',position:.885,year:'TODAY',title:'From Referral to Outcome',summary:'Scheduling, clinical care, records, QA and medical review operate as one connected case process.',body:'A referral begins the medical-evaluation process. Scheduling confirms the examinee’s availability and clinic appointment, the clinic performs the authorized examination, Provider Relations obtains the records, ExamQA verifies completeness and accuracy, and the Medical Review Team evaluates the findings against the requirements of the job or deployment. Only the outcome—not confidential medical detail—is communicated to the employer.',category:'OPERATIONS',related:['standards','services'],person:'THE OPERATING CHAIN',detail:'Referral → appointment → exam → records → QA → medical review → outcome.'},
  {id:'standards',kind:'story',position:.915,year:'TODAY',title:'Standards Travel With the Work',summary:'Different jobs and destinations bring different medical and occupational requirements.',body:'Occu-Med coordinates evaluations under deployment, public-safety and industry-specific standards that can include DoD and DoS requirements, FMCSA/DOT, POST, NFPA, FAA, USCG, OSHA medical-surveillance programs and OEUK standards. The applicable guideline depends on the position, assignment and operating environment.',category:'OPERATIONS',related:['process','services'],person:'MEDICAL & OCCUPATIONAL STANDARDS',detail:'The job and operating environment determine the applicable criteria.'},
  {id:'services',kind:'story',position:.942,year:'TODAY',title:'One Method, Multiple Service Lines',summary:'The original placement principle now supports a broader set of occupational-health programs.',body:'Current service lines include pre-placement evaluations, deployment medical readiness, fitness-for-duty and return-to-work evaluations, periodic medical evaluations, immunizations, embassy-linked medical clearance and post-deployment health assessment. Each traces back to the same founding principle: medical judgment has to be informed by occupational and legal context.',category:'OPERATIONS',related:['process','global-network'],person:'CURRENT SERVICES',detail:'The service changes; the job-centered methodology remains.'},
  {id:'global-network',kind:'story',position:.965,year:'TODAY',title:'A Global Provider Network',summary:'The operating model is supported by medical and dental facilities around the world.',body:'Current company materials describe more than 15,000 affiliated medical and dental facilities across more than 50 countries, supported internally by Network Management, Scheduling and Provider Relations teams. The network gives the same operating model somewhere to land across domestic and international assignments.',category:'GLOBAL',related:['services','values'],person:'GLOBAL REACH',detail:'15,000+ facilities across 50+ countries.'},
  {id:'values',kind:'story',position:.983,year:'TODAY',title:'The Values Behind the Work',summary:'Six operating values define how the system is carried from referral to final determination.',body:'Humility. Positivity. Customer service. Quality. Integrity. Diligence. These six core values describe the culture expected around the process—from the first provider interaction through quality assurance and the final medical recommendation.',category:'CULTURE',related:['global-network','today'],person:'CORE VALUES',detail:'Humility · Positivity · Customer Service · Quality · Integrity · Diligence.'},
  {id:'today',kind:'milestone',position:1,year:'TODAY',title:'The founding principle is still the center',summary:'Nearly five decades later, safe placement is still treated as more than a medical question.',body:'Today, roughly 46 years after its founding, Occu-Med coordinates employment medical evaluations through a global network spanning more than 50 countries. Current company materials describe more than one million employees evaluated annually, more than 15,000 network locations and more than 500 public-safety clients. The scale has changed; the original 1979 idea has not.',category:'GROWTH',image:'Facilities.png',related:['process','global-network','values']},
] as const;

const CATEGORIES:readonly ('ALL'|Category)[]=['ALL','FOUNDATION','METHOD','GROWTH','OPERATIONS','GLOBAL','CULTURE'];
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const smooth=(t:number)=>{const x=clamp(t);return x*x*(3-2*x)};
const waveY=(p:number)=>52+7.2*Math.sin(p*11.4+1.15)+2.8*Math.sin(p*27.8+.42);

export default function HistoryExperience(){
  const root=useRef<HTMLElement>(null);
  const drag=useRef<{x:number;value:number}|null>(null);
  const progressRef=useRef(0),targetRef=useRef(0),rafRef=useRef(0);
  const transitionRaf=useRef(0),transitionStart=useRef(0);
  const storyScroller=useRef<HTMLDivElement>(null);
  const [progress,setProgress]=useState(0);
  const [hovered,setHovered]=useState<string|null>(null);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [transition,setTransition]=useState(0);
  const [storyScroll,setStoryScroll]=useState(0);
  const [filterOpen,setFilterOpen]=useState(false);
  const [filter,setFilter]=useState<'ALL'|Category>('ALL');
  const [sound,setSound]=useState(false);
  const [accessible,setAccessible]=useState(false);

  const selected=useMemo(()=>ITEMS.find(item=>item.id===selectedId)??null,[selectedId]);
  const filtered=useMemo(()=>filter==='ALL'?ITEMS:ITEMS.filter(item=>item.category===filter),[filter]);
  const active=useMemo(()=>filtered.reduce((best,item)=>Math.abs(item.position-progress)<Math.abs(best.position-progress)?item:best,filtered[0]??ITEMS[0]),[filtered,progress]);
  const related=useMemo(()=>selected?.related?.map(id=>ITEMS.find(item=>item.id===id)).filter(Boolean) as HistoryItem[]|undefined,[selected]);

  useEffect(()=>{
    const animate=()=>{
      const d=targetRef.current-progressRef.current;
      progressRef.current+=d*.085;
      if(Math.abs(d)<.00008)progressRef.current=targetRef.current;
      setProgress(progressRef.current);
      rafRef.current=requestAnimationFrame(animate);
    };
    rafRef.current=requestAnimationFrame(animate);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);

  useEffect(()=>{
    const node=root.current;if(!node||selectedId)return;
    const onWheel=(event:WheelEvent)=>{
      event.preventDefault();
      targetRef.current=clamp(targetRef.current+Math.max(-5,Math.min(5,event.deltaY*.01))*.0085);
    };
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='ArrowRight'||event.key==='PageDown'){event.preventDefault();targetRef.current=clamp(targetRef.current+.035)}
      if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();targetRef.current=clamp(targetRef.current-.035)}
      if(event.key==='Home'){event.preventDefault();targetRef.current=0}
      if(event.key==='End'){event.preventDefault();targetRef.current=1}
    };
    node.addEventListener('wheel',onWheel,{passive:false});window.addEventListener('keydown',onKey);
    return()=>{node.removeEventListener('wheel',onWheel);window.removeEventListener('keydown',onKey)};
  },[selectedId]);

  useEffect(()=>()=>{if(transitionRaf.current)cancelAnimationFrame(transitionRaf.current)},[]);

  const focusItem=(item:HistoryItem)=>{
    targetRef.current=item.position;
  };

  const openItem=(item:HistoryItem)=>{
    targetRef.current=item.position;
    setHovered(null);setFilterOpen(false);
    if(selected?.kind==='story'&&item.kind==='story'){
      setSelectedId(item.id);setStoryScroll(0);setTransition(1);
      requestAnimationFrame(()=>storyScroller.current?.scrollTo({top:0,behavior:'smooth'}));
      return;
    }
    setSelectedId(item.id);setStoryScroll(0);setTransition(0);
    requestAnimationFrame(()=>storyScroller.current?.scrollTo({top:0}));
    transitionStart.current=performance.now();
    const tick=(now:number)=>{
      const t=clamp((now-transitionStart.current)/2800);
      setTransition(smooth(t));
      if(t<1)transitionRaf.current=requestAnimationFrame(tick);
    };
    transitionRaf.current=requestAnimationFrame(tick);
  };

  const closeStory=()=>{
    if(transitionRaf.current)cancelAnimationFrame(transitionRaf.current);
    const started=performance.now();
    const from=transition;
    const tick=(now:number)=>{
      const t=clamp((now-started)/850);
      setTransition(from*(1-smooth(t)));
      if(t<1)transitionRaf.current=requestAnimationFrame(tick);
      else{setSelectedId(null);setStoryScroll(0)}
    };
    transitionRaf.current=requestAnimationFrame(tick);
  };

  const onStoryScroll=()=>{
    const el=storyScroller.current;if(!el)return;
    setStoryScroll(clamp(el.scrollTop/Math.max(1,el.clientHeight)));
  };

  const pointerDown=(event:React.PointerEvent<HTMLElement>)=>{
    if(selectedId)return;
    drag.current={x:event.clientX,value:targetRef.current};
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const pointerMove=(event:React.PointerEvent<HTMLElement>)=>{
    if(!drag.current||selectedId)return;
    targetRef.current=clamp(drag.current.value-(event.clientX-drag.current.x)/Math.max(500,innerWidth)*.92);
  };
  const pointerUp=()=>{drag.current=null};

  const bgMix=progress;
  return <main ref={root} className={styles.root} style={{'--history-progress':bgMix} as CSSProperties} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
    <HistoryWorld progress={progress} transition={transition} mode={selected?.kind??'timeline'} storyScroll={storyScroll} seed={selected?ITEMS.indexOf(selected):0}/>
    <div className={styles.vignette}/>

    <header className={styles.header}>
      <a className={styles.brand} href="/experience#provider-portals"><span>OCCU-MED</span><i/></a>
      <button className={styles.backTop} onClick={selected?closeStory:()=>location.assign('/experience#provider-portals')}>{selected?'BACK TO EXPERIENCE':'HISTORY & EVOLUTION'}</button>
      <button className={styles.sound} aria-pressed={sound} onClick={()=>setSound(v=>!v)}>{sound?'SOUND ON':'SOUND OFF'}</button>
    </header>

    {!selected&&<>
      <div className={styles.filterWrap} data-open={filterOpen||undefined}>
        <button className={styles.filterCurrent} onClick={()=>setFilterOpen(v=>!v)}><span>{filter==='ALL'?'FILTER':filter}</span><i/></button>
        <div className={styles.filterList}>{CATEGORIES.map((cat,index)=><button key={cat} style={{'--delay':`${index*.055}s`} as CSSProperties} data-active={filter===cat||undefined} onClick={()=>{setFilter(cat);setFilterOpen(false)}}>{cat}</button>)}</div>
      </div>

      <section className={styles.timelineOverlay} aria-label="Occu-Med history timeline">
        {ITEMS.map(item=>{
          const dx=(item.position-progress)*128;
          const x=50+dx;
          const y=waveY(item.position)-Math.sin(progress*5.4+item.position*8)*1.6;
          const visible=x>-16&&x<116;
          const dim=filter!=='ALL'&&item.category!==filter;
          const isHover=hovered===item.id;
          return <button key={item.id} className={item.kind==='milestone'?styles.milestoneNode:styles.storyNode} data-hover={isHover||undefined} data-dim={dim||undefined} onMouseEnter={()=>setHovered(item.id)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(item.id)} onBlur={()=>setHovered(null)} onClick={e=>{e.stopPropagation();openItem(item)}} style={{left:`${x}%`,top:`${y}%`,opacity:visible?(dim?.12:1):0,pointerEvents:visible&&!dim?'auto':'none'} as CSSProperties}>
            <i className={styles.nodeCore}/>
            <i className={styles.nodeRing}/><i className={styles.nodeRing2}/><i className={styles.nodeRing3}/>
            <span className={styles.nodeLabel}><b>{item.year}</b><strong>{item.title}</strong><em>{item.category}</em></span>
          </button>;
        })}
      </section>

      <div className={styles.navigationHint}><span>DRAG OR SCROLL TO EXPLORE</span><i/></div>
      <div className={styles.progressYears}><span>1979</span><i><b style={{transform:`scaleX(${progress})`}}/></i><span>TODAY</span></div>
      <button className={styles.accessibleToggle} onClick={()=>setAccessible(true)}>MILESTONES / STORIES</button>
    </>}

    {selected&&<div ref={storyScroller} className={styles.storyScroller} onScroll={onStoryScroll} data-kind={selected.kind}>
      <section className={selected.kind==='story'?styles.bubbleHero:styles.milestoneHero}>
        {selected.kind==='story'?<>
          <svg className={styles.relatedPaths} viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true"><path d="M0,325 C190,405 280,215 430,305 S720,420 1000,292"/><path d="M0,265 C150,190 265,385 438,292 S720,162 1000,240"/></svg>
          <div className={styles.bubbleTitle}><span>{selected.category}</span><h1>{selected.title}</h1></div>
          <div className={styles.bubbleMeta}><i/><div><b>{selected.person??selected.year}</b><span>{selected.detail??selected.summary}</span></div></div>
          {related?.slice(0,2).map((item,index)=><button key={item.id} className={styles.relatedBubble} data-side={index===0?'left':'right'} onClick={()=>openItem(item)}><i/><strong>{item.title}</strong><span>{item.category}</span></button>)}
          <div className={styles.scrollRead}>SCROLL TO READ CONTENT <i/></div>
        </>:<>
          <div className={styles.milestoneEyebrow}><span>{selected.year}</span><b>{selected.category}</b></div>
          <h1>{selected.title}</h1>
          <p>{selected.summary}</p>
          {selected.image&&<figure className={styles.milestoneImage}><Image src={`/photos/${encodeURIComponent(selected.image)}`} alt="" fill sizes="74vw" priority/></figure>}
          <div className={styles.scrollRead}>SCROLL TO READ CONTENT <i/></div>
        </>}
      </section>

      <article className={styles.storyContent}>
        <div className={styles.storyContentGrid}>
          <aside><span>{selected.kind==='story'?'COMPANY STORY':'MILESTONE'}</span><b>{selected.year}</b><em>{selected.category}</em></aside>
          <div><h2>{selected.title}</h2><p>{selected.body}</p></div>
        </div>
        {related&&related.length>0&&<section className={styles.relatedMemories}><h3>Related memories</h3><div>{related.map(item=><button key={item.id} onClick={()=>openItem(item)}><i/><span>{item.year}</span><strong>{item.title}</strong><em>{item.category}</em></button>)}</div></section>}
        <footer className={styles.storyFooter}><button onClick={closeStory}>BACK TO TIMELINE</button><a href="/experience#provider-portals">EXIT HISTORY & EVOLUTION</a></footer>
      </article>
    </div>}

    {accessible&&<section className={styles.accessiblePanel} role="dialog" aria-modal="true" aria-label="History milestones and company stories">
      <header><div><span>OCCU-MED</span><h2>History & Evolution</h2></div><button onClick={()=>setAccessible(false)}>CLOSE ×</button></header>
      <div className={styles.accessibleTabs}><b>MILESTONES</b><span>COMPANY STORIES</span></div>
      <div className={styles.accessibleRows}>{ITEMS.map(item=><button key={item.id} onClick={()=>{setAccessible(false);focusItem(item);openItem(item)}}><span>{item.kind==='milestone'?item.year:'STORY'}</span><strong>{item.title}</strong><em>{item.category}</em><b>→</b></button>)}</div>
    </section>}
  </main>;
}
