'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import styles from './BlueCorridorsQAPortal.module.css';

const GROUPS = [
  {
    id:'before', label:'Before a referral', kicker:'UNDERSTAND THE RELATIONSHIP', image:'/photos/Diverse%20Healthcare%20Team%20Portrait%20(1).png',
    questions:[
      ['What is Occu-Med’s role?','Occu-Med coordinates the referral, scheduling, documentation follow-up, quality assurance and applicable medical review. The provider performs the authorized clinical service and documents the findings.'],
      ['Does the provider make the employment or deployment decision?','No. The provider performs the authorized evaluation, documents findings and returns the requested records. Occu-Med’s medical review process interprets the completed information against the applicable job or program requirements.'],
      ['What arrives with a referral?','The referral identifies the authorized services and includes the forms, exam packet or other case-specific material needed for the appointment.'],
      ['Who schedules the appointment?','Occu-Med coordinates the examinee’s availability with the clinic and confirms the appointment with the parties involved.'],
    ]
  },
  {
    id:'scope', label:'Appointment & scope', kicker:'PERFORM THE AUTHORIZED WORK', image:'/photos/Medical%20Eval.png',
    questions:[
      ['May we perform services outside the authorization?','No. If something outside the authorized scope appears necessary, contact Occu-Med for approval before expanding the visit.'],
      ['What should the clinic do if the requested service cannot be completed?','Contact Occu-Med so the case can be coordinated rather than substituting a different service or changing the authorized scope.'],
      ['What happens after a missed appointment?','Occu-Med follows up with the examinee and coordinates a replacement appointment with the clinic when appropriate.'],
      ['Can the same facility perform multiple components?','Yes. When the facility has the capability, multiple authorized services can be coordinated at the same location and returned as part of the same case.'],
    ]
  },
  {
    id:'records', label:'Records & QA', kicker:'RETURN A COMPLETE CASE', image:'/photos/EXAM%20REPORT.png',
    questions:[
      ['What should the facility return after the visit?','Return every requested form, report, tracing, image, laboratory result, vaccination record or other supporting record required by the authorization.'],
      ['How are missing records handled?','Provider Relations follows up with the clinic, and Quality Assurance identifies incomplete, missing or inconsistent documentation.'],
      ['What happens when findings require follow-up?','Occu-Med communicates the applicable follow-up requirements through the case workflow. The examinee may return to the same clinic when continuity is useful and authorized.'],
      ['Why does Occu-Med request specific documentation?','The requested records allow the medical review process to evaluate the completed findings against the job, program or deployment requirements without asking the provider to make the employment decision.'],
    ]
  },
  {
    id:'billing', label:'Billing & relationship', kicker:'KEEP THE WORKFLOW SIMPLE', image:'/photos/Facilities.png',
    questions:[
      ['How should we invoice?','Invoice Occu-Med using the accepted fee schedule and the billing directions provided with the referral. The onboarding workflow is built around direct provider rates and post-service invoicing.'],
      ['What information reaches the employer?','Occu-Med communicates the applicable outcome to the employer. Confidential medical detail remains handled within the medical-review and records workflow rather than being transmitted as ordinary employer-facing case information.'],
      ['Can one organization enroll multiple locations?','Yes. Locations can share one fee schedule or maintain location-specific rates, with each physical address attached to the applicable services and pricing.'],
      ['What happens if our rates or capabilities change?','Contact Network Management so the provider record, available services and agreed pricing can be reviewed before future referrals are scheduled.'],
    ]
  },
] as const;

export default function BlueCorridorsQAPortal(){
  const [group,setGroup]=useState(0);
  const [question,setQuestion]=useState(0);
  const active=GROUPS[group];
  const qa=active.questions[question] || active.questions[0];
  const total=useMemo(()=>GROUPS.reduce((sum,g)=>sum+g.questions.length,0),[]);
  const chooseGroup=(index:number)=>{setGroup(index);setQuestion(0)};

  return <main className={styles.root}>
    <nav className={styles.topNav} aria-label="Provider portals"><a href="/experience#provider-world">OCCU-MED / PORTALS</a><div><a href="/experience/history">History</a><a href="/experience/network">Network</a><a href="/experience/resources">Resources</a><a data-active href="/experience/questions">Q&A</a><a href="/experience/agreement">Agreement</a></div><a href="/experience#provider-world">Return to hub ↗</a></nav>

    <section className={styles.hero}>
      <div className={styles.heroImage}><Image src="/photos/Diverse%20Healthcare%20Team%20Portrait%20(1).png" alt="" fill priority sizes="100vw"/></div>
      <div className={styles.heroShade}/><div className={styles.heroCopy}><span>PORTAL 04 / PROVIDER Q&A</span><h1>Know the workflow.<br/>Protect the relationship.</h1><p>{total} practical answers organized into four paths.</p><a href="#question-paths">Explore provider questions ↓</a></div>
    </section>

    <section className={styles.paths} id="question-paths">
      <header><span>CHOOSE HOW TO EXPLORE</span><h2>Four paths through<br/>the provider relationship.</h2></header>
      <div className={styles.pathGrid}>{GROUPS.map((item,index)=><button key={item.id} type="button" data-active={group===index||undefined} onClick={()=>chooseGroup(index)}>
        <div className={styles.pathImage}><Image src={item.image} alt="" fill sizes="(max-width:800px) 100vw,25vw"/></div><div className={styles.pathShade}/><small>{String(index+1).padStart(2,'0')}</small><span>{item.kicker}</span><strong>{item.label}</strong><i>View more ↘</i>
      </button>)}</div>
    </section>

    <section className={styles.explorer}>
      <aside className={styles.questionDrawer}><span>{active.kicker}</span><h2>{active.label}</h2><div>{active.questions.map((item,index)=><button key={item[0]} type="button" data-active={question===index||undefined} onClick={()=>setQuestion(index)}><small>{String(index+1).padStart(2,'0')}</small><strong>{item[0]}</strong><i>{question===index?'−':'+'}</i></button>)}</div></aside>
      <article className={styles.answerField} aria-live="polite"><div className={styles.answerImage}><Image src={active.image} alt="" fill sizes="60vw"/></div><div className={styles.answerShade}/><div className={styles.answerCopy}><span>ANSWER / {String(question+1).padStart(2,'0')}</span><h2>{qa[0]}</h2><p>{qa[1]}</p></div></article>
      <aside className={styles.contextPanel}><span>PROVIDER ROLE</span><h3>Perform. Document. Return.</h3><p>The clinic’s job stays clinical: complete the authorized service, document the findings, return the requested records and invoice the agreed rate. Occu-Med coordinates the larger referral and review process.</p><a href="/api/provider-resources/stateside-guide">Open provider guide ↓</a></aside>
    </section>
  </main>;
}
