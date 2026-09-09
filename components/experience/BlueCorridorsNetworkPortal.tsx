'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import styles from './BlueCorridorsNetworkPortal.module.css';

type Facet = { name: string; count: number };
type NetworkPoint = { id: string; type: string; country: string; state: string; city: string; lat: number; lon: number; services: string };
type Payload = { total: number; coordinateCount: number; points: NetworkPoint[]; categories: Facet[]; countries: Facet[]; states: Facet[] };
type Mode = 'Provider Types' | 'Services' | 'Geography' | 'Coverage';

const FALLBACK: Payload = {
  total: 23544,
  coordinateCount: 0,
  points: [],
  categories: [
    { name:'Medical provider',count:9420 },{ name:'Pharmacy',count:3309 },{ name:'Dental',count:3143 },{ name:'Urgent care',count:2635 },{ name:'Laboratory',count:1919 },{ name:'Occupational medicine',count:1415 },{ name:'Diagnostics & specialists',count:1063 },{ name:'Hospitals',count:590 },
  ],
  countries:[{name:'United States',count:22678},{name:'South Africa',count:160},{name:'India',count:63},{name:'Australia',count:42},{name:'Canada',count:32},{name:'Turkey',count:30},{name:'United Kingdom',count:29},{name:'Jordan',count:22}],
  states:[{name:'California',count:2512},{name:'Texas',count:2065},{name:'Florida',count:1211},{name:'New York',count:936},{name:'Georgia',count:808},{name:'Illinois',count:802},{name:'North Carolina',count:793},{name:'Pennsylvania',count:760}],
};

const MODES: Mode[] = ['Provider Types','Services','Geography','Coverage'];

function splitServices(points: NetworkPoint[]): Facet[] {
  const counts = new Map<string,number>();
  points.forEach(point => point.services.split(/[;,|/]+/).map(x=>x.trim()).filter(Boolean).forEach(service => counts.set(service,(counts.get(service)||0)+1)));
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,28).map(([name,count])=>({name,count}));
}

function WorldSilhouette(){
  return <svg className={styles.world} viewBox="0 0 1000 500" aria-hidden="true">
    <path d="M64 128 118 92l83 4 35 32 54 8 26 29-27 28-8 38-52 20-29 55-43 4-20-46-41-29-50-56Z"/>
    <path d="M258 276l46 18 35 52-7 50-30 60-28-11-9-62-27-50Z"/>
    <path d="M445 112l55-25 81 11 31 29 46-5 55 28 75-3 67 38-11 33-72 7-40 25-54-13-44 28-40-31-46 9-45-25-52 7-37-35 16-35Z"/>
    <path d="M512 257l62 8 48 42-4 58-31 73-46-10-22-52-38-38 11-50Z"/>
    <path d="m813 333 56-18 46 20 10 34-42 20-54-8Z"/>
    <path d="m890 101 27-13 22 14-6 25-31 7Z"/>
  </svg>;
}

