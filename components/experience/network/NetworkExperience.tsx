'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type WheelEvent } from 'react';
import styles from './NetworkExperience.module.css';

type Layer = 'all' | 'medical' | 'dental' | 'diagnostic' | 'pharmacy';
type Point = { lat: number; lon: number; type: Layer; label?: string };
type AggregatePoint = Point & { count: number };
type Hover = { x: number; y: number; title: string; detail: string } | null;

const TOTALS: Record<Layer, number> = {
  all: 23524,
  medical: 14207,
  dental: 3141,
  diagnostic: 2867,
  pharmacy: 3309,
};

const LAYER_LABELS: Record<Layer, string> = {
  all: 'All facilities',
  medical: 'Medical',
  dental: 'Dental',
  diagnostic: 'Diagnostics',
  pharmacy: 'Pharmacy',
};

const COLORS: Record<Layer, string> = {
  all: '#82ebff',
  medical: '#7fe8ff',
  dental: '#b48bff',
  diagnostic: '#8ab5ff',
  pharmacy: '#e7be74',
};

const AGGREGATE_GEO: AggregatePoint[] = [
  { label: 'California', lat: 36.7, lon: -119.4, count: 2512, type: 'all' },
  { label: 'Texas', lat: 31.0, lon: -99.9, count: 2065, type: 'all' },
  { label: 'Florida', lat: 27.8, lon: -81.7, count: 1211, type: 'all' },
  { label: 'New York', lat: 43.0, lon: -75.0, count: 936, type: 'all' },
  { label: 'Georgia', lat: 32.7, lon: -83.3, count: 808, type: 'all' },
  { label: 'Illinois', lat: 40.0, lon: -89.2, count: 802, type: 'all' },
  { label: 'North Carolina', lat: 35.5, lon: -79.4, count: 793, type: 'all' },
  { label: 'Pennsylvania', lat: 41.0, lon: -77.7, count: 760, type: 'all' },
  { label: 'South Africa', lat: -30.6, lon: 22.9, count: 160, type: 'all' },
  { label: 'India', lat: 21.1, lon: 78.0, count: 63, type: 'all' },
  { label: 'Australia', lat: -25.3, lon: 133.8, count: 42, type: 'all' },
  { label: 'Canada', lat: 56.1, lon: -106.3, count: 32, type: 'all' },
  { label: 'Turkey', lat: 39.0, lon: 35.2, count: 30, type: 'all' },
  { label: 'United Kingdom', lat: 55.0, lon: -3.4, count: 29, type: 'all' },
  { label: 'Jordan', lat: 31.2, lon: 36.5, count: 22, type: 'all' },
  { label: 'Afghanistan', lat: 33.9, lon: 67.7, count: 22, type: 'all' },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function classify(value: unknown): Layer {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('dental')) return 'dental';
  if (text.includes('pharm') || text.includes('vaccin')) return 'pharmacy';
  if (text.includes('lab') || text.includes('diagn') || text.includes('imag') || text.includes('radio') || text.includes('cardio') || text.includes('audio')) return 'diagnostic';
  return 'medical';
}

function normalizeDataset(payload: unknown): Point[] {
  const rows = Array.isArray(payload) ? payload : (payload && typeof payload === 'object' && Array.isArray((payload as { points?: unknown[] }).points) ? (payload as { points: unknown[] }).points : []);
  const points: Point[] = [];

  for (const row of rows) {
    if (Array.isArray(row)) {
      const lon = Number(row[0]);
      const lat = Number(row[1]);
      if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        points.push({ lon, lat, type: classify(row[2]) });
      }
      continue;
    }
    if (!row || typeof row !== 'object') continue;
    const record = row as Record<string, unknown>;
    const lat = Number(record.lat ?? record.latitude ?? record.y);
    const lon = Number(record.lon ?? record.lng ?? record.longitude ?? record.x);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    points.push({
      lat,
      lon,
      type: classify(record.type ?? record.category ?? record.provider_type),
      label: typeof record.label === 'string' ? record.label : undefined,
    });
  }

  return points;
}

function project(lon: number, lat: number, width: number, height: number, zoom: number, panX: number, panY: number) {
  const baseX = ((lon + 180) / 360) * width;
  const baseY = ((90 - lat) / 180) * height;
  return {
    x: (baseX - width / 2) * zoom + width / 2 + panX,
    y: (baseY - height / 2) * zoom + height / 2 + panY,
  };
}

