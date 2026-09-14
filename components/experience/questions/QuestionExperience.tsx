'use client';

import { useMemo, useState } from 'react';
import QuestionField from './QuestionField';
import styles from './QuestionExperience.module.css';
import stageMotion from './QuestionStageMotion.module.css';

type Topic = 'All' | 'Authorization' | 'Examination' | 'Records' | 'Privacy' | 'Billing' | 'Network';
type Stage = 'Receive' | 'Schedule' | 'Examine' | 'Return' | 'Invoice';
type Question = { q: string; a: string; topic: Exclude<Topic,'All'>; stage: Stage };

const STAGES:Array<{stage:Stage;number:string;note:string}>=[
  {stage:'Receive',number:'01',note:'Authorization defines the scope'},
  {stage:'Schedule',number:'02',note:'Appointment coordination'},
  {stage:'Examine',number:'03',note:'Authorized clinical work'},
  {stage:'Return',number:'04',note:'Records, QA, privacy & review'},
  {stage:'Invoice',number:'05',note:'Itemized billing / NET 30'},
];

const QUESTIONS:Question[]=[
  {q:'What is Occu-Med’s role?',topic:'Network',stage:'Receive',a:'Occu-Med coordinates the referral and scheduling, follows for records through Provider Relations, checks documentation through Exam Quality Assurance, and completes the applicable medical review. The clinic performs the authorized clinical services and documents its findings.'},
  {q:'How do we know which tests or services to perform?',topic:'Authorization',stage:'Receive',a:'Use the Authorization for Examination as the definitive source for the required components. Occu-Med determines the required testing from the applicable standards, job duties, work environment, and employer requirements; your clinic is not expected to determine which components are administratively required.'},
  {q:'What does our clinic receive before the visit?',topic:'Authorization',stage:'Receive',a:'The Authorization for Examination identifies the examinee, approved services, required forms, and clinic location. The exam packet also includes the Authorization for Examination and Authorization for Release of Information from Medical Records for the examinee to sign.'},
  {q:'What if a listed component cannot be performed?',topic:'Authorization',stage:'Receive',a:'Notify Occu-Med immediately. Complete all components that are listed on the Authorization for Examination, perform only those listed components, and document the findings clearly.'},
  {q:'Can multiple clinic locations participate?',topic:'Network',stage:'Receive',a:'Yes. Network Management can maintain participating locations and the services available at each facility so referrals can be directed to the correct clinic.'},
  {q:'Who should we contact when the authorization is unclear?',topic:'Network',stage:'Receive',a:'Contact Occu-Med before the appointment or before performing an uncertain service. Do not add a service that is not clearly authorized while the scope question is unresolved.'},
  {q:'Who schedules the appointment?',topic:'Network',stage:'Schedule',a:'Occu-Med’s Scheduling Department receives the employer referral, contacts the employee or applicant and the provider or clinic to obtain availability, and coordinates the appointment.'},
  {q:'What happens after a missed appointment?',topic:'Network',stage:'Schedule',a:'A Scheduling Analyst follows up after a missed appointment and works to arrange another appointment so the examination can be completed.'},
  {q:'May we perform services outside the authorization?',topic:'Authorization',stage:'Examine',a:'No. Perform only the components listed on the Authorization for Examination. Contact Occu-Med before adding or billing any service outside that written authorization.'},
  {q:'Does our provider make the employment or deployment decision?',topic:'Examination',stage:'Examine',a:'No. The clinic documents the clinical findings. Occu-Med’s Exam Review Department—experienced subject matter experts and medical providers—evaluates the results against the applicable guidelines and employer requirements and issues the final recommendation.'},
  {q:'What happens if the provider identifies an abnormal finding?',topic:'Examination',stage:'Examine',a:'Document the finding and return the authorized examination records. If clarification or additional follow-up is required under the applicable guidelines, Occu-Med notifies the employee or applicant. That follow-up is the individual’s responsibility.'},
  {q:'Where should post-exam follow-up documentation go?',topic:'Records',stage:'Examine',a:'Additional follow-up documentation should be given directly to the employee or applicant rather than sent to Occu-Med by the clinic. The individual provides the follow-up information to Occu-Med for reconsideration and final review.'},
  {q:'What records must be returned after the authorized exam?',topic:'Records',stage:'Return',a:'Return every requested form, report, tracing, laboratory result, vaccination record, imaging result, or other supporting document required by the authorization and referral instructions. Provider Relations follows until all examination components and results have been received.'},
  {q:'How are missing or incomplete records handled?',topic:'Records',stage:'Return',a:'Exam Quality Assurance checks that all examination components are present and that the documentation is complete and accurate. If documentation is incomplete or missing, Provider Relations follows up with the clinic for amended or outstanding results.'},
  {q:'What does the medical review team do with the records?',topic:'Examination',stage:'Return',a:'The Exam Review Department evaluates the completed records against the applicable DoD or DoS guidelines and employer requirements, determines whether the individual can safely deploy or perform the essential job functions, and issues the final recommendation.'},
  {q:'What medical information is shared with the employer?',topic:'Privacy',stage:'Return',a:'Occu-Med does not share the individual’s medical information with the employer. The employer receives only the outcome of the evaluation.'},
  {q:'Why can the clinic send the medical records directly to Occu-Med?',topic:'Privacy',stage:'Return',a:'The exam packet includes an Authorization for Release of Information from Medical Records for the examinee to sign. That authorization permits the clinic to release the examination documentation directly to Occu-Med in accordance with the applicable privacy requirements described in the provider packet.'},
  {q:'Should the examinee be billed for authorized services?',topic:'Billing',stage:'Invoice',a:'No. Occu-Med’s employer clients cover the cost of authorized medical and occupational-health screening through Occu-Med. Examinees should not be billed directly for the authorized services.'},
  {q:'What should our invoice include?',topic:'Billing',stage:'Invoice',a:'Submit a complete itemized invoice with the examinee’s name, date of birth, date of service, itemized services performed, approved fees, and billing currency. Invoices may be sent to Finance@occu-med.com.'},
  {q:'When does NET 30 begin?',topic:'Billing',stage:'Invoice',a:'The NET 30 period begins after Occu-Med has received all authorized results and a complete, itemized invoice. Undisputed invoices are then paid within NET 30.'},
  {q:'How does Occu-Med issue payment?',topic:'Billing',stage:'Invoice',a:'The provider packet states that payments are issued by bank transfer or check in U.S. dollars for undisputed invoices after the required results and complete invoice have been received.'},
  {q:'What if our pricing changes later?',topic:'Billing',stage:'Invoice',a:'Fee updates may be submitted to Occu-Med for review and written approval. Once approved, the updated pricing applies to future appointments.'},
];

