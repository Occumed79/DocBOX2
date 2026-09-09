'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import styles from './NetworkExperience.module.css';
import regionStyles from './NetworkRegions.module.css';

type Layer='all'|'medical'|'dental'|'diagnostic'|'pharmacy';
type Point={lat:number;lon:number;type:Layer;label?:string};
type AggregatePoint=Point&{count:number};
type Hover={x:number;y:number;title:string;detail:string}|null;
type Region={id:string;label:string;lon:number;lat:number;zoom:number};

const TOTALS:Record<Layer,number>={all:23524,medical:14207,dental:3141,diagnostic:2867,pharmacy:3309};
const LAYER_LABELS:Record<Layer,string>={all:'All facilities',medical:'Medical',dental:'Dental',diagnostic:'Diagnostics',pharmacy:'Pharmacy'};
const COLORS:Record<Layer,string>={all:'#82ebff',medical:'#7fe8ff',dental:'#b48bff',diagnostic:'#8ab5ff',pharmacy:'#e7be74'};
const REGIONS:readonly Region[]=[
  {id:'world',label:'World',lon:0,lat:12,zoom:1},
  {id:'americas',label:'Americas',lon:-88,lat:18,zoom:1.72},
  {id:'europe',label:'Europe',lon:15,lat:50,zoom:2.55},
  {id:'africa-me',label:'Africa + Middle East',lon:28,lat:13,zoom:2.05},
  {id:'asia-pacific',label:'Asia-Pacific',lon:112,lat:8,zoom:1.68},
];

const AGGREGATE_GEO:AggregatePoint[]=[
  {label:'California',lat:36.7,lon:-119.4,count:2512,type:'all'},{label:'Texas',lat:31,lon:-99.9,count:2065,type:'all'},{label:'Florida',lat:27.8,lon:-81.7,count:1211,type:'all'},{label:'New York',lat:43,lon:-75,count:936,type:'all'},{label:'Georgia',lat:32.7,lon:-83.3,count:808,type:'all'},{label:'Illinois',lat:40,lon:-89.2,count:802,type:'all'},{label:'North Carolina',lat:35.5,lon:-79.4,count:793,type:'all'},{label:'Pennsylvania',lat:41,lon:-77.7,count:760,type:'all'},{label:'South Africa',lat:-30.6,lon:22.9,count:160,type:'all'},{label:'India',lat:21.1,lon:78,count:63,type:'all'},{label:'Australia',lat:-25.3,lon:133.8,count:42,type:'all'},{label:'Canada',lat:56.1,lon:-106.3,count:32,type:'all'},{label:'Turkey',lat:39,lon:35.2,count:30,type:'all'},{label:'United Kingdom',lat:55,lon:-3.4,count:29,type:'all'},{label:'Jordan',lat:31.2,lon:36.5,count:22,type:'all'},{label:'Afghanistan',lat:33.9,lon:67.7,count:22,type:'all'},
];

const BREAKDOWNS=[
  {title:'Facility capacity',total:23524,rows:[['Medical provider',9420],['Pharmacy',3309],['Dental',3141],['Urgent care',2635],['Laboratory',1919],['Occupational medicine',1415],['Hospitals',590],['Diagnostics & specialists',1063]] as const},
  {title:'International reach',total:866,rows:[['South Africa',160],['India',63],['Australia',42],['Canada',32],['Turkey',30],['United Kingdom',29],['Jordan',22],['Afghanistan',22]] as const},
  {title:'Largest U.S. states',total:22678,rows:[['California',2512],['Texas',2065],['Florida',1211],['New York',936],['Georgia',808],['Illinois',802],['North Carolina',793],['Pennsylvania',760]] as const},
  {title:'Diagnostic capacity',total:2867,rows:[['Laboratory',1919],['Drug testing laboratory',294],['Imaging / radiology',278],['Cardiology',267],['Audiology / hearing',127]] as const},
];

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const ease=(t:number)=>1-Math.pow(1-clamp(t,0,1),3);