export default function BlueCorridorsNetworkPortal(){
  const [data,setData]=useState<Payload>(FALLBACK);
  const [mode,setMode]=useState<Mode>('Provider Types');
  const [selected,setSelected]=useState<string[]>([]);
  const [selectedPoint,setSelectedPoint]=useState<NetworkPoint|null>(null);
  const [layers,setLayers]=useState({points:true,coverage:true,routes:true});
  const [zoom,setZoom]=useState(1);
  const [pan,setPan]=useState({x:0,y:0});
  const dragRef=useRef<{x:number;y:number;panX:number;panY:number}|null>(null);

  useEffect(()=>{
    fetch('/api/provider-network').then(r=>r.ok?r.json():Promise.reject()).then((payload:Payload)=>setData(payload)).catch(()=>setData(FALLBACK));
  },[]);

  const serviceFacets=useMemo(()=>splitServices(data.points),[data.points]);
  const facets=useMemo(()=>mode==='Provider Types'?data.categories:mode==='Services'?serviceFacets:mode==='Geography'?data.countries:data.states,[mode,data,serviceFacets]);

  const visiblePoints=useMemo(()=>{
    if(!selected.length) return data.points;
    const match=(p:NetworkPoint)=>{
      if(mode==='Provider Types') return selected.includes(p.type);
      if(mode==='Geography') return selected.includes(p.country);
      if(mode==='Coverage') return selected.includes(p.state);
      const services=p.services.toLowerCase(); return selected.some(item=>services.includes(item.toLowerCase()));
    };
    return data.points.filter(match);
  },[data.points,selected,mode]);

  const toggleFacet=(name:string)=>setSelected(current=>current.includes(name)?current.filter(x=>x!==name):[...current,name]);
  const switchMode=(next:Mode)=>{setMode(next);setSelected([]);setSelectedPoint(null)};
  const reset=()=>{setSelected([]);setSelectedPoint(null);setZoom(1);setPan({x:0,y:0});setLayers({points:true,coverage:true,routes:true})};

  const pointerDown=(event:PointerEvent<HTMLDivElement>)=>{event.currentTarget.setPointerCapture(event.pointerId);dragRef.current={x:event.clientX,y:event.clientY,panX:pan.x,panY:pan.y}};
  const pointerMove=(event:PointerEvent<HTMLDivElement>)=>{const d=dragRef.current;if(!d)return;setPan({x:d.panX+(event.clientX-d.x),y:d.panY+(event.clientY-d.y)})};
  const pointerUp=(event:PointerEvent<HTMLDivElement>)=>{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);dragRef.current=null};
  const onWheel=(event:WheelEvent<HTMLDivElement>)=>{event.preventDefault();setZoom(z=>Math.max(1,Math.min(4,z*(event.deltaY<0?1.12:.89))))};

  return <main className={styles.root}>
    <nav className={styles.topNav} aria-label="Provider portals"><a href="/experience#provider-world">OCCU-MED / PORTALS</a><div><a href="/experience/history">History</a><a data-active href="/experience/network">Network</a><a href="/experience/resources">Resources</a><a href="/experience/questions">Q&A</a><a href="/experience/agreement">Agreement</a></div><a href="/experience#provider-world">Return to hub ↗</a></nav>

    <section className={styles.explorer}>
      <aside className={styles.objectDrawer}>
        <header><span>OCCU-MED NETWORK</span><h1>Explore</h1><p>{data.total.toLocaleString()} anonymized active directory records</p></header>
        <div className={styles.modeTabs}>{MODES.map(item=><button key={item} type="button" data-active={mode===item||undefined} onClick={()=>switchMode(item)}>{item}</button>)}</div>
        <div className={styles.objectList}>
          {facets.length?facets.map((facet,index)=><article key={facet.name} data-active={selected.includes(facet.name)||undefined}>
            <button className={styles.objectToggle} type="button" onClick={()=>toggleFacet(facet.name)}><i>{selected.includes(facet.name)?'✓':''}</i><span><strong>{facet.name}</strong><small>{facet.count.toLocaleString()} locations</small></span><b>{String(index+1).padStart(2,'0')}</b></button>
            <div className={styles.objectLayers}><label><input type="checkbox" checked={selected.includes(facet.name)} onChange={()=>toggleFacet(facet.name)}/>Show on map</label><button type="button" onClick={()=>{setSelected([facet.name]);setSelectedPoint(null)}}>Info</button></div>
          </article>):<p className={styles.empty}>This directory does not expose a normalized field for this mode yet.</p>}
        </div>
      </aside>

      <div className={styles.mapShell}>
        <header className={styles.mapHeader}><div><span>{mode.toUpperCase()}</span><strong>{selected.length?`${selected.length} ACTIVE FILTER${selected.length===1?'':'S'}`:'ALL LOCATIONS'}</strong></div><div><button type="button" onClick={()=>setZoom(z=>Math.max(1,z/1.25))}>−</button><b>{zoom.toFixed(1)}×</b><button type="button" onClick={()=>setZoom(z=>Math.min(4,z*1.25))}>+</button><button type="button" onClick={reset}>Reset map</button></div></header>

        <div className={styles.mapViewport} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={onWheel}>
          <div className={styles.mapTransform} style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}}>
            <div className={styles.oceanGrid}/><WorldSilhouette/>
            {layers.coverage&&<div className={styles.coverageField} aria-hidden="true"/>}
            {layers.routes&&<div className={styles.routes} aria-hidden="true">{Array.from({length:22},(_,i)=><i key={i} style={{left:`${8+(i*31)%82}%`,top:`${12+(i*47)%72}%`,width:`${90+(i%6)*35}px`,transform:`rotate(${-42+(i%10)*9}deg)`}}/>)}</div>}
            {layers.points&&<div className={styles.points}>{visiblePoints.map((point,index)=>{
              const left=((point.lon+180)/360)*100;const top=((90-point.lat)/180)*100;
              return <button key={`${point.id}-${index}`} type="button" style={{left:`${left}%`,top:`${top}%`}} data-active={selectedPoint===point||undefined} onPointerDown={e=>e.stopPropagation()} onClick={()=>setSelectedPoint(point)} aria-label={`${point.type} network location`}><i/></button>
            })}</div>}
          </div>
          {!data.points.length&&<div className={styles.noCoordinates}><strong>Directory loaded</strong><p>The workbook was read successfully, but no latitude/longitude columns were detected. Aggregate exploration remains available.</p></div>}
        </div>

        <div className={styles.layerBar}><span>Layers</span><label><input type="checkbox" checked={layers.points} onChange={()=>setLayers(x=>({...x,points:!x.points}))}/>Provider points</label><label><input type="checkbox" checked={layers.coverage} onChange={()=>setLayers(x=>({...x,coverage:!x.coverage}))}/>Coverage field</label><label><input type="checkbox" checked={layers.routes} onChange={()=>setLayers(x=>({...x,routes:!x.routes}))}/>Network routes</label><b>{visiblePoints.length.toLocaleString()} mapped sample points</b></div>
      </div>

      <aside className={styles.profileDrawer}>
        {selectedPoint?<><button className={styles.close} type="button" onClick={()=>setSelectedPoint(null)}>×</button><span>NETWORK LOCATION</span><h2>{selectedPoint.type||'Provider location'}</h2><dl><div><dt>Country</dt><dd>{selectedPoint.country||'—'}</dd></div><div><dt>State / Province</dt><dd>{selectedPoint.state||'—'}</dd></div><div><dt>City</dt><dd>{selectedPoint.city||'—'}</dd></div><div><dt>Services</dt><dd>{selectedPoint.services||'Directory record'}</dd></div></dl><p>This public explorer uses anonymized directory data. Provider identity and operational relationship details remain outside this view.</p></>:<><span>VISIBLE NETWORK</span><strong>{(selected.length?visiblePoints.length:data.coordinateCount||data.total).toLocaleString()}</strong><h2>{selected.length?selected.join(', '):'All provider infrastructure'}</h2><p>Select a point on the map for its anonymized profile, or choose one or more objects in the left drawer to filter the network.</p><div className={styles.summaryBars}>{facets.slice(0,8).map(f=><div key={f.name}><span>{f.name}</span><b>{f.count.toLocaleString()}</b></div>)}</div></>}
      </aside>
    </section>
  </main>;
}
