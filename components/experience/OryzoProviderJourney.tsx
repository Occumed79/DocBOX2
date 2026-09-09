'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import styles from './OryzoProviderJourney.module.css';

const STORY = [
  { id:'origin', label:'01 / ORIGIN', title:'The question came first.', body:'Research began before Occu-Med existed. The problem was not simply whether someone was healthy, but whether medical evidence could be understood in the context of the work.', images:['Founders.png','Founders copy.png','California - Hawaii Map.png'] },
  { id:'problem', label:'02 / THE PROBLEM', title:'A physical alone was never enough.', body:'Traditional examinations could describe health without explaining what a finding meant for the actual physical and environmental demands of a job.', images:['Concerned provider.png'] },
  { id:'method', label:'03 / THE METHOD', title:'Job. Medical. Compatibility.', body:'The model brings valid job information, a job-related medical examination, and a compatibility assessment into the same decision process.', images:['EMPLOYEE ID.png','Diverse Healthcare Team Portrait (1).png'] },
  { id:'referral', label:'04 / REFERRAL', title:'One referral enters the system.', body:'Scheduling connects the examinee, requested scope and provider location. The clinic receives the authorization and forms needed for that specific case.', images:['Friendly Medical Appointment Call.png'] },
  { id:'clinical', label:'05 / CLINICAL SERVICES', title:'Different services. One coordinated case.', body:'Medical examination, blood collection, dental readiness, audiometry and vaccination can all move through the same coordinated referral.', images:['Medical Eval.png','Calm Clinic Blood Draw (1).png','Dental Eval.png','Audiometry.png','Pharmacist Administering a Vaccine(1) (1).png'] },
  { id:'records', label:'06 / RESULTS + QA', title:'The appointment is not the finish line.', body:'Reports, tracings, images and results return into one case. Missing records are followed and documentation is checked before medical review.', images:['EXAM REPORT.png'] },
  { id:'review', label:'07 / MEDICAL REVIEW', title:'Evidence becomes an outcome.', body:'The provider documents the clinical findings. Occu-Med evaluates them against the applicable job, program or deployment requirements.', images:['Fitness Determination.png'] },
  { id:'work', label:'08 / THE WORK', title:'Different work creates different demands.', body:'Industrial, technical, public-safety and deployment roles do not ask the same things of the body. The job remains central to the medical question.', images:['Diverse Workforce.png','Diverse Workforce2.png'] },
  { id:'deployment', label:'09 / INTERNATIONAL', title:'Readiness crosses borders.', body:'Deployment standards, destination requirements, medical documentation and immunization needs move through one connected readiness process.', images:['International Certification.png','Vaccine Schedule.png'] },
  { id:'network', label:'10 / THE NETWORK', title:'Every referral needs a place to land.', body:'A distributed provider infrastructure gives the operating model reach across the United States and internationally.', images:['Facilities.png','International Network.png'] },
  { id:'values', label:'11 / THE STANDARD', title:'How the work gets done matters.', body:'Humility. Positivity. Customer Service. Quality. Integrity. Diligence.', images:['Corevalue.png','Corevalue2.png','Corevalue3.png','Corevalue4.png','Corevalue5.png','Corevalue6.png'] },
] as const;

const PORTALS = [
  {id:'history',href:'/experience/history',number:'01',title:'History',note:'Enter the archive'},
  {id:'network',href:'/experience/network',number:'02',title:'Network',note:'Explore provider coverage'},
  {id:'resources',href:'/experience/resources',number:'03',title:'Resources',note:'Choose your specialty'},
  {id:'questions',href:'/experience/questions',number:'04',title:'Provider Q&A',note:'Navigate guidance'},
  {id:'agreement',href:'/experience/agreement',number:'05',title:'Agreement',note:'Continue to provider forms'},
] as const;

const PHOTO='/photos/';

