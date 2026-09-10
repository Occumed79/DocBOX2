'use client';

import { useMemo, useState } from 'react';
import styles from './QuestionExperience.module.css';

type Topic = 'All' | 'Preparation' | 'Examination' | 'Records' | 'Billing' | 'Network';
type Stage = 'Receive' | 'Schedule' | 'Examine' | 'Return' | 'Invoice';

type Question = { q: string; a: string; topic: Exclude<Topic,'All'>; stage: Stage };

const STAGES: Array<{ stage: Stage; number: string; note: string }> = [
  { stage: 'Receive', number: '01', note: 'Authorization arrives' },
  { stage: 'Schedule', number: '02', note: 'Appointment coordination' },
  { stage: 'Examine', number: '03', note: 'Authorized clinical work' },
  { stage: 'Return', number: '04', note: 'Records and QA' },
  { stage: 'Invoice', number: '05', note: 'Direct-pay billing' },
];

const QUESTIONS: Question[] = [
  { q: 'What is Occu-Med’s role?', topic: 'Preparation', stage: 'Receive', a: 'Occu-Med coordinates the referral, scheduling, documentation follow-up, quality assurance, and applicable medical review. The clinic performs the authorized clinical services and documents its findings.' },
  { q: 'What does our clinic receive before the visit?', topic: 'Preparation', stage: 'Receive', a: 'The clinic receives an authorization identifying the examinee, requested services, required forms or reports, and instructions for returning the completed documentation.' },
  { q: 'Who schedules the appointment?', topic: 'Preparation', stage: 'Schedule', a: 'Occu-Med coordinates the examinee’s availability with the clinic and confirms the appointment with the involved parties.' },
  { q: 'What happens after a missed appointment?', topic: 'Preparation', stage: 'Schedule', a: 'Occu-Med follows up with the examinee and coordinates a replacement appointment with the clinic when another visit is needed.' },
  { q: 'May we perform services outside the authorization?', topic: 'Examination', stage: 'Examine', a: 'No. Contact Occu-Med for approval before providing any service that is not listed on the authorization.' },
  { q: 'Does our provider make the employment or deployment decision?', topic: 'Examination', stage: 'Examine', a: 'No. The clinic documents clinical findings. Occu-Med evaluates the returned information against the applicable job or deployment requirements and communicates the appropriate outcome.' },
  { q: 'What happens if the provider identifies a finding that needs follow-up?', topic: 'Examination', stage: 'Examine', a: 'Document the finding and return the authorized records. When additional evaluation is required, Occu-Med coordinates the next step with the examinee and the appropriate provider.' },
  { q: 'What records must be returned?', topic: 'Records', stage: 'Return', a: 'Return every requested form, report, tracing, image, laboratory result, vaccination record, or other supporting document identified in the referral instructions.' },
  { q: 'How are missing or incomplete records handled?', topic: 'Records', stage: 'Return', a: 'Provider Relations follows up with the clinic, and Quality Assurance identifies incomplete, missing, or inconsistent documentation that requires correction or completion.' },
  { q: 'What information reaches the employer?', topic: 'Records', stage: 'Return', a: 'Occu-Med communicates the applicable occupational or deployment outcome. Confidential medical details are not sent to the employer as part of that determination.' },
  { q: 'How should we invoice Occu-Med?', topic: 'Billing', stage: 'Invoice', a: 'Invoice Occu-Med using the accepted fee schedule and the billing directions provided with the referral. The provider should bill only the services that were authorized and completed.' },
  { q: 'What if our pricing changes later?', topic: 'Billing', stage: 'Invoice', a: 'Contact Network Management before applying new pricing to future referrals so the accepted fee schedule can be reviewed and updated.' },
  { q: 'Can multiple clinic locations participate?', topic: 'Network', stage: 'Receive', a: 'Yes. Each participating location and its available services can be identified for Network Management so referrals can be directed to the correct facility.' },
  { q: 'Who should we contact when the authorization is unclear?', topic: 'Network', stage: 'Receive', a: 'Contact Occu-Med before the appointment or before performing an uncertain service. The referral instructions and Network Management or scheduling contact should be used to resolve scope questions before care is added.' },
];

