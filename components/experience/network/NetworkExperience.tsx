'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './NetworkExperience.module.css';
import CesiumNetworkGlobe from './CesiumNetworkGlobe';

type Layer='all'|'medical'|'dental'|'diagnostic'|'pharmacy';
type Panel='layers'|'regions'|'coverage'|'diagnostics';
type Point={lon:number;lat:number;type:Layer;label?:string;count?:number};
type Region={id:string;label:string;lon:number;lat:number;height:number};
type Focus=Region&{nonce:number};

const TOTALS:Record<Layer,number>={all:23524,medical:14207,dental:3141,diagnostic:2867,pharmacy:3309};
const LAYER_LABELS:Record<Layer,string>={all:'All facilities',medical:'Medical',dental:'Dental',diagnostic:'Diagnostics',pharmacy:'Pharmacy'};
const LAYER_DETAIL:Record<Layer,string>={all:'Every mapped provider node',medical:'Exam-capable medical providers',dental:'Dental evaluation capacity',diagnostic:'Labs, imaging, cardiology & audiology',pharmacy:'Pharmacy & vaccination capacity'};
const REGIONS:readonly Region[]=[
  {id:'world',label:'World',lon:-18,lat:18,height:18500000},
  {id:'americas',label:'Americas',lon:-91,lat:22,height:8500000},
  {id:'europe',label:'Europe',lon:15,lat:50,height:4200000},
  {id:'africa-me',label:'Africa + Middle East',lon:31,lat:18,height:6500000},
  {id:'asia-pacific',label:'Asia-Pacific',lon:113,lat:10,height:9000000},
];
const PANELS:[Panel,string,string][]=[['layers','Clinical layers','01'],['regions','Geography','02'],['coverage','Coverage','03'],['diagnostics','Diagnostics','04']];
const AGGREGATE_GEO:Point[]=[
  {label:'California',lat:36.7,lon:-119.4,count:2512,type:'all'},{label:'Texas',lat:31,lon:-99.9,count:2065,type:'all'},{label:'Florida',lat:27.8,lon:-81.7,count:1211,type:'all'},{label:'New York',lat:43,lon:-75,count:936,type:'all'},{label:'Georgia',lat:32.7,lon:-83.3,count:808,type:'all'},{label:'Illinois',lat:40,lon:-89.2,count:802,type:'all'},{label:'North Carolina',lat:35.5,lon:-79.4,count:793,type:'all'},{label:'Pennsylvania',lat:41,lon:-77.7,count:760,type:'all'},{label:'South Africa',lat:-30.6,lon:22.9,count:160,type:'all'},{label:'India',lat:21.1,lon:78,count:63,type:'all'},{label:'Australia',lat:-25.3,lon:133.8,count:42,type:'all'},{label:'Canada',lat:56.1,lon:-106.3,count:32,type:'all'},{label:'Turkey',lat:39,lon:35.2,count:30,type:'all'},{label:'United Kingdom',lat:55,lon:-3.4,count:29,type:'all'},{label:'Jordan',lat:31.2,lon:36.5,count:22,type:'all'},{label:'Afghanistan',lat:33.9,lon:67.7,count:22,type:'all'},
];
const COVERAGE=[['Mapped coordinates',23524],['California',2512],['Texas',2065],['Florida',1211],['New York',936],['Georgia',808],['Illinois',802],['North Carolina',793],['Pennsylvania',760]] as const;
const DIAGNOSTIC_CAPABILITIES=['Laboratory','Drug testing','Imaging / radiology','Cardiology','Audiology / hearing'] as const;

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

function MiniBars({rows,total}:{rows:readonly (readonly [string,number])[];total:number}){
  const max=Math.max(...rows.map(([,count])=>count));
  return <div className={styles.miniBars}>{rows.map(([name,count])=><div className={styles.miniBar} key={name}><div><span>{name}</span><b>{count.toLocaleString()}</b></div><i><em style={{transform:`scaleX(${Math.max(.02,count/max)})`}}/></i><small>{Math.round(count/total*100)}%</small></div>)}</div>;
}