export default function OryzoProviderJourney(){
  const rootRef=useRef<HTMLElement|null>(null);
  const [active,setActive]=useState(0);
  const [travel,setTravel]=useState<string|null>(null);
  const [pointer,setPointer]=useState({x:0,y:0});

  useEffect(()=>{
    const root=rootRef.current;if(!root)return;
    const chapters=Array.from(root.querySelectorAll<HTMLElement>('[data-story-chapter]'));
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting)setActive(Number((entry.target as HTMLElement).dataset.index||0));
    }),{rootMargin:'-35% 0px -35% 0px',threshold:0});
    chapters.forEach(ch=>observer.observe(ch));
    return()=>observer.disconnect();
  },[]);

  const onPointer=(event:PointerEvent<HTMLElement>)=>{
    setPointer({x:(event.clientX/window.innerWidth-.5)*2,y:(event.clientY/window.innerHeight-.5)*2});
  };

  const enterPortal=(id:string,href:string)=>{
    if(travel)return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){window.location.assign(href);return}
    setTravel(id);window.setTimeout(()=>window.location.assign(href),760);
  };

  return <main ref={rootRef} className={`${styles.root} ${travel?styles.traveling:''}`} data-travel={travel||undefined} onPointerMove={onPointer}>
    <section className={styles.storyWorld} id="story">
      <div className={styles.stage} style={{'--px':pointer.x,'--py':pointer.y,'--active':active} as CSSProperties}>
        <div className={styles.deskWorld} aria-hidden="true"><i/><b/><span/><em/></div>
        <div className={styles.brandMark}>OCCU-MED</div>
        <div className={styles.stageIndex}>{STORY[active].label}</div>

        <div className={styles.sceneStack}>
          {STORY.map((scene,sceneIndex)=><div key={scene.id} className={styles.sceneLayer} data-active={active===sceneIndex||undefined} aria-hidden={active!==sceneIndex}>
            <div className={styles.subjectGroup}>
              {scene.images.map((image,imageIndex)=><figure key={image} className={styles.subject} style={{'--image-index':imageIndex,'--image-count':scene.images.length} as CSSProperties}><Image src={`${PHOTO}${encodeURIComponent(image)}`} alt={active===sceneIndex?`${scene.title} visual ${imageIndex+1}`:''} fill priority={sceneIndex===0} sizes="(max-width:800px) 88vw,62vw"/></figure>)}
            </div>
          </div>)}
        </div>

        <div className={styles.stageProps} aria-hidden="true"><div className={styles.propCard}>CASE / 001</div><div className={styles.propDisk}/><div className={styles.propNote}>JOB + MEDICAL + CONTEXT</div></div>
      </div>

      <div className={styles.chapterFlow}>
        <section className={styles.hero} data-story-chapter data-index="0">
          <div className={styles.heroCopy}><span>OCCU-MED / PROVIDER EXPERIENCE</span><h1>Occupational medicine,<br/><em>built around the job.</em></h1><p>Scroll to move through the company story.</p></div>
        </section>
        {STORY.map((scene,index)=><section key={scene.id} className={styles.chapter} data-story-chapter data-index={index} id={`scene-${scene.id}`}>
          <div className={styles.chapterCopy}><span>{scene.label}</span><h2>{scene.title}</h2><p>{scene.body}</p><small>{String(index+1).padStart(2,'0')} / {STORY.length}</small></div>
        </section>)}
      </div>
    </section>

    <section className={styles.magazineBreak}>
      <small>OCCU-MED / 1976 — TODAY</small><h2>One operating model.<br/><i>Thousands of places to land.</i></h2><p>The linear story ends here. The provider world begins next.</p>
    </section>

    <section className={styles.hub} id="provider-world">
      <div className={styles.hubBackdrop} aria-hidden="true"><div className={styles.skyObject}><i/><b/><span/></div><div className={styles.horizon}/><div className={styles.floor}/></div>
      <div className={styles.astronaut} aria-hidden="true"><div className={styles.helmet}/><div className={styles.torso}/><div className={styles.armL}/><div className={styles.armR}/><div className={styles.legL}/><div className={styles.legR}/><div className={styles.pack}/></div>
      <header className={styles.hubCopy}><span>YOUR FACILITY / SELECT A PATH</span><h2>Where do you<br/>want to go?</h2></header>
      <div className={styles.portalField}>{PORTALS.map((portal,index)=><button key={portal.id} type="button" className={styles.portal} data-selected={travel===portal.id||undefined} style={{'--portal':index} as CSSProperties} onClick={()=>enterPortal(portal.id,portal.href)}><span><i/><b/></span><small>{portal.number}</small><strong>{portal.title}</strong><em>{portal.note}</em></button>)}</div>
      <div className={styles.hubHint}>MOVE / HOVER / ENTER A PORTAL</div>
    </section>
    <div className={styles.travelFlash} aria-hidden="true"><i/><b/></div>
  </main>;
}
