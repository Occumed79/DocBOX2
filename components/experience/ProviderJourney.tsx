'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import CinematicWorld from './immersive/CinematicWorld';
import PortalOrbitalNav from './immersive/PortalOrbitalNav';
import styles from './ProviderJourney.module.css';
import motion from './ProviderJourneyChoreography.module.css';
import prologueMotion from './ProviderPrologue.module.css';

const P = '/photos/';

type StoryMode = 'hero' | 'split' | 'lab' | 'editorial' | 'service' | 'report' | 'result' | 'workforce' | 'deployment' | 'network' | 'values';
type StoryScene = {chapter:string;title:string;body:string;images:readonly string[];mode:StoryMode;signal:string;signalLabel:string;annotation:string;scrollVh:number};
type WordPose = {x:number;y:number;r:number;s:number};

const STORY: readonly StoryScene[] = [
  {chapter:'01 / ORIGIN',title:'A different answer, since 1979.',body:'Founded in Honolulu by attorney Jim A. Johnson and Dr. Devonna M. Kaji, Occu-Med began with one conviction: a medical finding only becomes useful when it is understood in the context of the job.',images:['Founders.png','Founders copy.png','California - Hawaii Map.png'],mode:'hero',signal:'1979',signalLabel:'Honolulu / origin',annotation:'Job context changes the meaning of medical evidence.',scrollVh:220},
  {chapter:'02 / THE PROBLEM',title:'Healthy is not the same as ready.',body:'Traditional examinations gave physicians too little information about the work itself. Occu-Med connected medical evidence, legal requirements, and essential job demands.',images:['Concerned provider.png'],mode:'split',signal:'≠',signalLabel:'healthy / job-ready',annotation:'The examination is only one part of the decision.',scrollVh:145},
  {chapter:'03 / THE METHOD',title:'Three dimensions. One defensible decision.',body:'Valid job information. A job-related medical examination. A compatibility assessment performed by specialists and subject-matter experts.',images:['EMPLOYEE ID.png','Diverse Healthcare Team Portrait (1).png'],mode:'lab',signal:'03',signalLabel:'connected dimensions',annotation:'JOB + EXAM + COMPATIBILITY',scrollVh:190},
  {chapter:'04 / REFERRAL',title:'One referral enters the system.',body:'Scheduling connects the examinee and clinic, confirms availability, and delivers an authorization and exam packet before the appointment.',images:['Friendly Medical Appointment Call.png'],mode:'editorial',signal:'01',signalLabel:'authorized referral',annotation:'A single request becomes a coordinated clinical workflow.',scrollVh:150},
  {chapter:'05 / CLINICAL SERVICES',title:'The service changes. The standard does not.',body:'Physical examinations, laboratory collection, dental readiness, audiometry, and vaccination are coordinated around the exact authorized scope.',images:['Medical Eval.png','Calm Clinic Blood Draw (1).png','Dental Eval.png','Audiometry.png','Pharmacist Administering a Vaccine(1) (1).png'],mode:'service',signal:'05',signalLabel:'clinical disciplines',annotation:'Every service is attached to the same authorization logic.',scrollVh:255},
  {chapter:'06 / DOCUMENTATION',title:'Every result comes back into focus.',body:'Provider Relations follows the case until records arrive. Quality Assurance checks each report for completeness and accuracy.',images:['EXAM REPORT.png'],mode:'report',signal:'QA',signalLabel:'documentation control',annotation:'Complete. Legible. Correct. Returned.',scrollVh:155},
  {chapter:'07 / DETERMINATION',title:'Evidence becomes an outcome.',body:'Medical Review evaluates findings against the job classification and applicable guidelines. The employer receives the outcome—never the confidential medical detail.',images:['Fitness Determination.png'],mode:'result',signal:'→',signalLabel:'evidence / outcome',annotation:'The provider documents findings. Occu-Med performs the review.',scrollVh:170},
  {chapter:'08 / THE WORK',title:'Different work creates different demands.',body:'From public safety to construction, energy, education, government, and deployment, the job remains central to the medical question.',images:['Diverse Workforce.png','Diverse Workforce2.png'],mode:'workforce',signal:'∞',signalLabel:'different job demands',annotation:'The job—not a generic physical—is the reference point.',scrollVh:195},
  {chapter:'09 / DEPLOYMENT',title:'Readiness has no single border.',body:'Deployment standards, medical clearances, immunization schedules, and destination requirements are coordinated as one connected readiness process.',images:['International Certification.png','Vaccine Schedule.png'],mode:'deployment',signal:'GLOBAL',signalLabel:'destination readiness',annotation:'Standards travel with the assignment.',scrollVh:185},
  {chapter:'10 / THE NETWORK',title:'One operating model. Thousands of locations.',body:'A worldwide medical and dental network gives every referral a place to land—stateside or abroad.',images:['Facilities.png','International Network.png'],mode:'network',signal:'23,524',signalLabel:'valid mapped coordinates',annotation:'A referral can enter the same operating model from thousands of points.',scrollVh:215},
  {chapter:'11 / VALUES',title:'The standard is how we work.',body:'Humility. Positivity. Customer service. Quality. Integrity. Diligence.',images:['Corevalue.png','Corevalue2.png','Corevalue3.png','Corevalue4.png','Corevalue5.png','Corevalue6.png'],mode:'values',signal:'06',signalLabel:'core values',annotation:'The operating model ends where the culture begins.',scrollVh:235},
];

