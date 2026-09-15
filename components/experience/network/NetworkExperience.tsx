'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './NetworkExperience.module.css';
import CesiumNetworkGlobe from './CesiumNetworkGlobe';

export type Layer='all'|'medical'|'dental'|'laboratory'|'imaging'|'cardiology'|'audiology'|'drug-testing'|'pharmacy'|'diagnostic';
type Panel='layers'|'regions'|'coverage';
export type NetworkPoint={lon:number;lat:number;type:Exclude<Layer,'all'>;label?:string;count?:number};
type Region={id:string;label:string;lon:number;lat:number;height:number};
type Focus=Region&{nonce:number};

export const NETWORK_COLORS:Record<Layer,string>={all:'#8eeaff',medical:'#36d8ff',dental:'#ff7eb6',laboratory:'#b477ff',imaging:'#5f91ff',cardiology:'#ff5f62',audiology:'#42e6b1','drug-testing':'#ffad4a',pharmacy:'#e8df69',diagnostic:'#899cff'};
const LAYER_LABELS:Record<Layer,string>={all:'All Providers',medical:'Medical / Occupational Health',dental:'Dental',laboratory:'Laboratory',imaging:'Imaging / Radiology',cardiology:'Cardiology',audiology:'Audiology / Hearing','drug-testing':'Drug Testing',pharmacy:'Pharmacy / Vaccination',diagnostic:'Other Diagnostics'};
const LAYER_DETAIL:Record<Layer,string>={all:'Every mapped provider node',medical:'Exam-capable medical providers',dental:'Dental evaluation capacity',laboratory:'Laboratory services',imaging:'Imaging and radiology services',cardiology:'Cardiology services',audiology:'Hearing and audiology services','drug-testing':'Drug testing services',pharmacy:'Pharmacy and vaccination capacity',diagnostic:'Diagnostic records without a supported subtype'};
const FILTERS:readonly Layer[]=['all','medical','dental','laboratory','imaging','cardiology','audiology','drug-testing','pharmacy','diagnostic'];
const REGIONS:readonly Region[]=[
  {id:'world',label:'World',lon:-18,lat:18,height:18500000},{id:'americas',label:'Americas',lon:-91,lat:22,height:8500000},{id:'europe',label:'Europe',lon:15,lat:50,height:4200000},{id:'africa-me',label:'Africa + Middle East',lon:31,lat:18,height:6500000},{id:'asia-pacific',label:'Asia-Pacific',lon:113,lat:10,height:9000000},
];
const PANELS:[Panel,string,string][]=[['layers','Provider filters','01'],['regions','Geography','02'],['coverage','Coverage','03']];
const AGGREGATE_GEO:NetworkPoint[]=[
  {label:'California',lat:36.7,lon:-119.4,count:2512,type:'medical'},{label:'Texas',lat:31,lon:-99.9,count:2065,type:'medical'},{label:'Florida',lat:27.8,lon:-81.7,count:1211,type:'medical'},{label:'New York',lat:43,lon:-75,count:936,type:'medical'},{label:'Georgia',lat:32.7,lon:-83.3,count:808,type:'medical'},{label:'Illinois',lat:40,lon:-89.2,count:802,type:'medical'},{label:'North Carolina',lat:35.5,lon:-79.4,count:793,type:'medical'},{label:'Pennsylvania',lat:41,lon:-77.7,count:760,type:'medical'},{label:'South Africa',lat:-30.6,lon:22.9,count:160,type:'medical'},{label:'India',lat:21.1,lon:78,count:63,type:'medical'},{label:'Australia',lat:-25.3,lon:133.8,count:42,type:'medical'},{label:'Canada',lat:56.1,lon:-106.3,count:32,type:'medical'},{label:'Turkey',lat:39,lon:35.2,count:30,type:'medical'},{label:'United Kingdom',lat:55,lon:-3.4,count:29,type:'medical'},
];

function classify(value:unknown):Exclude<Layer,'all'>{
  const text=String(value??'').toLowerCase();
  if(/dental|dentist|orthodont/.test(text))return'dental';
  if(/drug.?test|toxicolog|collection site|screening/.test(text))return'drug-testing';
  if(/pharm|vaccin|immuniz/.test(text))return'pharmacy';
  if(/laborator|\blab\b|patholog/.test(text))return'laboratory';
  if(/imag|radiolog|x.?ray|mri|ultrasound|mammogra/.test(text))return'imaging';
  if(/cardio|\becg\b|\bekg\b|heart/.test(text))return'cardiology';
  if(/audio|hearing|audiometr/.test(text))return'audiology';
  if(/diagnostic/.test(text))return'diagnostic';
  return'medical';
}
function normalizeDataset(payload:unknown):NetworkPoint[]{
  const rows=Array.isArray(payload)?payload:(payload&&typeof payload==='object'&&Array.isArray((payload as{points?:unknown[]}).points)?(payload as{points:unknown[]}).points:[]),points:NetworkPoint[]=[];
  for(const row of rows){
    if(Array.isArray(row)){const lon=Number(row[0]),lat=Number(row[1]);if(Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180)points.push({lon,lat,type:classify(row[2])});continue}
    if(!row||typeof row!=='object')continue;const record=row as Record<string,unknown>,lat=Number(record.lat??record.latitude??record.y),lon=Number(record.lon??record.lng??record.longitude??record.x);
    if(Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180)points.push({lat,lon,type:classify(record.service_type??record.services??record.specialty??record.type??record.category??record.provider_type)});
  }return points;
}