export default function NetworkExperience() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [layer, setLayer] = useState<Layer>('all');
  const [points, setPoints] = useState<Point[]>([]);
  const [mode, setMode] = useState<'coordinates' | 'aggregate' | 'loading'>('loading');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState<Hover>(null);
  const [selected, setSelected] = useState<Hover>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const projectedRef = useRef<Array<{ x: number; y: number; point: Point; radius: number; count?: number }>>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/provider-network-points.json', { cache: 'force-cache' })
      .then(response => {
        if (!response.ok) throw new Error('coordinate dataset unavailable');
        return response.json();
      })
      .then(payload => {
        if (cancelled) return;
        const normalized = normalizeDataset(payload);
        if (!normalized.length) throw new Error('coordinate dataset empty');
        setPoints(normalized);
        setMode('coordinates');
      })
      .catch(() => {
        if (cancelled) return;
        setMode('aggregate');
      });
    return () => { cancelled = true; };
  }, []);

  const filteredPoints = useMemo(() => {
    if (mode !== 'coordinates') return [];
    return layer === 'all' ? points : points.filter(point => point.type === layer);
  }, [layer, mode, points]);

  const draw = useCallback(() => {
    const canvas=canvasRef.current,wrap=wrapRef.current;if(!canvas||!wrap)return;
    const rect=wrap.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),width=Math.max(1,Math.floor(rect.width)),height=Math.max(1,Math.floor(rect.height));
    canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
    const gl=canvas.getContext('webgl',{antialias:true,alpha:true});if(!gl)return;gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.01,.055,.075,1);gl.clear(gl.COLOR_BUFFER_BIT);
    const compile=(type:number,source:string)=>{const sh=gl.createShader(type)!;gl.shaderSource(sh,source);gl.compileShader(sh);return sh};
    const program=gl.createProgram()!;gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 p;attribute vec3 c;varying vec3 v;uniform float size;void main(){v=c;gl_Position=vec4(p,0.,1.);gl_PointSize=size;}'));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 v;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(v,(1.-d*2.)*.82);}'));gl.linkProgram(program);gl.useProgram(program);
    const source: Array<Point & {count?:number}>=mode==='coordinates'?filteredPoints:AGGREGATE_GEO;
    const verts:number[]=[],colors:number[]=[];const projected:Array<{x:number;y:number;point:Point;radius:number;count?:number}>=[];
    const rgb=(type:Layer)=>{const n=parseInt((COLORS[type]||COLORS.all).slice(1),16);return[((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255]};
    for(const point of source){const q=project(point.lon,point.lat,width,height,zoom,pan.x,pan.y);if(q.x < -20||q.y < -20||q.x>width+20||q.y>height+20)continue;verts.push(q.x/width*2-1,1-q.y/height*2);colors.push(...rgb(point.type));projected.push({...q,point,radius:mode==='coordinates'?7:18,count:point.count})}
    const bind=(name:string,data:number[],size:number)=>{const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STREAM_DRAW);const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0)};bind('p',verts,2);bind('c',colors,3);gl.uniform1f(gl.getUniformLocation(program,'size'),Math.min(14,(mode==='coordinates'?2.2:9)*dpr*Math.sqrt(zoom)));gl.drawArrays(gl.POINTS,0,verts.length/2);projectedRef.current=projected;
  },[filteredPoints,mode,pan.x,pan.y,zoom]);

  useEffect(() => {
    draw();
    const wrap = wrapRef.current;
    if (!wrap || !window.ResizeObserver) return;
    const observer = new ResizeObserver(draw);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [draw]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (dragRef.current) {
      setPan({
        x: dragRef.current.panX + event.clientX - dragRef.current.x,
        y: dragRef.current.panY + event.clientY - dragRef.current.y,
      });
      setHover(null);
      return;
    }

    const rect = wrap.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let nearest: (typeof projectedRef.current)[number] | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const candidate of projectedRef.current) {
      const distance = Math.hypot(candidate.x - x, candidate.y - y);
      if (distance < candidate.radius && distance < nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }
    if (!nearest) {
      setHover(null);
      return;
    }
    const title = nearest.point.label || LAYER_LABELS[nearest.point.type];
    const detail = nearest.count
      ? `${nearest.count.toLocaleString()} aggregate directory records`
      : `${nearest.point.type} · ${nearest.point.lat.toFixed(1)}°, ${nearest.point.lon.toFixed(1)}°`;
    setHover({ x, y, title, detail });
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const next = clamp(zoom * (event.deltaY > 0 ? .9 : 1.1), .8, 5);
    setZoom(next);
  };

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setHover(null);
  };

  const travelTo = (point: AggregatePoint) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const { width, height } = wrap.getBoundingClientRect();
    const nextZoom = point.lon < -50 ? 2.6 : 2.1;
    const raw = project(point.lon, point.lat, width, height, nextZoom, 0, 0);
    setZoom(nextZoom);
    setPan({ x: width / 2 - raw.x, y: height / 2 - raw.y });
    setSelected({ x: width / 2, y: height / 2, title: point.label || 'Selected geography', detail: `${point.count.toLocaleString()} aggregate directory records` });
  };

  return (
    <main className={styles.root}>
      <header className={styles.topbar}>
        <a href="/experience#provider-portals">OCCU-MED / NETWORK ATLAS</a>
        <nav aria-label="Provider portals">
          <a href="/experience/history">History</a>
          <a href="/experience/network" aria-current="page">Network</a>
          <a href="/experience/resources">Resources</a>
          <a href="/experience/questions">Q&A</a>
          <a href="/experience/agreement">Agreement</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <aside className={styles.sidebar}>
          <span>PORTAL 02 / NETWORK</span><h1>Provider<br/>atlas.</h1><p>Explore 23,524 anonymized coordinates. Geography leads; controls remain secondary.</p>
          <div className={styles.sectionLabel}>CLINICAL LAYERS</div>
          <div className={styles.layers} aria-label="Network layers">{(Object.keys(LAYER_LABELS) as Layer[]).map((key,index)=><button key={key} type="button" aria-pressed={layer===key} onClick={()=>setLayer(key)}><i>{String(index+1).padStart(2,'0')}</i><span>{LAYER_LABELS[key]}</span><b>{TOTALS[key].toLocaleString()}</b></button>)}</div>
          <div className={styles.sectionLabel}>GEOGRAPHIC INDEX</div>
          <div className={styles.geographies}>{AGGREGATE_GEO.slice(0,8).map(point=><button key={point.label} onClick={()=>travelTo(point)}><span>{point.label}</span><b>{point.count.toLocaleString()}</b></button>)}</div>
          <div className={styles.mode} data-mode={mode}><i/>{mode==='coordinates'?`${points.length.toLocaleString()} coordinates live`:mode==='loading'?'Loading geographic layer…':'Aggregate layer active'}</div>
        </aside>
        <div className={styles.mapShell}>
          <div className={styles.mapToolbar}>
            <div><span>WORLD / DIRECTORY FIELD</span><b>{LAYER_LABELS[layer]}</b></div>
            <button className={styles.reset} type="button" onClick={reset}>Reset view</button>
          </div>

          <div
            ref={wrapRef}
            className={styles.canvasWrap}
            data-dragging={dragging}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={() => { if (!dragging) setHover(null); }}
            onWheel={onWheel}
          >
            <svg className={styles.geography} viewBox="0 0 1000 500" preserveAspectRatio="none" style={{'--map-x':`${pan.x}px`,'--map-y':`${pan.y}px`,'--map-zoom':zoom} as CSSProperties} aria-hidden="true">
              <g><path d="M55 105L110 55 205 50 275 85 257 137 205 158 188 220 143 238 105 190 72 170Z"/><path d="M205 242L270 262 292 340 255 446 220 404 205 320 178 275Z"/><path d="M430 85L490 58 545 72 565 110 530 130 490 125 468 165 430 145Z"/><path d="M452 168L538 155 585 220 565 330 510 410 470 335 438 255Z"/><path d="M550 87L640 48 765 62 865 115 832 175 740 180 690 235 620 206 570 145Z"/><path d="M795 330L875 310 925 350 900 414 835 420 788 375Z"/><path d="M15 227L39 207 57 225 43 248Z"/></g>
              <g className={styles.routes}><path d="M150 145Q430 15 710 130"/><path d="M250 300Q505 115 855 365"/><path d="M180 130Q310 180 510 245"/></g>
            </svg>
            <canvas ref={canvasRef} className={styles.canvas} aria-label="Interactive anonymized provider network map" />
            <div className={styles.instructions}>Drag to pan · wheel or trackpad to zoom · choose a clinical layer above. Provider names and contact details are never rendered.</div>
            {(hover || selected) && (
              <div className={styles.tooltip} style={{ left: (hover||selected)!.x, top: (hover||selected)!.y }}>
                <b>{(hover||selected)!.title}</b><small>{(hover||selected)!.detail}</small>
              </div>
            )}
          </div>

          <div className={styles.mapFooter} aria-live="polite">
            <span><strong>{LAYER_LABELS[layer]}</strong> selected · {TOTALS[layer].toLocaleString()} directory records</span>
            <span>Zoom {zoom.toFixed(1)}× · {mode === 'coordinates' ? 'individual anonymized coordinates' : 'verified aggregate geography'}</span>
          </div>
        </div>
      </section>

    </main>
  );
}
