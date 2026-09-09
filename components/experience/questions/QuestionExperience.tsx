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
  const [stage, setStage] = useState<Stage | 'All'>('All');
  const [topic, setTopic] = useState<Topic>('All');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<number>(0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return QUESTIONS.map((item,index)=>({item,index})).filter(({item}) => {
      if (stage !== 'All' && item.stage !== stage) return false;
      if (topic !== 'All' && item.topic !== topic) return false;
      if (!needle) return true;
      return `${item.q} ${item.a} ${item.topic} ${item.stage}`.toLowerCase().includes(needle);
    });
  }, [query, stage, topic]);

  const chooseStage = (next: Stage) => {
    setStage(current => current === next ? 'All' : next);
    const first = QUESTIONS.findIndex(item => item.stage === next);
    if (first >= 0) setOpen(first);
  };

  return (
    <main className={styles.root}>
      <header className={styles.topbar}>
        <a href="/experience#provider-portals">OCCU-MED / PROVIDER FIELD GUIDE</a>
        <div><a href="/experience/history">HISTORY</a> · <a href="/experience/network">NETWORK</a> · <a href="/experience/resources">RESOURCES</a> · <a href="/experience/agreement">AGREEMENT</a></div>
      </header>

      <section className={styles.hero}>
        <span>PORTAL 04 / PROVIDER Q&A</span>
        <h1>Follow a referral<br />from start to finish.</h1>
        <p>Use the referral current to jump into the part of the workflow you need, or search the complete operational guide.</p>

        <div className={styles.current} aria-label="Referral lifecycle">
          {STAGES.map(item => (
            <button key={item.stage} type="button" aria-pressed={stage === item.stage} onClick={() => chooseStage(item.stage)}>
              <span>{item.number} / {item.stage.toUpperCase()}</span><b>{item.note}</b>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.workspace}>
        <div className={styles.controls}>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search provider guidance…" aria-label="Search provider guidance" />
          <div className={styles.filters} aria-label="Question topics">
            {TOPICS.map(item => <button key={item} type="button" aria-pressed={topic === item} onClick={() => setTopic(item)}>{item}</button>)}
          </div>
        </div>

        <div className={styles.count} aria-live="polite">{filtered.length} of {QUESTIONS.length} answers shown{stage !== 'All' ? ` · ${stage} stage` : ''}</div>

        <div className={styles.faq}>
          {filtered.length ? filtered.map(({item,index}) => (
            <article className={styles.item} key={item.q}>
              <button type="button" aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}>
                <span>{item.stage.toUpperCase()}</span><strong>{item.q}</strong><b>{open === index ? '−' : '+'}</b>
              </button>
              {open === index && <div className={styles.answer}>{item.a}</div>}
            </article>
          )) : <div className={styles.empty}>No provider guidance matches the current search and filters.</div>}
        </div>

        <div className={styles.guide}>
          <p><strong>Need the complete source guide?</strong><br/>The supplied Occu-Med Stateside Providers document remains available from the resource endpoint.</p>
          <a href="/api/provider-resources/stateside-guide">Download provider guide ↓</a>
        </div>
      </section>
    </main>
  );
}
