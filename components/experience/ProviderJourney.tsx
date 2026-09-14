'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import CinematicWorld from './immersive/CinematicWorld';
import PortalOrbitalNav from './immersive/PortalOrbitalNav';
import styles from './ProviderJourney.module.css';
import oryzo from './ProviderStoryOryzo.module.css';

const P = '/photos/';

type StoryMode = 'hero' | 'split' | 'lab' | 'editorial' | 'service' | 'report' | 'result' | 'workforce' | 'deployment' | 'network' | 'values';
type StoryScene = {chapter:string;title:string;body:string;images:readonly string[];mode:StoryMode;signal:string;signalLabel:string;annotation:string;scrollVh:number};
type WordPose = {x:number;y:number;r:number;s:number};

const STORY: readonly StoryScene[] = [
  {chapter:'01 / ORIGIN',title:'The question came before the company.',body:'State of California-funded research examined why workplace injury risk climbed when people entered unfamiliar jobs. That work became the foundation for Occu-Med, established in Honolulu in 1979: medical evidence only becomes useful when it is interpreted against the work a person must actually perform.',images:['Founders.png','Founders copy.png','California - Hawaii Map.png'],mode:'hero',signal:'1979',signalLabel:'Honolulu / foundation',annotation:'California-funded research → job context → Occu-Med.',scrollVh:220},
  {chapter:'02 / THE PROBLEM',title:'The first year exposed the gap.',body:'The research found that 41% of workplace injuries occurred during an employee’s first year. A routine physical could describe someone as healthy without answering the more important question: can that person safely perform this specific job?',images:['Concerned provider.png'],mode:'split',signal:'41%',signalLabel:'first-year injury finding',annotation:'Healthy is not the same as compatible with a specific job.',scrollVh:160},
  {chapter:'03 / THE METHOD',title:'Job. Exam. Compatibility.',body:'Occu-Med built the model around three connected dimensions: valid job information, a job-related medical examination, and a compatibility assessment performed by specialists and subject-matter experts. The work expanded across more than 500 distinct healthcare job classes.',images:['EMPLOYEE ID.png','Diverse Healthcare Team Portrait (1).png'],mode:'lab',signal:'500+',signalLabel:'job classes',annotation:'JOB INFORMATION + EXAMINATION + COMPATIBILITY.',scrollVh:205},
  {chapter:'04 / REFERRAL',title:'One referral becomes a coordinated exam.',body:'A referral enters the system, Scheduling identifies the appropriate clinic and appointment, and the authorization plus exam packet defines exactly what must be performed before the examinee arrives.',images:['Friendly Medical Appointment Call.png'],mode:'editorial',signal:'01',signalLabel:'coordinated referral',annotation:'REFERRAL → SCHEDULING → AUTHORIZATION → EXAM PACKET.',scrollVh:165},
  {chapter:'05 / CLINICAL SERVICES',title:'Only the authorized scope gets performed.',body:'Physical examinations, laboratory collection, dental readiness, audiometry, and vaccination are coordinated around the exact authorization. The provider documents findings; Occu-Med’s medical review process makes the job-related recommendation.',images:['Medical Eval.png','Calm Clinic Blood Draw (1).png','Dental Eval.png','Audiometry.png','Pharmacist Administering a Vaccine(1) (1).png'],mode:'service',signal:'05',signalLabel:'clinical disciplines',annotation:'The service changes. The authorization standard does not.',scrollVh:265},
  {chapter:'06 / DOCUMENTATION',title:'The exam ends. The record does not.',body:'Provider Relations follows the case until records arrive. EXAMQA performs the initial review, sends correction requests back to the clinic when needed, and completes final quality review before the case advances.',images:['EXAM REPORT.png'],mode:'report',signal:'QA',signalLabel:'three-stage record control',annotation:'INITIAL QA → CLINIC CORRECTION → FINAL QA.',scrollVh:175},
  {chapter:'07 / DETERMINATION',title:'Medical evidence becomes a job-related outcome.',body:'Medical Review evaluates the completed findings against the job classification and applicable standards. Once records are complete, the typical determination target is 24–48 hours. The employer receives the outcome, while confidential medical detail remains protected.',images:['Fitness Determination.png'],mode:'result',signal:'24–48',signalLabel:'hour target',annotation:'The provider documents findings. Occu-Med performs the review.',scrollVh:185},
  {chapter:'08 / THE WORK',title:'Different work creates different medical questions.',body:'The model has supported more than 500 public-safety clients and extends across construction, energy, education, government, and other demanding work. The job—not a generic physical—remains the reference point.',images:['Diverse Workforce.png','Diverse Workforce2.png'],mode:'workforce',signal:'500+',signalLabel:'public-safety clients',annotation:'Different work. Different demands. One compatibility model.',scrollVh:205},
  {chapter:'09 / DEPLOYMENT',title:'Readiness crosses borders.',body:'Deployment medical requirements, destination standards, immunization schedules, and required certifications are coordinated as one connected process across operations in more than 50 countries.',images:['International Certification.png','Vaccine Schedule.png'],mode:'deployment',signal:'50+',signalLabel:'countries',annotation:'Readiness follows the assignment, not a single border.',scrollVh:195},
  {chapter:'10 / THE NETWORK',title:'Thousands of locations. One operating model.',body:'A worldwide medical and dental network gives each referral somewhere to land stateside or abroad. The current provider atlas contains 23,524 valid mapped coordinates feeding the same referral, documentation, and review process.',images:['Facilities.png','International Network.png'],mode:'network',signal:'23,524',signalLabel:'valid mapped coordinates',annotation:'A global network connected to one operating model.',scrollVh:225},
  {chapter:'11 / VALUES',title:'The operating model ends where the culture begins.',body:'Humility. Positivity. Customer Service. Quality. Integrity. Diligence.',images:['Corevalue.png','Corevalue2.png','Corevalue3.png','Corevalue4.png','Corevalue5.png','Corevalue6.png'],mode:'values',signal:'06',signalLabel:'core values',annotation:'HUMILITY · POSITIVITY · CUSTOMER SERVICE · QUALITY · INTEGRITY · DILIGENCE.',scrollVh:245},
];

