'use client';

import { Suspense, useState, type CSSProperties, type ReactNode } from 'react';
import PricingAgreementBuilder from './PricingAgreementBuilder';
import styles from './PortalExperience.module.css';

const NAV = [['history','History'],['network','Network'],['resources','Resources'],['questions','Q&A'],['agreement','Agreement']] as const;

export function PortalShell({ active, eyebrow, title, intro, children, light = false }: { active:string; eyebrow:string; title:string; intro:string; children:ReactNode; light?:boolean }) {
  return <main className={styles.shell}>
    <nav className={styles.nav} aria-label="Provider portals"><a className={styles.brand} href="/experience">OCCU-MED / PORTALS</a><div>{NAV.map(([id,label])=><a className={active===id?styles.active:''} href={`/experience/${id}`} key={id}>{label}</a>)}</div></nav>
    <header className={styles.hero} style={{'--glow':active==='history'?'#4b3822':active==='resources'?'#332c58':'#174a61'} as CSSProperties}><div><span className={styles.kicker}>{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div></header>
    <section className={`${styles.section} ${light?styles.light:''}`}>{children}</section>
  </main>;
}

const MILESTONES = [
  ['1976','The research begins','A federally funded project investigates safer, medically appropriate, and legally defensible employment standards before the company exists.'],
  ['1979','Founded in Honolulu','Attorney Jim A. Johnson and Dr. Devonna M. Kaji create Occu-Med around medical, legal, and job-specific context.'],
  ['2000','The company formalizes','Occu-Med, Ltd. incorporates after two decades of operational experience.'],
  ['2006','International expansion','The evaluation model begins supporting international companies and deployment readiness.'],
  ['2007','Federal registration','Federal-contractor registration expands direct support for defense and government missions.'],
  ['2017','Global infrastructure','Contemporary reporting describes pre-placement infrastructure spanning more than 36 countries.'],
  ['2018–21','A new generation leads','Operations and company leadership transition while the provider network continues to expand.'],
  ['TODAY','One connected network','More than one million employees supported through over 15,000 provider locations across 50+ countries.'],
] as const;

export function HistoryPortal(){return <PortalShell active="history" eyebrow="PORTAL 01 / COMPANY HISTORY" title="The long way forward." intro="Move through the pivotal moments that turned one occupational-health question into a global operating model." light><div className={styles.timeline}>{MILESTONES.map(([year,title,copy])=><article className={styles.milestone} key={year}><b>{year}</b><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></PortalShell>}

const NETWORK_VIEWS = {
  'All locations': { total: 23544, note: 'Every active anonymized directory record', rows: [['Medical provider',9420],['Pharmacy',3309],['Dental',3143],['Urgent care',2635],['Laboratory',1919],['Occupational medicine',1415],['Hospitals',590],['Diagnostics & specialists',1063]] },
  'United States': { total: 22678, note: 'United States and U.S. territories', rows: [['California',2512],['Texas',2065],['Florida',1211],['New York',936],['Georgia',808],['Illinois',802],['North Carolina',793],['Pennsylvania',760]] },
  'International': { total: 866, note: 'Records beyond the United States and territories', rows: [['South Africa',160],['India',63],['Australia',42],['Canada',32],['Turkey',30],['United Kingdom',29],['Jordan',22],['Afghanistan',22]] },
  'Medical': { total: 14133, note: 'Medical, occupational, urgent-care, and hospital capacity', rows: [['Medical provider',9420],['Urgent care',2635],['Occupational medicine',1415],['Hospitals',590],['Primary care',76]] },
  'Dental': { total: 3143, note: 'Dental and dental-readiness capacity', rows: [['Dental facilities',3143]] },
  'Diagnostic': { total: 2885, note: 'Laboratory, imaging, cardiology, and audiology capacity', rows: [['Laboratory',1919],['Drug testing laboratory',294],['Imaging / radiology',278],['Cardiology',267],['Audiology / hearing',127]] },
} as const;
type NetworkView = keyof typeof NETWORK_VIEWS;

export function NetworkPortal(){
  const [region,setRegion]=useState<NetworkView>('All locations');
  const view=NETWORK_VIEWS[region];
  const largest=Math.max(...view.rows.map(([,count])=>count));
  return <PortalShell active="network" eyebrow="PORTAL 02 / NETWORK EXPLORER" title="A world of places to land." intro="Explore an anonymized view of Occu-Med’s active provider infrastructure by facility type and geography."><div className={styles.network}><div className={styles.stars}>{Array.from({length:160},(_,i)=><i key={i} style={{'--x':`${(i*47)%100}%`,'--y':`${(i*71)%100}%`,'--delay':`${(i%14)*-.2}s`} as CSSProperties}/>)}</div><div className={styles.networkContent}><div className={styles.stat}><b>{view.total.toLocaleString()}</b><small>{view.note.toUpperCase()}</small></div><div className={styles.filters}>{(Object.keys(NETWORK_VIEWS) as NetworkView[]).map(x=><button className={region===x?styles.chosen:''} onClick={()=>setRegion(x)} key={x}>{x}</button>)}</div><div className={styles.bars} aria-live="polite">{view.rows.map(([name,count])=><div className={styles.bar} key={name}><span>{name}</span><i style={{transform:`scaleX(${count/largest})`}}/><b>{count.toLocaleString()}</b></div>)}</div></div></div></PortalShell>
}

const RESOURCE=[['Occupational medicine','Authorizations, examination packets, occupational testing, and records-return guidance.'],['Dental','Dental-readiness examinations, imaging requirements, documentation, and invoicing.'],['Laboratory','Collection instructions, requested panels, handling requirements, and result transmission.'],['Cardiology','EKG, treadmill testing, consultation reports, tracings, and interpretation requirements.'],['Imaging','Authorized diagnostic studies, final reports, and image-access instructions.'],['Pharmacy / vaccination','Requested immunizations, administration records, lot details, and updated vaccine histories.']];
export function ResourcesPortal(){const [selected,setSelected]=useState(RESOURCE[0]);return <PortalShell active="resources" eyebrow="PORTAL 03 / PROVIDER RESOURCES" title="Start with what you do." intro="Choose a specialty to enter a focused resource path instead of searching through one generic document library." light><div className={styles.cards}>{RESOURCE.map(item=><article className={styles.card} key={item[0]}><span>SPECIALTY PATH</span><h3>{item[0]}</h3><p>{item[1]}</p><button onClick={()=>setSelected(item)}>Open guidance →</button></article>)}</div><article className={styles.card} style={{marginTop:12,minHeight:0}}><span>ACTIVE RESOURCE PATH</span><h3>{selected[0]}</h3><p>{selected[1]} Resources appear here with their effective date, version, preview, and download action.</p><a className={styles.cta} href="/api/provider-resources/stateside-guide">Download stateside provider guide ↓</a></article></PortalShell>}

const QUESTIONS=[
  ['What is Occu-Med’s role?','Occu-Med coordinates the referral, scheduling, documentation follow-up, quality assurance, and applicable medical review.'],
  ['What does our clinic receive?','The clinic receives an authorization identifying the examinee, requested services, required forms, and return instructions.'],
  ['Who schedules the appointment?','Occu-Med coordinates the examinee’s availability with your clinic and confirms the appointment with all involved parties.'],
  ['What happens after a missed appointment?','A Scheduling Analyst follows up with the examinee and coordinates a replacement appointment with the clinic.'],
  ['May we perform services outside the authorization?','No. Contact Occu-Med for approval before providing any service that is not listed on the authorization.'],
  ['What records must be returned?','Return every requested form, report, tracing, image, laboratory result, and vaccination record required by the case.'],
  ['Does our provider make the employment decision?','No. The clinic documents its findings. Occu-Med evaluates those findings against applicable job or deployment requirements.'],
  ['How are missing records handled?','Provider Relations follows up with the clinic, and Quality Assurance identifies incomplete, missing, or inconsistent documentation.'],
  ['What happens when findings require follow-up?','Occu-Med communicates applicable follow-up requirements to the examinee, who may return to the same clinic for continuity of care.'],
  ['What information reaches the employer?','Occu-Med communicates the applicable outcome, not the examinee’s confidential medical details.'],
  ['How should we invoice?','Invoice Occu-Med using the accepted fee schedule and the billing directions provided with the referral.'],
  ['Can multiple locations participate?','Yes. Each location and its available services can be identified in the provider proposal and reviewed by Network Management.'],
];
export function QuestionsPortal(){const [open,setOpen]=useState(0);return <PortalShell active="questions" eyebrow="PORTAL 04 / PROVIDER Q&A" title="Clear before the first referral." intro="The practical answers a provider needs to schedule, examine, document, and invoice correctly." light><div className={styles.faq}>{QUESTIONS.map(([q,a],i)=><article key={q}><button aria-expanded={open===i} onClick={()=>setOpen(i)}><span>{String(i+1).padStart(2,'0')}</span><strong>{q}</strong><b>{open===i?'−':'+'}</b></button>{open===i&&<p>{a}</p>}</article>)}</div></PortalShell>}

export function AgreementPortal(){return <PortalShell active="agreement" eyebrow="PORTAL 05 / PROVIDER AGREEMENT" title="Define the relationship." intro="Prepare facility information, services, and pricing for Network Management review."><div className={styles.agreementIntro}><span className={styles.kicker}>OCCU-MED FORMS</span><h2>Provider Fee Proposal</h2><p>This open proposal does not execute a final service agreement. Accepted pricing proceeds to the secure Occu-Med Forms invitation workflow.</p></div><Suspense fallback={<p>Preparing agreement…</p>}><PricingAgreementBuilder specialty="Occupational Medicine" services={['Physical examinations','Audiometry','Spirometry / PFT','EKG','Drug & alcohol testing','Vaccinations']}/></Suspense></PortalShell>}