export default function QuestionExperience(){
  const[stage,setStage]=useState<Stage>('Receive');
  const[topic,setTopic]=useState<Topic>('All');
  const availableTopics=useMemo(()=>Array.from(new Set(QUESTIONS.filter(item=>item.stage===stage).map(item=>item.topic))),[stage]);
  const visible=useMemo(()=>QUESTIONS.map((item,index)=>({item,index})).filter(({item})=>item.stage===stage&&(topic==='All'||item.topic===topic)),[stage,topic]);
  const[open,setOpen]=useState(0);
  const active=QUESTIONS[open]??QUESTIONS[0];
  const activeVisible=Math.max(0,visible.findIndex(({index})=>index===open));
  const stageIndex=Math.max(0,STAGES.findIndex(item=>item.stage===stage));
  const stageKey=stage.toLowerCase();

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

  return <main className={`${styles.root} ${stageMotion.root}`} data-stage={stageKey}>
    <header className={styles.topbar}><a href="/experience#provider-portals">OCCU-MED / PROVIDER Q&A</a><div><a href="/experience/network">NETWORK</a> · <a href="/experience/resources">RESOURCES</a> · <a href="/experience/agreement">AGREEMENT</a></div></header>

    <aside className={styles.sidebar}>
      <span className={styles.railLabel}>REFERRAL LIFECYCLE</span>
      <nav className={styles.stageRail} aria-label="Referral lifecycle">{STAGES.map(x=><button key={x.stage} aria-pressed={stage===x.stage} onClick={()=>choose(x.stage)}><small>{x.number}</small><b>{x.stage}</b><em>{x.note}</em></button>)}</nav>
      <div className={styles.questionRail}>
        <span>QUESTIONS / {stage.toUpperCase()}</span>
        {visible.map(({item,index},i)=><button key={item.q} aria-pressed={open===index} onClick={()=>setOpen(index)}><small>{String(i+1).padStart(2,'0')}</small><b>{item.q}</b></button>)}
      </div>
    </aside>

    <section className={`${styles.explorer} ${stageMotion.explorer}`} data-stage={stageKey}>
      <QuestionField count={Math.min(4,Math.max(1,visible.length))} active={activeVisible%4} stageIndex={stageIndex}/>
      <div className={styles.explorerHeading}><span>PORTAL 04 / {stage.toUpperCase()}</span><h1>{STAGES[stageIndex].note}</h1></div>
      <div className={styles.filters}><span>LAYERS</span>{availableTopics.map(x=><button key={x} aria-pressed={topic===x} onClick={()=>toggleTopic(x)}>{x}</button>)}</div>
      <div className={styles.fieldMeta} aria-hidden="true"><span>KNOWLEDGE FIELD / {STAGES[stageIndex].number}</span><b>{String(activeVisible+1).padStart(2,'0')}</b><small> / {String(visible.length).padStart(2,'0')}</small></div>
      <article className={styles.detail} key={open}><small>{active.stage} / {active.topic}</small><h2>{active.q}</h2><p>{active.a}</p><span className={styles.detailIndex}>{String(activeVisible+1).padStart(2,'0')}</span></article>
    </section>
  </main>;
}