const TOPICS: Topic[] = ['All','Preparation','Examination','Records','Billing','Network'];

export default function QuestionExperience() {
  const [stage,setStage]=useState<Stage>('Receive');
  const [topic,setTopic]=useState<Topic>('All');
  const [open,setOpen]=useState(0);
  const visible=useMemo(()=>QUESTIONS.map((item,index)=>({item,index})).filter(({item})=>item.stage===stage&&(topic==='All'||item.topic===topic)),[stage,topic]);
  const active=QUESTIONS[open] ?? QUESTIONS[0];
  const chooseStage=(next:Stage)=>{setStage(next);const index=QUESTIONS.findIndex(item=>item.stage===next&&(topic==='All'||item.topic===topic));if(index>=0)setOpen(index)};
  const chooseTopic=(next:Topic)=>{const value=topic===next?'All':next;setTopic(value);const index=QUESTIONS.findIndex(item=>item.stage===stage&&(value==='All'||item.topic===value));if(index>=0)setOpen(index)};
  return <main className={styles.root}>
    <header className={styles.topbar}><a href="/experience#provider-portals">OCCU-MED® <span>/ PROVIDER FIELD GUIDE</span></a><nav><a href="/experience/history">HISTORY</a><a href="/experience/network">NETWORK</a><a href="/experience/resources">RESOURCES</a><a href="/experience/questions" aria-current="page">Q&amp;A</a><a href="/experience/agreement">AGREEMENT</a></nav></header>
    <aside className={styles.sidebar}><div className={styles.sideIntro}><span>PORTAL 04 / EXPLORE</span><h1>Referral<br/>current.</h1><p>Move through the provider lifecycle and inspect each operational question in place.</p></div><div className={styles.stageNav}><span>LIFECYCLE</span>{STAGES.map(item=><button key={item.stage} aria-pressed={stage===item.stage} onClick={()=>chooseStage(item.stage)}><i>{item.number}</i><b>{item.stage}</b><small>{item.note}</small></button>)}</div><div className={styles.stageProgress}><i style={{height:`${((STAGES.findIndex(item=>item.stage===stage)+1)/STAGES.length)*100}%`}}/></div></aside>
    <section className={styles.explorer} data-stage={stage.toLowerCase()}>
      <div className={styles.ambient} aria-hidden="true"><i/><i/><i/><b>{STAGES.findIndex(item=>item.stage===stage)+1}</b></div>
      <div className={styles.filters}><span>INFORMATION LAYERS</span>{TOPICS.filter(item=>item!=='All').map(item=><button key={item} aria-pressed={topic===item} onClick={()=>chooseTopic(item)}>{item}</button>)}</div>
      <div className={styles.fieldTitle}><span>REFERRAL PHASE / {String(STAGES.findIndex(item=>item.stage===stage)+1).padStart(2,'0')}</span><h2>{stage}</h2><p>{STAGES.find(item=>item.stage===stage)?.note}</p></div>
      <div className={styles.nodes} aria-label={`${stage} questions`}>{visible.length?visible.map(({item,index},position)=><button style={{'--node-x':`${(position%2)*47}%`,'--node-y':`${position*24}%`} as import('react').CSSProperties} key={item.q} aria-pressed={open===index} onClick={()=>setOpen(index)}><i/><span>{item.q}</span><small>{item.topic}</small></button>):<div className={styles.empty}>No questions in this layer.<button onClick={()=>setTopic('All')}>Show all {stage} questions</button></div>}</div>
      <article className={styles.detail} key={active.q}><header><span>{active.stage} / {active.topic}</span><b>{String(open+1).padStart(2,'0')}</b></header><h3>{active.q}</h3><p>{active.a}</p><footer><i/><span>OCCU-MED PROVIDER GUIDANCE</span></footer></article>
      <div className={styles.legend}><span><i/> SELECTABLE QUESTION</span><span><i/> ACTIVE DETAIL</span></div>
    </section>
  </main>
}