function classify(value:unknown):Layer{const text=String(value??'').toLowerCase();if(text.includes('dental'))return'dental';if(text.includes('pharm')||text.includes('vaccin'))return'pharmacy';if(text.includes('lab')||text.includes('diagn')||text.includes('imag')||text.includes('radio')||text.includes('cardio')||text.includes('audio'))return'diagnostic';return'medical'}
function normalizeDataset(payload:unknown):Point[]{const rows=Array.isArray(payload)?payload:(payload&&typeof payload==='object'&&Array.isArray((payload as{points?:unknown[]}).points)?(payload as{points:unknown[]}).points:[]);const points:Point[]=[];for(const row of rows){if(Array.isArray(row)){const lon=Number(row[0]),lat=Number(row[1]);if(Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180)points.push({lon,lat,type:classify(row[2])});continue}if(!row||typeof row!=='object')continue;const record=row as Record<string,unknown>,lat=Number(record.lat??record.latitude??record.y),lon=Number(record.lon??record.lng??record.longitude??record.x);if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)continue;points.push({lat,lon,type:classify(record.type??record.category??record.provider_type),label:typeof record.label==='string'?record.label:undefined})}return points}
function project(lon:number,lat:number,width:number,height:number,zoom:number,panX:number,panY:number){const baseX=((lon+180)/360)*width,baseY=((90-lat)/180)*height;return{x:(baseX-width/2)*zoom+width/2+panX,y:(baseY-height/2)*zoom+height/2+panY}}