const PORTALS = [
  {id:'history',href:'/experience/history',number:'01',title:'Company history',note:'From Honolulu to a global medical network',tone:'gold'},
  {id:'network',href:'/experience/network',number:'02',title:'Explore the network',note:'23,524 anonymized mapped facilities',tone:'cyan'},
  {id:'resources',href:'/experience/resources',number:'03',title:'Provider resources',note:'Guidance organized around your specialty',tone:'violet'},
  {id:'questions',href:'/experience/questions',number:'04',title:'Provider Q&A',note:'Clear answers before the first referral',tone:'blue'},
  {id:'agreement',href:'/experience/agreement',number:'05',title:'Service agreement',note:'Build and submit your pricing proposal',tone:'white'},
] as const;

const clamp=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value));

function StoryTitle({title}:{title:string}){
  const words=title.split(/\s+/);
  return <h2 className={oryzo.title} aria-label={title}>{words.map((word,index)=><span key={`${word}-${index}`} className={oryzo.word} data-story-word aria-hidden="true">{Array.from(word).map((letter,letterIndex)=><i key={`${letter}-${letterIndex}`} className={oryzo.letter} data-story-letter>{letter}</i>)}</span>)}</h2>;
}

function wordPose(mode:StoryMode,index:number,enter:number,leave:number):WordPose{
  const incoming=1-enter,outgoing=1-leave,side=index%2===0?-1:1;
  switch(mode){
    case 'hero':return{x:incoming*side*(110+index*13)+outgoing*-side*(48+index*8),y:incoming*(index%3-1)*30+outgoing*(-44-index*3),r:incoming*side*(3.8+index*.45)+outgoing*-side*2,s:.8+enter*.2+outgoing*.05};
    case 'split':return{x:incoming*168+outgoing*-108,y:incoming*side*(24+index*6)+outgoing*-22,r:incoming*-2.8+outgoing*1.6,s:.82+enter*.18+outgoing*.04};
    case 'lab':return{x:incoming*(index<2?-136:116)+outgoing*side*58,y:incoming*((index%2?1:-1)*(38+index*4))+outgoing*-28,r:incoming*side*3.4+outgoing*-side*1.6,s:.8+enter*.2+outgoing*.05};
    case 'editorial':return{x:incoming*-188+outgoing*102,y:incoming*(48-index*5)+outgoing*-36,r:incoming*-3.2+outgoing*1.8,s:.8+enter*.2+outgoing*.045};
    case 'service':{const angle=(index*.92)-1.8;return{x:incoming*Math.cos(angle)*(170+index*10)+outgoing*Math.sin(angle)*82,y:incoming*Math.sin(angle)*(86+index*6)+outgoing*-46,r:incoming*(angle*3)+outgoing*side*1.6,s:.74+enter*.26+outgoing*.06};}
    case 'report':return{x:incoming*(118-index*12)+outgoing*-70,y:incoming*(64+index*5)+outgoing*-32,r:incoming*2.5+outgoing*-1.4,s:.78+enter*.22+outgoing*.045};
    case 'result':return{x:incoming*(index-1.5)*42+outgoing*side*50,y:incoming*(102-index*8)+outgoing*-56,r:incoming*side*2.2+outgoing*-side*1.4,s:.72+enter*.28+outgoing*.07};
    case 'workforce':return{x:incoming*side*(142+index*8)+outgoing*-side*66,y:incoming*(index%2?40:-34)+outgoing*-28,r:incoming*side*3.2+outgoing*-side*1.8,s:.8+enter*.2+outgoing*.05};
    case 'deployment':return{x:incoming*(154-index*8)+outgoing*-94,y:incoming*((index%3)-1)*34+outgoing*-38,r:incoming*2.8+outgoing*-1.6,s:.78+enter*.22+outgoing*.045};
    case 'network':return{x:incoming*(index%2?74:-74)+outgoing*side*42,y:incoming*(index-2)*20+outgoing*-50,r:incoming*side*1.7+outgoing*-side*1.4,s:.68+enter*.32+outgoing*.08};
    case 'values':{const angle=index*.88-.9;return{x:incoming*Math.cos(angle)*(184+index*5)+outgoing*-Math.cos(angle)*84,y:incoming*Math.sin(angle)*(108+index*4)+outgoing*-62,r:incoming*(angle*4.6)+outgoing*-angle*1.4,s:.72+enter*.28+outgoing*.07};}
    default:return{x:incoming*side*48,y:incoming*26+outgoing*-22,r:incoming*side*2,s:.88+enter*.12};
  }
}