export default function NetworkExperience(){
  const[layer,setLayer]=useState<Layer>('all'),[panel,setPanel]=useState<Panel>('layers'),[points,setPoints]=useState<NetworkPoint[]>([]),[mode,setMode]=useState<'coordinates'|'aggregate'|'loading'>('loading'),[activeRegion,setActiveRegion]=useState('world'),[focus,setFocus]=useState<Focus>({...REGIONS[0],nonce:0});
  useEffect(()=>{let cancelled=false;fetch('/data/provider-network-points.json',{cache:'force-cache'}).then(response=>{if(!response.ok)throw new Error();return response.json()}).then(payload=>{if(cancelled)return;const normalized=normalizeDataset(payload);if(!normalized.length)throw new Error();setPoints(normalized);setMode('coordinates')}).catch(()=>{if(!cancelled)setMode('aggregate')});return()=>{cancelled=true}},[]);
  const renderPoints=useMemo<readonly NetworkPoint[]>(()=>mode==='coordinates'?points:AGGREGATE_GEO,[mode,points]);
  const totals=useMemo(()=>{const value=Object.fromEntries(FILTERS.map(key=>[key,0])) as Record<Layer,number>;for(const point of renderPoints){value.all+=point.count??1;value[point.type]+=point.count??1}return value},[renderPoints]);
  const selectedCount=totals[layer],focusRegion=(region:Region)=>{setActiveRegion(region.id);setFocus({...region,nonce:Date.now()})},activeRegionLabel=activeRegion==='custom'?'Free orbit':REGIONS.find(region=>region.id===activeRegion)?.label??'World';
  return <main className={styles.root}>
    <div className={styles.globeStage}><CesiumNetworkGlobe points={renderPoints} layer={layer} mode={mode} focus={focus} onExplore={()=>setActiveRegion('custom')}/><div className={styles.globeWash} aria-hidden="true"/></div>
    <header className={styles.topbar}><a className={styles.menuMark} href="/experience#provider-portals" aria-label="Return to provider portals"><span/><span/><span/></a><div className={styles.brand}><strong>OCCU-MED</strong><span>GLOBAL PROVIDER NETWORK</span></div><nav aria-label="Provider portals"><a href="/experience/history">History</a><a href="/experience/network" aria-current="page">Network</a><a href="/experience/resources">Resources</a><a href="/experience/questions">Q&amp;A</a><a href="/experience/agreement">Agreement</a></nav><div className={styles.liveState}><i data-mode={mode}/><span>{mode==='coordinates'?'LIVE COORDINATE FIELD':mode==='loading'?'LOADING NETWORK':'AGGREGATE FALLBACK'}</span></div></header>
    <aside className={styles.explorerRail}><nav className={styles.panelTabs} aria-label="Network explorer modes">{PANELS.map(([id,label,index])=><button key={id} type="button" aria-pressed={panel===id} onClick={()=>setPanel(id)}><small>{index}</small><span>{label}</span><i aria-hidden="true"/></button>)}</nav><div className={styles.panelBody}>
      {panel==='layers'&&<><div className={styles.panelIntro}><span>EXPLORE BY PROVIDER TYPE</span><h1>Provider network.</h1><p>Filter the live, anonymized point field. Illuminated country edges respond to the same mapped presence.</p></div><div className={styles.layerList}>{FILTERS.map(key=><button key={key} type="button" aria-pressed={layer===key} onClick={()=>setLayer(key)}><i style={{'--layer-color':NETWORK_COLORS[key]} as React.CSSProperties}/><span><b>{LAYER_LABELS[key]}</b><small>{LAYER_DETAIL[key]}</small></span><strong>{totals[key].toLocaleString()}</strong></button>)}</div></>}
      {panel==='regions'&&<><div className={styles.panelIntro}><span>EXPLORE BY GEOGRAPHY</span><h1>Enter the world.</h1><p>Cinematic camera flights move from global orbit toward terrain, cities, and real 3D buildings.</p></div><div className={styles.regionList}>{REGIONS.map((region,index)=><button key={region.id} type="button" data-active={activeRegion===region.id} onClick={()=>focusRegion(region)}><small>0{index+1}</small><span>{region.label}</span><i/></button>)}</div></>}
      {panel==='coverage'&&<><div className={styles.panelIntro}><span>LIVE FILTER COVERAGE</span><h1>{LAYER_LABELS[layer]}.</h1><p><b>{selectedCount.toLocaleString()}</b> mapped nodes currently drive both the visible point field and country-edge luminosity. Countries without matching nodes remain dark.</p></div><div className={styles.glowKey}><span>COUNTRY EDGE INTENSITY</span><i/><div><small>LOW PRESENCE</small><small>HIGH PRESENCE</small></div></div></>}
    </div><footer className={styles.railFooter}><span><b>{selectedCount.toLocaleString()}</b> {LAYER_LABELS[layer]}</span><span>{activeRegionLabel}</span></footer></aside>
    <div className={styles.mapMeta} aria-live="polite"><span>{activeRegionLabel}</span><span>{selectedCount.toLocaleString()} MAPPED NODES</span><span>CESIUM / TERRAIN + 3D</span></div><div className={styles.instructions}>DRAG TO ORBIT&nbsp;&nbsp;·&nbsp;&nbsp;SCROLL TO DIVE&nbsp;&nbsp;·&nbsp;&nbsp;CLICK A NODE TO ENTER</div>
  </main>;
}
