'use client';

import { useMemo, useState } from 'react';
import QuestionField from './QuestionField';
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

export default function QuestionExperience() {
  const [stage,setStage]=useState<Stage>('Receive');
  const [topic,setTopic]=useState<Topic>('All');
  const availableTopics=useMemo(()=>Array.from(new Set(QUESTIONS.filter(item=>item.stage===stage).map(item=>item.topic))),[stage]);
  const visible=useMemo(()=>QUESTIONS.map((item,index)=>({item,index})).filter(({item})=>item.stage===stage&&(topic==='All'||item.topic===topic)),[stage,topic]);
  const [open,setOpen]=useState(0);
  const active=QUESTIONS[open] ?? QUESTIONS[0];
  const activeVisible=Math.max(0,visible.findIndex(({index})=>index===open));
  const choose=(next:Stage)=>{
    const nextTopics=Array.from(new Set(QUESTIONS.filter(item=>item.stage===next).map(item=>item.topic)));
    const nextTopic=topic==='All'||nextTopics.includes(topic as Exclude<Topic,'All'>)?topic:'All';
    setStage(next);setTopic(nextTopic);
    const i=QUESTIONS.findIndex(x=>x.stage===next&&(nextTopic==='All'||x.topic===nextTopic));if(i>=0)setOpen(i);
  };
  const toggleTopic=(next:Exclude<Topic,'All'>)=>{
    const resolved:Topic=topic===next?'All':next;setTopic(resolved);
    const i=QUESTIONS.findIndex(x=>x.stage===stage&&(resolved==='All'||x.topic===resolved));if(i>=0)setOpen(i);
  };

  return <main className={styles.root}>
    <header className={styles.topbar}><a href="/experience#provider-portals">OCCU-MED / INFORMATION FIELD</a><div><a href="/experience/network">NETWORK</a> · <a href="/experience/resources">RESOURCES</a> · <a href="/experience/agreement">AGREEMENT</a></div></header>
    <aside className={styles.sidebar}><span>REFERRAL LIFECYCLE</span>{STAGES.map(x=><button key={x.stage} aria-pressed={stage===x.stage} onClick={()=>choose(x.stage)}><small>{x.number}</small><b>{x.stage}</b><em>{x.note}</em></button>)}</aside>
    <section className={styles.explorer}>
      <QuestionField count={visible.length} active={activeVisible}/>
      <div className={styles.filters}>{availableTopics.map(x=><button key={x} aria-pressed={topic===x} onClick={()=>toggleTopic(x)}>{x}</button>)}</div>
      <div className={styles.titleBlock}><span className={styles.eyebrow}>PORTAL 04 / {stage.toUpperCase()}</span><h1>{stage}</h1><p>{STAGES.find(item=>item.stage===stage)?.note}</p></div>
      <div className={styles.nodes}>{visible.map(({item,index},i)=><button style={{'--node':i} as import('react').CSSProperties} key={item.q} aria-pressed={open===index} onClick={()=>setOpen(index)}><i/><span>{item.q}</span></button>)}</div>
      <article className={styles.detail}><small>{active.stage} / {active.topic}</small><h2>{active.q}</h2><p>{active.a}</p></article>
    </section>
  </main>;
}
