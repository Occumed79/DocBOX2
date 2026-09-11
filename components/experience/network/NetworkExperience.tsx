'use client';

import { useMemo, useState, useEffect } from 'react';
import styles from './NetworkExperience.module.css';
import regionStyles from './NetworkRegions.module.css';
import CesiumNetworkGlobe from './CesiumNetworkGlobe';

type Layer='all'|'medical'|'dental'|'diagnostic'|'pharmacy';
type Point={lon:number;lat:number;type:Layer;label?:string;count?:number};
type Region={id:string;label:string;lon:number;lat:number;height:number};
type Focus=Region&{nonce:number};

const TOTALS:Record<Layer,number>={all:23524,medical:14207,dental:3141,diagnostic:2867,pharmacy:3309};
const LAYER_LABELS:Record<Layer,string>={all:'All facilities',medical:'Medical',dental:'Dental',diagnostic:'Diagnostics',pharmacy:'Pharmacy'};
const REGIONS:readonly Region[]=[
  {id:'world',label:'World',lon:-18,lat:18,height:18500000},
  {id:'americas',label:'Americas',lon:-91,lat:22,height:8500000},
  {id:'europe',label:'Europe',lon:15,lat:50,height:4200000},
  {id:'africa-me',label:'Africa + Middle East',lon:31,lat:18,height:6500000},
  {id:'asia-pacific',label:'Asia-Pacific',lon:113,lat:10,height:9000000},
];

const AGGREGATE_GEO:Point[]=[
  {label:'California',lat:36.7,lon:-119.4,count:2512,type:'all'},{label:'Texas',lat:31,lon:-99.9,count:2065,type:'all'},{label:'Florida',lat:27.8,lon:-81.7,count:1211,type:'all'},{label:'New York',lat:43,lon:-75,count:936,type:'all'},{label:'Georgia',lat:32.7,lon:-83.3,count:808,type:'all'},{label:'Illinois',lat:40,lon:-89.2,count:802,type:'all'},{label:'North Carolina',lat:35.5,lon:-79.4,count:793,type:'all'},{label:'Pennsylvania',lat:41,lon:-77.7,count:760,type:'all'},{label:'South Africa',lat:-30.6,lon:22.9,count:160,type:'all'},{label:'India',lat:21.1,lon:78,count:63,type:'all'},{label:'Australia',lat:-25.3,lon:133.8,count:42,type:'all'},{label:'Canada',lat:56.1,lon:-106.3,count:32,type:'all'},{label:'Turkey',lat:39,lon:35.2,count:30,type:'all'},{label:'United Kingdom',lat:55,lon:-3.4,count:29,type:'all'},{label:'Jordan',lat:31.2,lon:36.5,count:22,type:'all'},{label:'Afghanistan',lat:33.9,lon:67.7,count:22,type:'all'},
];

const BREAKDOWNS=[
  {title:'Facility capacity',total:23524,rows:[['Medical provider',9420],['Pharmacy',3309],['Dental',3141],['Urgent care',2635],['Laboratory',1919],['Occupational medicine',1415],['Hospitals',590],['Diagnostics & specialists',1063]] as const},
  {title:'International reach',total:866,rows:[['South Africa',160],['India',63],['Australia',42],['Canada',32],['Turkey',30],['United Kingdom',29],['Jordan',22],['Afghanistan',22]] as const},
  {title:'Largest U.S. states',total:22678,rows:[['California',2512],['Texas',2065],['Florida',1211],['New York',936],['Georgia',808],['Illinois',802],['North Carolina',793],['Pennsylvania',760]] as const},
  {title:'Diagnostic capacity',total:2867,rows:[['Laboratory',1919],['Drug testing laboratory',294],['Imaging / radiology',278],['Cardiology',267],['Audiology / hearing',127]] as const},
];

function classify(value:unknown):Layer{const text=String(value??'').toLowerCase();if(text.includes('dental'))return'dental';if(text.includes('pharm')||text.includes('vaccin'))return'pharmacy';if(text.includes('lab')||text.includes('diagn')||text.includes('imag')||text.includes('radio')||text.includes('cardio')||text.includes('audio'))return'diagnostic';return'medical'}
function normalizeDataset(payload:unknown):Point[]{
  const rows=Array.isArray(payload)?payload:(payload&&typeof payload==='object'&&Array.isArray((payload as{points?:unknown[]}).points)?(payload as{points:unknown[]}).points:[]);
  const points:Point[]=[];
  for(const row of rows){
    if(Array.isArray(row)){const lon=Number(row[0]),lat=Number(row[1]);if(Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180)points.push({lon,lat,type:classify(row[2])});continue}
    if(!row||typeof row!=='object')continue;
    const record=row as Record<string,unknown>,lat=Number(record.lat??record.latitude??record.y),lon=Number(record.lon??record.lng??record.longitude??record.x);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)continue;
    points.push({lat,lon,type:classify(record.type??record.category??record.provider_type)});
  }
  return points;
}