const PORTALS = [
  {id:'history',href:'/experience/history',number:'01',title:'Company history',note:'From Honolulu to a global medical network',tone:'gold'},
  {id:'network',href:'/experience/network',number:'02',title:'Explore the network',note:'23,524 anonymized mapped facilities',tone:'cyan'},
  {id:'resources',href:'/experience/resources',number:'03',title:'Provider resources',note:'Guidance organized around your specialty',tone:'violet'},
  {id:'questions',href:'/experience/questions',number:'04',title:'Provider Q&A',note:'Clear answers before the first referral',tone:'blue'},
  {id:'agreement',href:'/experience/agreement',number:'05',title:'Service agreement',note:'Build and submit your pricing proposal',tone:'white'},
] as const;

const clamp=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value));

function StoryTitle({title,mode}:{title:string;mode:StoryMode}){
  const words=title.split(/\s+/);
  return <h2 className={motion.title} data-mode={mode}>{words.map((word,index)=><span key={`${word}-${index}`} className={motion.word} data-story-word data-word-index={index}>{word}</span>)}</h2>;
}

function showSceneSignal(mode:StoryMode){
  return mode==='report'||mode==='result'||mode==='network';
}

function wordPose(mode:StoryMode,index:number,enter:number,leave:number):WordPose{
  const incoming=1-enter,outgoing=1-leave,side=index%2===0?-1:1;
  switch(mode){
    case 'hero':return{x:incoming*side*(72+index*14)+outgoing*-side*(28+index*9),y:incoming*(index%3-1)*34+outgoing*(-52-index*4),r:incoming*side*(7+index*.8)+outgoing*-side*3.5,s:.7+enter*.3+outgoing*.08};
    case 'split':return{x:incoming*138+outgoing*-92,y:incoming*side*(24+index*7)+outgoing*-28,r:incoming*-4+outgoing*2.5,s:.78+enter*.22+outgoing*.05};
    case 'lab':return{x:incoming*(index<2?-118:94)+outgoing*side*48,y:incoming*((index%2?1:-1)*(46+index*4))+outgoing*-34,r:incoming*side*5.5+outgoing*-side*2,s:.72+enter*.28+outgoing*.07};
    case 'editorial':return{x:incoming*-154+outgoing*86,y:incoming*(56-index*5)+outgoing*-42,r:incoming*-5.5+outgoing*3,s:.76+enter*.24+outgoing*.06};
    case 'service':{const angle=(index*.92)-1.8;return{x:incoming*Math.cos(angle)*(150+index*10)+outgoing*Math.sin(angle)*74,y:incoming*Math.sin(angle)*(92+index*6)+outgoing*-54,r:incoming*(angle*4.2)+outgoing*side*2.5,s:.6+enter*.4+outgoing*.09};}
    case 'report':return{x:incoming*(104-index*12)+outgoing*-64,y:incoming*(72+index*5)+outgoing*-38,r:incoming*3.5+outgoing*-2,s:.68+enter*.32+outgoing*.06};
    case 'result':return{x:incoming*(index-1.5)*34+outgoing*side*42,y:incoming*(112-index*9)+outgoing*-66,r:incoming*side*3+outgoing*-side*2,s:.58+enter*.42+outgoing*.1};
    case 'workforce':return{x:incoming*side*(126+index*8)+outgoing*-side*62,y:incoming*(index%2?44:-38)+outgoing*-34,r:incoming*side*5+outgoing*-side*3,s:.72+enter*.28+outgoing*.07};
    case 'deployment':return{x:incoming*(132-index*8)+outgoing*-88,y:incoming*((index%3)-1)*38+outgoing*-46,r:incoming*4.5+outgoing*-2.5,s:.7+enter*.3+outgoing*.06};
    case 'network':return{x:incoming*(index%2?58:-58)+outgoing*side*36,y:incoming*(index-2)*22+outgoing*-58,r:incoming*side*2.2+outgoing*-side*2,s:.48+enter*.52+outgoing*.12};
    case 'values':{const angle=index*.88-.9;return{x:incoming*Math.cos(angle)*(176+index*5)+outgoing*-Math.cos(angle)*82,y:incoming*Math.sin(angle)*(116+index*4)+outgoing*-70,r:incoming*(angle*7)+outgoing*-angle*2.2,s:.52+enter*.48+outgoing*.1};}
    default:return{x:incoming*side*40,y:incoming*30+outgoing*-24,r:incoming*side*3,s:.84+enter*.16};
  }
}