export default function ProviderJourney(){
  const rootRef=useRef<HTMLElement|null>(null);
  const[activeScene,setActiveScene]=useState(0);
  const[portalEntry,setPortalEntry]=useState(0);
  const scene=STORY[activeScene]??STORY[0];

  useEffect(()=>{
    const root=rootRef.current;if(!root)return;
    const beats=Array.from(root.querySelectorAll<HTMLElement>('[data-story-beat]'));
    const prologue=root.querySelector<HTMLElement>('[data-prologue]');
    const arrival=root.querySelector<HTMLElement>('[data-portal-arrival]');
    let frame=0;

    const updateProgress=()=>{
      frame=0;
      const viewport=Math.max(window.innerHeight,1);
      let nearest=0,nearestDistance=Number.POSITIVE_INFINITY;

      if(prologue){
        const rect=prologue.getBoundingClientRect();
        const travel=Math.max(prologue.offsetHeight-viewport*.58,viewport*.42);
        const progress=clamp(-rect.top/travel);
        const visibility=1-clamp(progress*1.18);
        const words=Array.from(prologue.querySelectorAll<HTMLElement>('[data-prologue-word]'));
        words.forEach((word,index)=>{
          const direction=index===0?-1:index===1?1:-.45;
          const x=progress*direction*(index===2?150:220);
          const y=progress*(index===1?-74:index===0?62:112);
          const rotation=progress*direction*(index===2?2.5:5.5);
          const scale=1+progress*(index===1?.08:.04);
          word.style.transform=`translate3d(${x}px,${y}px,0) rotate(${rotation}deg) scale(${scale})`;
          word.style.opacity=String(clamp(visibility*(1.14-index*.07)));
        });
        const body=prologue.querySelector<HTMLElement>('[data-prologue-body]');
        if(body){body.style.transform=`translate3d(${progress*-52}px,${progress*42}px,0)`;body.style.opacity=String(clamp(1-progress*1.62));}
        const meta=prologue.querySelector<HTMLElement>('[data-prologue-meta]');
        if(meta){meta.style.transform=`translate3d(0,${progress*20}px,0)`;meta.style.opacity=String(clamp(1-progress*1.72));}
      }

      beats.forEach((beat,index)=>{
        const rect=beat.getBoundingClientRect();
        const distance=Math.abs(rect.top+rect.height*.5-viewport*.5);
        if(distance<nearestDistance){nearestDistance=distance;nearest=index;}
      });

      const activeBeat=beats[nearest];
      if(activeBeat){
        const rect=activeBeat.getBoundingClientRect();
        const progress=clamp((viewport-rect.top)/Math.max(viewport+rect.height,1));
        const baseEnter=clamp((progress-.02)/.25),baseLeave=clamp((1-progress)/.24),visibility=Math.min(baseEnter,baseLeave);
        const activeMode=STORY[nearest]?.mode??'hero';
        const stage=root.querySelector<HTMLElement>('[data-story-stage]');
        if(stage){
          stage.style.setProperty('--story-progress',progress.toFixed(4));
          const words=Array.from(stage.querySelectorAll<HTMLElement>('[data-story-word]'));
          words.forEach((word,wordIndex)=>{
            const enter=clamp((progress-.018-Math.min(wordIndex,6)*.014)/.225);
            const leave=clamp((.985-progress-Math.min(wordIndex,5)*.003)/.205);
            const pose=wordPose(activeMode,wordIndex,enter,leave);
            word.style.transform=`translate3d(${pose.x}px,${pose.y}px,0) rotate(${pose.r}deg) scale(${pose.s})`;
            word.style.opacity=String(clamp(Math.min(enter,leave)*(wordIndex===0?1:.92+Math.min(wordIndex,4)*.025)));
          });
          const letters=Array.from(stage.querySelectorAll<HTMLElement>('[data-story-letter]'));
          letters.forEach((letter,letterIndex)=>{
            const enter=clamp((progress-.055-Math.min(letterIndex,34)*.0028)/.19);
            const leave=clamp((.955-progress-Math.min(letters.length-letterIndex,28)*.0012)/.18);
            const y=(1-enter)*1.06+(1-leave)*-.34;
            letter.style.transform=`translate3d(0,${y}em,0)`;
            letter.style.opacity=String(clamp(Math.min(enter,leave)*1.2));
          });
          const kicker=stage.querySelector<HTMLElement>('[data-story-kicker]');
          if(kicker){const kickerX=activeMode==='deployment'||activeMode==='split'?42:-42;kicker.style.transform=`translate3d(${(1-baseEnter)*kickerX+(1-baseLeave)*-kickerX*.55}px,${(1-baseEnter)*(activeMode==='network'?-16:14)}px,0)`;kicker.style.opacity=String(clamp(visibility*1.45));}
          const body=stage.querySelector<HTMLElement>('[data-story-body]');
          if(body){const bodyDelay=(activeMode==='service'||activeMode==='values')?.23:.17;const bodyEnter=clamp((progress-bodyDelay)/.22),bodyLeave=clamp((.92-progress)/.18);const bodyX=activeMode==='lab'?48:activeMode==='deployment'?-42:0;body.style.transform=`translate3d(${(1-bodyEnter)*bodyX}px,${(1-bodyEnter)*32+(1-bodyLeave)*-20}px,0)`;body.style.opacity=String(Math.min(bodyEnter,bodyLeave));}
        }
      }

      setActiveScene(current=>{if(current===nearest)return current;window.requestAnimationFrame(updateProgress);return nearest;});

      if(arrival){
        const rect=arrival.getBoundingClientRect();
        const entry=clamp((viewport-rect.top)/(viewport*.92));
        setPortalEntry(current=>Math.abs(current-entry)>.002?entry:current);
      }
    };

    const queueProgress=()=>{if(!frame)frame=window.requestAnimationFrame(updateProgress);};
    updateProgress();
    window.addEventListener('scroll',queueProgress,{passive:true});
    window.addEventListener('resize',queueProgress);
    return()=>{window.removeEventListener('scroll',queueProgress);window.removeEventListener('resize',queueProgress);if(frame)window.cancelAnimationFrame(frame);};
  },[]);

  return <main ref={rootRef} className={styles.root}>
    <CinematicWorld sceneIndex={activeScene}/>

    <section className={styles.prologue} data-prologue>
      <div className={styles.prologueObject} aria-hidden="true"><Image src={`${P}Founders.png`} alt="" fill priority sizes="74vw"/></div>
      <div className={styles.prologueCopy}>
        <span>OCCU-MED / EST. 1979</span>
        <h1 className={oryzo.prologueTitle}><span className={oryzo.prologueWord} data-prologue-word>Built</span><span className={oryzo.prologueWord} data-prologue-word>Around</span><em className={oryzo.prologueWord} data-prologue-word>The Job.</em></h1>
        <p className={oryzo.prologueBody} data-prologue-body>A medical network built around one deceptively simple question: what does this person actually need to do?</p>
      </div>
      <div className={`${styles.prologueMeta} ${oryzo.prologueMeta}`} data-prologue-meta><span>MEDICAL / DENTAL / DEPLOYMENT</span><b>SCROLL TO EXPLORE ↓</b></div>
    </section>

    <div id="cinematic-story" className={`${styles.story} ${oryzo.story}`}>
      <div className={oryzo.storyStage} data-story-stage data-mode={scene.mode}>
        <div className={oryzo.stageInner}>
          <div className={oryzo.mobileMedia}>{scene.images.map((image,imageIndex)=><figure key={image}><Image src={`${P}${encodeURIComponent(image)}`} alt={`${scene.title} — visual ${imageIndex+1} of ${scene.images.length}`} fill sizes="92vw"/></figure>)}</div>
          <div className={oryzo.stageCopy} key={scene.chapter}>
            <span className={oryzo.kicker} data-story-kicker>{scene.chapter}</span>
            <StoryTitle title={scene.title}/>
            <p className={oryzo.body} data-story-body>{scene.body}</p>
          </div>
          <aside className={oryzo.fact} key={`${scene.chapter}-fact`}><b>{scene.signal}</b><div><span>{scene.signalLabel}</span><p>{scene.annotation}</p></div></aside>
          <div className={oryzo.progress} aria-hidden="true">{String(activeScene+1).padStart(2,'0')}<i/>{String(STORY.length).padStart(2,'0')}</div>
        </div>
      </div>
      <div className={oryzo.storyTrack} aria-hidden="true">{STORY.map((item,index)=><div key={item.chapter} className={oryzo.storyBeat} data-story-beat data-scene-index={index} style={{height:`${item.scrollVh}svh`} as CSSProperties}/>)}</div>
    </div>

    <section id="provider-portals" className={styles.arrival} data-portal-arrival><header className={styles.arrivalHeader}><span>OCCU-MED / PROVIDER WORLD</span><p>Five destinations. One connected provider world.</p></header><div className={styles.arrivalScale} aria-hidden="true"><span>PORTAL CONCOURSE</span><b>05</b><small>DESTINATIONS ONLINE</small></div><PortalOrbitalNav portals={PORTALS} entryProgress={portalEntry}/></section>
  </main>;
}