export default function NetworkExperience(){
  const[layer,setLayer]=useState<Layer>('all');
  const[panel,setPanel]=useState<Panel>('layers');
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
  const activeRegionLabel=activeRegion==='custom'?'Free orbit':REGIONS.find(region=>region.id===activeRegion)?.label??'World';

  return <main className={styles.root}>
    <div className={styles.globeStage}><CesiumNetworkGlobe points={renderPoints} layer={layer} mode={mode} focus={focus} onExplore={()=>setActiveRegion('custom')}/><div className={styles.globeWash} aria-hidden="true"/></div>

    <header className={styles.topbar}>
      <a className={styles.menuMark} href="/experience#provider-portals" aria-label="Return to provider portals"><span/><span/><span/></a>
      <div className={styles.brand}><strong>OCCU-MED</strong><span>GLOBAL PROVIDER NETWORK</span></div>
      <nav aria-label="Provider portals"><a href="/experience/history">History</a><a href="/experience/network" aria-current="page">Network</a><a href="/experience/resources">Resources</a><a href="/experience/questions">Q&A</a><a href="/experience/agreement">Agreement</a></nav>
      <div className={styles.liveState}><i data-mode={mode}/><span>{mode==='coordinates'?'LIVE COORDINATE FIELD':mode==='loading'?'LOADING NETWORK':'AGGREGATE FALLBACK'}</span></div>
    </header>

    <aside className={styles.explorerRail}>
      <nav className={styles.panelTabs} aria-label="Network explorer modes">{PANELS.map(([id,label,index])=><button key={id} type="button" aria-pressed={panel===id} onClick={()=>setPanel(id)}><small>{index}</small><span>{label}</span><i aria-hidden="true"/></button>)}</nav>
      <div className={styles.panelBody}>
        {panel==='layers'&&<><div className={styles.panelIntro}><span>EXPLORE BY FACILITY TYPE</span><h1>Provider network.</h1><p>Switch the live globe between clinical capacities. Every node is anonymized; the spatial pattern stays real.</p></div><div className={styles.layerList}>{(Object.keys(LAYER_LABELS) as Layer[]).map(key=><button key={key} type="button" aria-pressed={layer===key} onClick={()=>setLayer(key)}><i data-layer={key}/><span><b>{LAYER_LABELS[key]}</b><small>{LAYER_DETAIL[key]}</small></span><strong>{TOTALS[key].toLocaleString()}</strong></button>)}</div></>}
        {panel==='regions'&&<><div className={styles.panelIntro}><span>EXPLORE BY GEOGRAPHY</span><h1>Move through the field.</h1><p>Use authored camera flights to move from the full globe into the regions where coverage is concentrated.</p></div><div className={styles.regionList}>{REGIONS.map((region,index)=><button key={region.id} type="button" data-active={activeRegion===region.id} onClick={()=>focusRegion(region)}><small>0{index+1}</small><span>{region.label}</span><i/></button>)}</div></>}
        {panel==='coverage'&&<><div className={styles.panelIntro}><span>NETWORK COVERAGE</span><h1>Where the density lives.</h1><p>The coverage panel reports the same valid mapped coordinate field shown on the globe; records without usable coordinates are excluded.</p></div><MiniBars rows={COVERAGE} total={23524}/></>}
        {panel==='diagnostics'&&<><div className={styles.panelIntro}><span>DIAGNOSTIC CAPACITY</span><h1>See the support layer.</h1><p><b>{TOTALS.diagnostic.toLocaleString()}</b> mapped diagnostic nodes support the capabilities below. Exact subcategory totals are not inferred from the coordinate-only atlas.</p></div><div className={styles.capabilityList}>{DIAGNOSTIC_CAPABILITIES.map((name,index)=><div key={name}><small>0{index+1}</small><span>{name}</span></div>)}</div><button className={styles.applyDiagnostic} type="button" onClick={()=>{setLayer('diagnostic');setPanel('layers')}}>Show diagnostic nodes on globe <span>→</span></button></>}
      </div>
      <footer className={styles.railFooter}><span><b>{selectedCount.toLocaleString()}</b> {LAYER_LABELS[layer]}</span><span>{activeRegionLabel}</span></footer>
    </aside>

    <div className={styles.mapLegend} aria-label="Map layer legend"><span>NETWORK LAYERS</span>{(['medical','dental','diagnostic','pharmacy'] as Layer[]).map(key=><button key={key} type="button" aria-pressed={layer===key||layer==='all'} onClick={()=>setLayer(layer===key?'all':key)}><i data-layer={key}/><span>{LAYER_LABELS[key]}</span></button>)}</div>
    <div className={styles.mapMeta} aria-live="polite"><span>{activeRegionLabel}</span><span>{selectedCount.toLocaleString()} MAPPED NODES</span><span>CESIUM / ION TERRAIN + 3D</span></div>
    <div className={styles.instructions}>DRAG TO ORBIT&nbsp;&nbsp;·&nbsp;&nbsp;SCROLL TO DIVE&nbsp;&nbsp;·&nbsp;&nbsp;CLICK A NODE TO LOCK</div>
  </main>;
}