export default function NetworkExperience(){
  const canvasRef=useRef<HTMLCanvasElement|null>(null),wrapRef=useRef<HTMLDivElement|null>(null),viewAnimationRef=useRef(0);
  const[layer,setLayer]=useState<Layer>('all');const[points,setPoints]=useState<Point[]>([]);const[mode,setMode]=useState<'coordinates'|'aggregate'|'loading'>('loading');const[zoom,setZoom]=useState(1);const[pan,setPan]=useState({x:0,y:0});const[dragging,setDragging]=useState(false);const[hover,setHover]=useState<Hover>(null);const[activeRegion,setActiveRegion]=useState('world');
  const dragRef=useRef<{x:number;y:number;panX:number;panY:number}|null>(null);const projectedRef=useRef<Array<{x:number;y:number;point:Point;radius:number;count?:number}>>([]);

  useEffect(()=>{let cancelled=false;fetch('/data/provider-network-points.json',{cache:'force-cache'}).then(response=>{if(!response.ok)throw new Error('coordinate dataset unavailable');return response.json()}).then(payload=>{if(cancelled)return;const normalized=normalizeDataset(payload);if(!normalized.length)throw new Error('coordinate dataset empty');setPoints(normalized);setMode('coordinates')}).catch(()=>{if(!cancelled)setMode('aggregate')});return()=>{cancelled=true}},[]);
  useEffect(()=>()=>{if(viewAnimationRef.current)cancelAnimationFrame(viewAnimationRef.current)},[]);

  const filteredPoints=useMemo(()=>mode!=='coordinates'?[]:layer==='all'?points:points.filter(point=>point.type===layer),[layer,mode,points]);
  const draw=useCallback(()=>{const canvas=canvasRef.current,wrap=wrapRef.current;if(!canvas||!wrap)return;const rect=wrap.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),width=Math.max(1,Math.floor(rect.width)),height=Math.max(1,Math.floor(rect.height));canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;const gl=canvas.getContext('webgl',{antialias:true,alpha:true});if(!gl)return;gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.01,.055,.075,1);gl.clear(gl.COLOR_BUFFER_BIT);const compile=(type:number,source:string)=>{const sh=gl.createShader(type)!;gl.shaderSource(sh,source);gl.compileShader(sh);return sh};const program=gl.createProgram()!;gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 p;attribute vec3 c;varying vec3 v;uniform float size;void main(){v=c;gl_Position=vec4(p,0.,1.);gl_PointSize=size;}'));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 v;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(v,(1.-d*2.)*.82);}'));gl.linkProgram(program);gl.useProgram(program);const source:Array<Point&{count?:number}>=mode==='coordinates'?filteredPoints:AGGREGATE_GEO;const verts:number[]=[],colors:number[]=[];const projected:Array<{x:number;y:number;point:Point;radius:number;count?:number}>=[];const rgb=(type:Layer)=>{const n=parseInt((COLORS[type]||COLORS.all).slice(1),16);return[((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255]};for(const point of source){const q=project(point.lon,point.lat,width,height,zoom,pan.x,pan.y);if(q.x<-20||q.y<-20||q.x>width+20||q.y>height+20)continue;verts.push(q.x/width*2-1,1-q.y/height*2);colors.push(...rgb(point.type));projected.push({...q,point,radius:mode==='coordinates'?7:18,count:point.count})}const bind=(name:string,data:number[],size:number)=>{const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STREAM_DRAW);const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0)};bind('p',verts,2);bind('c',colors,3);gl.uniform1f(gl.getUniformLocation(program,'size'),Math.min(14,(mode==='coordinates'?2.2:9)*dpr*Math.sqrt(zoom)));gl.drawArrays(gl.POINTS,0,verts.length/2);projectedRef.current=projected},[filteredPoints,mode,pan.x,pan.y,zoom]);
  useEffect(()=>{draw();const wrap=wrapRef.current;if(!wrap||!window.ResizeObserver)return;const observer=new ResizeObserver(draw);observer.observe(wrap);return()=>observer.disconnect()},[draw]);

  const emitView=(nextZoom:number,nextX:number,nextY:number)=>window.dispatchEvent(new CustomEvent('docbox:network-view',{detail:{zoom:nextZoom,panX:nextX,panY:nextY}}));
  const focusRegion=(region:Region)=>{const wrap=wrapRef.current;if(!wrap)return;if(viewAnimationRef.current)cancelAnimationFrame(viewAnimationRef.current);const rect=wrap.getBoundingClientRect(),width=rect.width,height=rect.height,baseX=((region.lon+180)/360)*width,baseY=((90-region.lat)/180)*height,targetX=-(baseX-width/2)*region.zoom,targetY=-(baseY-height/2)*region.zoom,startZoom=zoom,startX=pan.x,startY=pan.y,start=performance.now();setActiveRegion(region.id);setHover(null);const animate=(now:number)=>{const t=ease((now-start)/620),nextZoom=startZoom+(region.zoom-startZoom)*t,nextX=startX+(targetX-startX)*t,nextY=startY+(targetY-startY)*t;setZoom(nextZoom);setPan({x:nextX,y:nextY});emitView(nextZoom,nextX,nextY);if(t<1)viewAnimationRef.current=requestAnimationFrame(animate);else viewAnimationRef.current=0};viewAnimationRef.current=requestAnimationFrame(animate)};
  const onPointerDown=(event:PointerEvent<HTMLDivElement>)=>{event.currentTarget.setPointerCapture(event.pointerId);if(viewAnimationRef.current)cancelAnimationFrame(viewAnimationRef.current);viewAnimationRef.current=0;dragRef.current={x:event.clientX,y:event.clientY,panX:pan.x,panY:pan.y};setActiveRegion('custom');setDragging(true)};
  const onPointerMove=(event:PointerEvent<HTMLDivElement>)=>{const wrap=wrapRef.current;if(!wrap)return;if(dragRef.current){setPan({x:dragRef.current.panX+event.clientX-dragRef.current.x,y:dragRef.current.panY+event.clientY-dragRef.current.y});setHover(null);return}const rect=wrap.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;let nearest:(typeof projectedRef.current)[number]|undefined,nearestDistance=Number.POSITIVE_INFINITY;for(const candidate of projectedRef.current){const distance=Math.hypot(candidate.x-x,candidate.y-y);if(distance<candidate.radius&&distance<nearestDistance){nearest=candidate;nearestDistance=distance}}if(!nearest){setHover(null);return}const title=nearest.point.label||LAYER_LABELS[nearest.point.type],detail=nearest.count?`${nearest.count.toLocaleString()} aggregate directory records`:`${nearest.point.type} · ${nearest.point.lat.toFixed(1)}°, ${nearest.point.lon.toFixed(1)}°`;setHover({x,y,title,detail})};
  const endDrag=()=>{dragRef.current=null;setDragging(false)};
  const onWheel=(event:WheelEvent<HTMLDivElement>)=>{event.preventDefault();setActiveRegion('custom');setZoom(clamp(zoom*(event.deltaY>0?.9:1.1),.8,5))};
  const reset=()=>focusRegion(REGIONS[0]);

  return <main className={styles.root}>
    <header className={styles.topbar}><a href="/experience#provider-portals">OCCU-MED / NETWORK ATLAS</a><nav aria-label="Provider portals"><a href="/experience/history">History</a><a href="/experience/network" aria-current="page">Network</a><a href="/experience/resources">Resources</a><a href="/experience/questions">Q&A</a><a href="/experience/agreement">Agreement</a></nav></header>
    <section className={styles.hero}>
      <div className={styles.copy}><span>PORTAL 02 / PROVIDER NETWORK</span><h1>Follow the<br/>network.</h1><p>Explore Occu-Med’s anonymized provider infrastructure as a geographic system. Drag the field, zoom through regions, switch clinical layers, and inspect the underlying capacity without exposing provider identities.</p><div className={styles.mode} data-mode={mode}><i/>{mode==='coordinates'?`${points.length.toLocaleString()} coordinate records loaded`:mode==='loading'?'Loading coordinate layer…':'Aggregate geography active · coordinate file awaiting recovery'}</div><div className={styles.stats}><div className={styles.stat}><b>23,524</b><small>mapped anonymized coordinates</small></div><div className={styles.stat}><b>22,678</b><small>U.S. & territories</small></div><div className={styles.stat}><b>866</b><small>international records</small></div></div></div>
      <div className={styles.mapShell}>
        <div className={styles.mapToolbar}>
          <div className={styles.layers} aria-label="Network layers">{(Object.keys(LAYER_LABELS) as Layer[]).map(key=><button key={key} type="button" aria-pressed={layer===key} onClick={()=>setLayer(key)}>{LAYER_LABELS[key]} · {TOTALS[key].toLocaleString()}</button>)}</div>
          <div className={regionStyles.regions}><span className={regionStyles.label}>GEOGRAPHIC VIEW</span><div className={regionStyles.grid}>{REGIONS.map(region=><button key={region.id} type="button" data-active={activeRegion===region.id} onClick={()=>focusRegion(region)}>{region.label}</button>)}</div></div>
          <button className={styles.reset} type="button" onClick={reset}>Reset view</button>
        </div>
        <div ref={wrapRef} className={styles.canvasWrap} data-dragging={dragging} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onPointerLeave={()=>{if(!dragging)setHover(null)}} onWheel={onWheel}>
          <canvas ref={canvasRef} className={styles.canvas} aria-label="Interactive anonymized provider network map"/><div className={styles.instructions}>Drag to pan · wheel or trackpad to zoom · choose a layer or geographic view. Provider names and contact details are never rendered.</div>{hover&&<div className={styles.tooltip} style={{left:hover.x,top:hover.y}}><b>{hover.title}</b><small>{hover.detail}</small></div>}
        </div>
        <div className={styles.mapFooter} aria-live="polite"><span><strong>{LAYER_LABELS[layer]}</strong> selected · {TOTALS[layer].toLocaleString()} directory records</span><span>{activeRegion==='custom'?'Custom view':REGIONS.find(region=>region.id===activeRegion)?.label} · Zoom {zoom.toFixed(1)}×</span></div>
      </div>
    </section>
    <section className={styles.explorer}><div className={styles.explorerHead}><div><span className={styles.panelLabel}>NETWORK INTELLIGENCE / ACCESSIBLE DETAIL</span><h2>The map has a second language.</h2></div><p>The geographic view is paired with equivalent aggregate results so the network remains understandable without relying on pointer interaction or color alone.</p></div><div className={styles.breakdown}>{BREAKDOWNS.map(group=>{const max=Math.max(...group.rows.map(([,count])=>count));return <article key={group.title}><header><h3>{group.title}</h3><b>{group.total.toLocaleString()}</b></header>{group.rows.map(([name,count])=><div className={styles.bar} key={name}><span>{name}</span><i style={{transform:`scaleX(${count/max})`}}/><b>{count.toLocaleString()}</b></div>)}</article>})}</div></section>
  </main>;
}
