export type HistoryCategory='FOUNDATION'|'METHOD'|'GROWTH'|'OPERATIONS'|'GLOBAL'|'CULTURE';
export type HistoryKind='milestone'|'story';

export type HistoryItem={
  id:string;
  kind:HistoryKind;
  position:number;
  lane:number;
  year:string;
  title:string;
  summary:string;
  body:string;
  category:HistoryCategory;
  image?:string;
  related?:readonly string[];
  person?:string;
  detail?:string;
};

export const HISTORY_CATEGORIES:readonly ('ALL'|HistoryCategory)[]=[
  'ALL','FOUNDATION','METHOD','GROWTH','OPERATIONS','GLOBAL','CULTURE'
];

export const HISTORY_ITEMS:readonly HistoryItem[]=[
  {
    id:'founded',kind:'milestone',position:0,lane:15,year:'1979',title:'Occu-Med is founded in Honolulu',
    summary:'A new placement model begins with the job—not a generic physical.',
    body:'Occu-Med was established in Honolulu, Hawaii, in 1979 by attorney Jim A. Johnson and Dr. Devonna M. Kaji. The company emerged during a period when workers’ compensation costs were placing major pressure on public agencies and private employers. Its founding approach combined medical, legal and job-specific knowledge so placement decisions could be made in the context of the work itself.',
    category:'FOUNDATION',image:'Founders.png',related:['discovery','traditional-exams','solution']
  },
  {
    id:'discovery',kind:'story',position:.055,lane:10,year:'1979',title:'The Critical Discovery',
    summary:'California-funded research identifies a preventable pattern behind workplace injuries.',
    body:'Research funded by the State of California found that a significant number of workplace injuries were linked to employees hired with pre-existing medical conditions that elevated their risk once on the job. The company materials also identify first-year employment as a major injury period, reporting that 41% of workplace injuries occur during an employee’s first year.',
    category:'FOUNDATION',related:['traditional-exams','solution'],person:'THE RESEARCH QUESTION',detail:'41% of workplace injuries occur during an employee’s first year.'
  },
  {
    id:'traditional-exams',kind:'story',position:.105,lane:21,year:'1979',title:'The Problem With Traditional Exams',
    summary:'A general physical could document health without answering the job-specific placement question.',
    body:'Occu-Med’s history describes the limitation of asking a physician to make a placement decision without enough information about the actual job, its essential functions and the requirements governing the position. The problem was not whether a physician could determine that someone was healthy; it was whether the medical findings mattered for the work the person was expected to perform.',
    category:'FOUNDATION',related:['discovery','solution'],person:'THE OLD MODEL',detail:'Healthy and job-ready are not the same question.'
  },
  {
    id:'solution',kind:'story',position:.155,lane:6,year:'1979',title:'Occu-Med’s Solution',
    summary:'Medical evidence, legal requirements and job-specific demands become one placement framework.',
    body:'Occu-Med’s method combines medical findings with legal and occupational context. The applicable medical information is interpreted against the essential functions and requirements of the position so the final recommendation is tied to the work rather than a generic definition of health.',
    category:'METHOD',related:['discovery','examqa'],person:'THE JOB-CENTERED MODEL',detail:'Medical findings + legal context + actual job demands.'
  },
  {
    id:'incorporated',kind:'milestone',position:.405,lane:17,year:'2000',title:'Occu-Med, Ltd. is formally incorporated',
    summary:'A corporate structure is placed around the methodology developed since 1979.',
    body:'Occu-Med, Ltd. was formally incorporated in 2000, placing a corporate structure around the occupational-health methodology and operating model that had developed since the company’s founding.',
    category:'GROWTH',image:'California - Hawaii Map.png',related:['examqa']
  },
  {
    id:'examqa',kind:'story',position:.465,lane:24,year:'2003',title:'EXAMQA Becomes a Training Ground',
    summary:'Examination quality assurance becomes part of the company’s next stage of growth.',
    body:'The company’s history identifies EXAMQA as a formative part of its internal operating model. By 2003, the examination and quality-assurance process was also serving as a training ground for people who would later take on broader responsibilities inside the company.',
    category:'METHOD',related:['solution','international'],person:'EXAMQA',detail:'Examination findings, documentation and quality assurance.'
  },
  {
    id:'international',kind:'milestone',position:.535,lane:13,year:'2006',title:'The method goes international',
    summary:'Occu-Med expands evaluation services to international companies.',
    body:'In 2006, Occu-Med expanded evaluation services internationally. The same job-centered method now had to operate across borders, local provider systems, deployment requirements and destination-specific medical standards.',
    category:'GLOBAL',image:'International Certification.png',related:['federal','global-network']
  },
  {
    id:'federal',kind:'milestone',position:.585,lane:19,year:'2007',title:'Federal mission support opens',
    summary:'Federal registration creates a path into government and deployment-readiness work.',
    body:'Occu-Med’s history marks 2007 as a key step into federal contracting and deployment-related medical support, extending the company’s occupational-health model into work performed for government missions and contractors.',
    category:'GLOBAL',image:'Diverse Workforce.png',related:['international','growth-2017']
  },
  {
    id:'growth-2017',kind:'milestone',position:.735,lane:12,year:'~2017',title:'International infrastructure matures',
    summary:'International coverage and deployment support become established parts of the operating model.',
    body:'By the mid-2010s, international and deployment-related programs had become an established part of Occu-Med’s operating history. The company’s work in locations such as Kuwait demonstrated how the model could coordinate examinations, local clinical services, documentation and medical requirements at mission scale.',
    category:'GROWTH',image:'International Network.png',related:['global-network','leadership-2018']
  },
  {
    id:'leadership-2018',kind:'milestone',position:.775,lane:20,year:'2018',title:'The next generation moves into operations',
    summary:'Leadership transition begins while the founding methodology remains intact.',
    body:'In 2018, the next generation of company leadership moved into an operations leadership role. The transition expanded operational leadership around the same core model: job information, clinical evidence, quality assurance and medical review.',
    category:'GROWTH',image:'Diverse Healthcare Team Portrait (1).png',related:['leadership-2021']
  },
  {
    id:'leadership-2021',kind:'milestone',position:.835,lane:14,year:'2021',title:'Leadership continuity',
    summary:'The next-generation transition reaches the President role.',
    body:'In 2021, the next generation moved into the President role while Occu-Med continued operating the network, scheduling, provider-relations, EXAMQA and medical-review functions around the company’s original job-centered placement methodology.',
    category:'GROWTH',image:'Diverse Workforce2.png',related:['today']
  },
  {
    id:'process',kind:'story',position:.885,lane:4,year:'TODAY',title:'From Referral to Outcome',
    summary:'Scheduling, clinical care, records, QA and medical review operate as one connected case process.',
    body:'A referral begins the medical-evaluation process. Scheduling confirms availability and the clinic appointment, the clinic performs the authorized examination, the completed records return to Occu-Med, and the results are reviewed against the applicable job or deployment requirements. The final outcome is communicated to the employer without the employee’s medical details.',
    category:'OPERATIONS',related:['standards','services'],person:'THE OPERATING CHAIN',detail:'Referral → scheduling → examination → records → review → outcome.'
  },
  {
    id:'standards',kind:'story',position:.915,lane:27,year:'TODAY',title:'Standards Travel With the Work',
    summary:'The applicable medical criteria depend on the position and operating environment.',
    body:'Current company materials describe medical review against the applicable guidelines for the individual’s job classification and area of deployment. The operating standard changes with the position, assignment and environment; the central requirement is that findings be interpreted in occupational context.',
    category:'OPERATIONS',related:['process','services'],person:'MEDICAL & OCCUPATIONAL STANDARDS',detail:'The job and operating environment determine the applicable criteria.'
  },
  {
    id:'services',kind:'story',position:.942,lane:8,year:'TODAY',title:'One Method, Multiple Service Lines',
    summary:'The job-centered principle supports a broader set of occupational-health programs.',
    body:'Current services described by Occu-Med include pre-placement medical evaluations, deployment medical readiness, fitness-for-duty and return-to-work evaluations, periodic medical evaluations, immunizations, embassy-linked medical clearance and post-deployment health assessment.',
    category:'OPERATIONS',related:['process','global-network'],person:'CURRENT SERVICES',detail:'The service changes; occupational context remains central.'
  },
  {
    id:'global-network',kind:'story',position:.965,lane:23,year:'TODAY',title:'A Global Provider Network',
    summary:'A broad clinical network gives the operating model somewhere to land.',
    body:'Current Occu-Med materials describe approximately 15,000 affiliated medical and dental locations in the company’s global network. That infrastructure supports the coordination of occupational-health and deployment-related examinations across many different operating environments.',
    category:'GLOBAL',related:['services','values'],person:'GLOBAL REACH',detail:'Approximately 15,000 affiliated medical and dental locations.'
  },
  {
    id:'values',kind:'story',position:.983,lane:29,year:'TODAY',title:'The Values Behind the Work',
    summary:'Six operating values define how the system is carried from referral to final determination.',
    body:'Humility. Positivity. Customer service. Quality. Integrity. Diligence. These six core values describe the culture expected around the process—from the first provider interaction through quality assurance and the final medical recommendation.',
    category:'CULTURE',related:['global-network','today'],person:'CORE VALUES',detail:'Humility · Positivity · Customer Service · Quality · Integrity · Diligence.'
  },
  {
    id:'today',kind:'milestone',position:1,lane:16,year:'TODAY',title:'The founding principle is still the center',
    summary:'The scale has changed; the job-centered placement idea remains.',
    body:'Current Occu-Med materials describe service to more than one million employees across approximately 15,000 global locations since 1979. The company’s present-day services are broader and its provider infrastructure is larger, but the core idea remains the same: medical findings have to be interpreted in the context of the work.',
    category:'GROWTH',image:'Facilities.png',related:['process','global-network','values']
  }
] as const;

export function historyItemById(id:string|null|undefined){
  return HISTORY_ITEMS.find(item=>item.id===id)??null;
}