export default function ProviderJourney(){
  const rootRef=useRef<HTMLElement|null>(null);const[activeScene,setActiveScene]=useState(0);const[portalEntry,setPortalEntry]=useState(0);

  useEffect(()=>{
    const root=rootRef.current;if(!root)return;
    const scenes=Array.from(root.querySelectorAll<HTMLElement>('[data-scene]'));
    const prologue=root.querySelector<HTMLElement>('[data-prologue]');
    const arrival=root.querySelector<HTMLElement>('[data-portal-arrival]');
    let frame=0;
    const updateProgress=()=>{
      frame=0;const viewport=Math.max(window.innerHeight,1);let nearest=0,nearestDistance=Number.POSITIVE_INFINITY;

      if(prologue){
        const rect=prologue.getBoundingClientRect();const travel=Math.max(prologue.offsetHeight-viewport*.55,viewport*.45);const progress=clamp(-rect.top/travel);const visibility=1-clamp(progress*1.22);
        const words=Array.from(prologue.querySelectorAll<HTMLElement>('[data-prologue-word]'));
        words.forEach((word,index)=>{
          const direction=index===0?-1:index===1?1:-.35;
          const x=progress*direction*(index===2?120:180);const y=progress*(index===1?-95:index===0?70:125);const rotation=progress*direction*(index===2?4:8);const scale=1+progress*(index===1?.12:.06);
          word.style.transform=`translate3d(${x}px,${y}px,0) rotate(${rotation}deg) scale(${scale})`;word.style.opacity=String(clamp(visibility*(1.15-index*.08)));
        });
        const body=prologue.querySelector<HTMLElement>('[data-prologue-body]');if(body){body.style.transform=`translate3d(${progress*-38}px,${progress*48}px,0)`;body.style.opacity=String(clamp(1-progress*1.7))}
        const copy=prologue.querySelector<HTMLElement>('[data-prologue-copy]');if(copy){copy.style.transform=`translate3d(0,${progress*-3}vh,0)`}
        const meta=prologue.querySelector<HTMLElement>('[data-prologue-meta]');if(meta){meta.style.transform=`translate3d(0,${progress*24}px,0)`;meta.style.opacity=String(clamp(1-progress*1.8))}
      }

      if(arrival){
        const rect=arrival.getBoundingClientRect();const entry=clamp((viewport-rect.top)/(viewport*.92));
        setPortalEntry(current=>Math.abs(current-entry)>.002?entry:current);
      }

      scenes.forEach((scene,index)=>{
        const rect=scene.getBoundingClientRect();
        const progress=clamp((viewport-rect.top)/Math.max(viewport+rect.height,1));
        const distance=Math.abs(rect.top+rect.height*.5-viewport*.5);
        scene.style.setProperty('--scene-progress',progress.toFixed(4));
        if(distance<nearestDistance){nearestDistance=distance;nearest=index}
        const baseEnter=clamp((progress-.02)/.25),baseLeave=clamp((1-progress)/.24),visibility=Math.min(baseEnter,baseLeave);
        const mode=(scene.dataset.mode||'hero') as StoryMode;
        const words=Array.from(scene.querySelectorAll<HTMLElement>('[data-story-word]'));
        words.forEach((word,wordIndex)=>{
          const enter=clamp((progress-.018-Math.min(wordIndex,6)*.014)/.225);
          const leave=clamp((.985-progress-Math.min(wordIndex,5)*.003)/.205);
          const pose=wordPose(mode,wordIndex,enter,leave);
          word.style.transform=`translate3d(${pose.x}px,${pose.y}px,0) rotate(${pose.r}deg) scale(${pose.s})`;
          word.style.opacity=String(clamp(Math.min(enter,leave)*(wordIndex===0?1:.92+Math.min(wordIndex,4)*.025)));
        });
        const kicker=scene.querySelector<HTMLElement>('[data-story-kicker]');if(kicker){const kickerX=mode==='deployment'||mode==='split'?34:-34;kicker.style.transform=`translate3d(${(1-baseEnter)*kickerX+(1-baseLeave)*-kickerX*.55}px,${(1-baseEnter)*(mode==='network'?-18:16)}px,0)`;kicker.style.opacity=String(clamp(visibility*1.4))}
        const body=scene.querySelector<HTMLElement>('[data-story-body]');if(body){const bodyDelay=mode==='service'||mode==='values'?.23:.17;const bodyEnter=clamp((progress-bodyDelay)/.22),bodyLeave=clamp((.92-progress)/.18);const bodyX=mode==='lab'?42:mode==='deployment'?-34:0;body.style.transform=`translate3d(${(1-bodyEnter)*bodyX}px,${(1-bodyEnter)*34+(1-bodyLeave)*-22}px,0)`;body.style.opacity=String(Math.min(bodyEnter,bodyLeave))}
      });
      setActiveScene(nearest);
    };
    const queueProgress=()=>{if(!frame)frame=window.requestAnimationFrame(updateProgress)};
    updateProgress();window.addEventListener('scroll',queueProgress,{passive:true});window.addEventListener('resize',queueProgress);
    return()=>{window.removeEventListener('scroll',queueProgress);window.removeEventListener('resize',queueProgress);if(frame)window.cancelAnimationFrame(frame)};
  },[]);

  return <main ref={rootRef} className={styles.root}>
    <CinematicWorld sceneIndex={activeScene}/>

    <section className={styles.prologue} data-prologue>
      <div className={styles.prologueObject} aria-hidden="true"><Image src={`${P}Founders.png`} alt="" fill priority sizes="74vw"/></div>
      <div className={`${styles.prologueCopy} ${prologueMotion.copy}`} data-prologue-copy>
        <span>OCCU-MED / EST. 1979</span>
        <h1 className={prologueMotion.title}><span className={prologueMotion.word} data-prologue-word>Built</span><span className={prologueMotion.word} data-prologue-word>Around</span><em className={prologueMotion.word} data-prologue-word>The Job.</em></h1>
        <p className={prologueMotion.body} data-prologue-body>A medical network designed around one deceptively simple question: what does this person actually need to do?</p>
      </div>
      <div className={`${styles.prologueMeta} ${prologueMotion.meta}`} data-prologue-meta><span>MEDICAL / DENTAL / DEPLOYMENT</span><b>SCROLL TO EXPLORE ↓</b></div>
    </section>

    <div id="cinematic-story" className={styles.story}>
      <nav className={styles.storyRail} aria-label="Company story chapters"><span>STORY</span>{STORY.map((scene,index)=><a key={scene.chapter} href={`#story-${index+1}`} aria-current={activeScene===index?'step':undefined}><i/><b>{String(index+1).padStart(2,'0')}</b><small>{scene.chapter.split('/ ')[1]}</small></a>)}</nav>
      {STORY.map((scene,sceneIndex)=><section id={`story-${sceneIndex+1}`} className={styles.scene} data-scene data-active={activeScene===sceneIndex?true:undefined} data-scene-index={sceneIndex} data-mode={scene.mode} data-world-chapter={scene.chapter} key={scene.chapter} style={{'--scene-index':sceneIndex,minHeight:`${scene.scrollVh}svh`} as CSSProperties}>
        <div className={styles.sceneGhost} aria-hidden="true">{String(sceneIndex+1).padStart(2,'0')}</div><div className={styles.sceneTitleField} aria-hidden="true">{scene.title}</div>
        <div className={styles.sceneMedia}>{scene.images.map((image,imageIndex)=><figure className={styles.storyFrame} data-webgl-image data-image-index={imageIndex} key={image} style={{'--image-index':imageIndex,'--image-count':scene.images.length} as CSSProperties}><Image src={`${P}${encodeURIComponent(image)}`} alt={`${scene.title} — visual ${imageIndex+1} of ${scene.images.length}`} fill sizes="(max-width: 800px) 92vw, 68vw"/></figure>)}</div>
        <div className={`${styles.sceneCopy} ${motion.copy}`}><span className={motion.kicker} data-story-kicker>{scene.chapter}</span><StoryTitle title={scene.title} mode={scene.mode}/><p className={motion.body} data-story-body>{scene.body}</p></div>
        {showSceneSignal(scene.mode)&&<aside className={styles.sceneSignal}><b>{scene.signal}</b><span>{scene.signalLabel}</span></aside>}<div className={styles.sceneAnnotation}><i/><span>{scene.annotation}</span></div>
      </section>)}
    </div>

    <section id="provider-portals" className={styles.arrival} data-scene data-scene-index={STORY.length} data-portal-arrival><header className={styles.arrivalHeader}><span>OCCU-MED / PROVIDER WORLD</span><p>Five destinations. One connected provider world.</p></header><div className={styles.arrivalScale} aria-hidden="true"><span>PORTAL CONCOURSE</span><b>05</b><small>DESTINATIONS ONLINE</small></div><PortalOrbitalNav portals={PORTALS} entryProgress={portalEntry}/></section>
  </main>;
}