export default function NetworkExperience(){
  const[layer,setLayer]=useState<Layer>('all');
  const[points,setPoints]=useState<Point[]>([]);
  const[mode,setMode]=useState<'coordinates'|'aggregate'|'loading'>('loading');
  const[activeRegion,setActiveRegion]=useState('world');
  const[focus,setFocus]=useState<Focus>({...REGIONS[0],nonce:0});

  useEffect(()=>{
    let cancelled=false;
    fetch('/data/provider-network-points.json',{cache:'force-cache'})
      .then(response=>{if(!response.ok)throw new Error('coordinate dataset unavailable');return response.json()})
      .then(payload=>{if(cancelled)return;const normalized=normalizeDataset(payload);if(!normalized.length)throw new Error('coordinate dataset empty');setPoints(normalized);setMode('coordinates')})
      .catch(()=>{if(!cancelled)setMode('aggregate')});
    return()=>{cancelled=true};
  },[]);

  const renderPoints=useMemo<readonly Point[]>(()=>mode==='coordinates'?points:AGGREGATE_GEO,[mode,points]);
  const selectedCount=layer==='all'?TOTALS.all:TOTALS[layer];
  const focusRegion=(region:Region)=>{setActiveRegion(region.id);setFocus({...region,nonce:Date.now()})};

  return <main className={styles.root}>
    <header className={styles.topbar}><a href="/experience#provider-portals">OCCU-MED / NETWORK ATLAS</a><nav aria-label="Provider portals"><a href="/experience/history">History</a><a href="/experience/network" aria-current="page">Network</a><a href="/experience/resources">Resources</a><a href="/experience/questions">Q&A</a><a href="/experience/agreement">Agreement</a></nav></header>
    <section className={styles.hero}>
      <div className={styles.fieldIndex} aria-hidden="true"><span>GLOBAL PROVIDER FIELD</span><b>23,524</b><small>ANONYMIZED NODES</small></div>
      <div className={styles.copy}><span>PORTAL 02 / PROVIDER NETWORK</span><h1>Follow the<br/>network.</h1><p>Explore Occu-Med’s anonymized provider infrastructure as a living globe. Orbit the Earth, dive into regions, switch clinical layers, and inspect network density without exposing provider identities.</p><div className={styles.mode} data-mode={mode}><i/>{mode==='coordinates'?`${points.length.toLocaleString()} coordinate records loaded`:mode==='loading'?'Loading coordinate layer…':'Aggregate geography active · coordinate file awaiting recovery'}</div><div className={styles.stats}><div className={styles.stat}><b>23,524</b><small>mapped anonymized coordinates</small></div><div className={styles.stat}><b>22,678</b><small>U.S. & territories</small></div><div className={styles.stat}><b>866</b><small>international records</small></div></div></div>
      <div className={styles.mapShell}>
        <div className={styles.mapToolbar}>
          <div className={styles.layers} aria-label="Network layers">{(Object.keys(LAYER_LABELS) as Layer[]).map(key=><button key={key} type="button" aria-pressed={layer===key} onClick={()=>setLayer(key)}>{LAYER_LABELS[key]} · {TOTALS[key].toLocaleString()}</button>)}</div>
          <div className={regionStyles.regions}><span className={regionStyles.label}>GEOGRAPHIC VIEW</span><div className={regionStyles.grid}>{REGIONS.map(region=><button key={region.id} type="button" data-active={activeRegion===region.id} onClick={()=>focusRegion(region)}>{region.label}</button>)}</div></div>
          <button className={styles.reset} type="button" onClick={()=>focusRegion(REGIONS[0])}>Reset orbit</button>
        </div>
        <div className={styles.canvasWrap}>
          <div className={styles.reticle} aria-hidden="true"><i/><i/><span>ORBIT</span></div>
          <CesiumNetworkGlobe points={renderPoints} layer={layer} mode={mode} focus={focus} onExplore={()=>setActiveRegion('custom')}/>
          <div className={styles.instructions}>Drag to orbit · scroll or pinch to zoom · choose a layer or geographic view. Provider identities are never rendered.</div>
        </div>
        <div className={styles.mapFooter} aria-live="polite"><span><strong>{LAYER_LABELS[layer]}</strong> selected · {selectedCount.toLocaleString()} directory records</span><span>{activeRegion==='custom'?'Free orbit':REGIONS.find(region=>region.id===activeRegion)?.label} · Cesium globe</span></div>
      </div>
    </section>
    <section className={styles.explorer}><div className={styles.explorerHead}><div><span className={styles.panelLabel}>NETWORK INTELLIGENCE / ACCESSIBLE DETAIL</span><h2>The globe has a second language.</h2></div><p>The geographic view is paired with equivalent aggregate results so the network remains understandable without relying on pointer interaction or color alone.</p></div><div className={styles.breakdown}>{BREAKDOWNS.map(group=>{const max=Math.max(...group.rows.map(([,count])=>count));return <article key={group.title}><header><h3>{group.title}</h3><b>{group.total.toLocaleString()}</b></header>{group.rows.map(([name,count])=><div className={styles.bar} key={name}><span>{name}</span><i style={{transform:`scaleX(${count/max})`}}/><b>{count.toLocaleString()}</b></div>)}</article>})}</div></section>
  </main>;
}
