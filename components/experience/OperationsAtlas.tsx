'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './OperationsAtlas.module.css';

type Mode = 'live' | 'evidence';
type ScenarioKey = 'medical' | 'lab' | 'dental' | 'vaccine';

type Stage = {
  id: string;
  label: string;
  x: number;
  y: number;
  owner: string;
  description: string;
  evidence: string;
  image: string;
};

const STAGES: Stage[] = [
  { id: '01', label: 'Referral', x: 11, y: 64, owner: 'Employer → Occu-Med', description: 'The request enters with the job, examinee, and authorized medical scope.', evidence: 'Authorization · demographics · job / program context', image: '/photos/EMPLOYEE%20ID.png' },
  { id: '02', label: 'Scheduling', x: 26, y: 38, owner: 'Scheduling', description: 'Availability is coordinated with the examinee and the selected provider.', evidence: 'Appointment confirmation · requested services · provider instructions', image: '/photos/Friendly%20Medical%20Appointment%20Call.png' },
  { id: '03', label: 'Clinic', x: 43, y: 57, owner: 'Provider network', description: 'The case arrives at the clinic with the specific authorized work to perform.', evidence: 'Exam packet · orders · forms · service authorization', image: '/photos/Facilities.png' },
  { id: '04', label: 'Exam', x: 58, y: 30, owner: 'Provider', description: 'The provider performs the requested evaluation and documents findings.', evidence: 'Findings · tracings · images · specimen / administration records', image: '/photos/Medical%20Eval.png' },
  { id: '05', label: 'Records', x: 69, y: 61, owner: 'Provider Relations', description: 'The case remains active until the required records and results are received.', evidence: 'Final reports · images · lab results · missing-item follow-up', image: '/photos/EXAM%20REPORT.png' },
  { id: '06', label: 'QA', x: 82, y: 42, owner: 'Quality Assurance', description: 'Documentation is checked for completeness and accuracy before medical review.', evidence: 'Completeness · legibility · required components · correction loop', image: '/photos/Diverse%20Healthcare%20Team%20Portrait%20(1).png' },
  { id: '07', label: 'Review', x: 91, y: 68, owner: 'Medical Review', description: 'Medical findings are interpreted against the applicable job and program requirements.', evidence: 'Job information × medical evidence × applicable standards', image: '/photos/Fitness%20Determination.png' },
];

const SCENARIOS: Record<ScenarioKey, { label: string; image: string; scope: string[] }> = {
  medical: { label: 'Medical evaluation', image: '/photos/Medical%20Eval.png', scope: ['Physical examination', 'Job-related testing', 'Required forms'] },
  lab: { label: 'Laboratory case', image: '/photos/Calm%20Clinic%20Blood%20Draw%20(1).png', scope: ['Specimen collection', 'Ordered panel', 'Final laboratory results'] },
  dental: { label: 'Dental readiness', image: '/photos/Dental%20Eval.png', scope: ['Comprehensive evaluation', 'Requested radiographs', 'Readiness documentation'] },
  vaccine: { label: 'Vaccination', image: '/photos/Pharmacist%20Administering%20a%20Vaccine(1)%20(1).png', scope: ['Authorized vaccine', 'Administration', 'Lot / record documentation'] },
};

const VERTEX = `
attribute vec2 a_position;
varying vec2 v_uv;
void main(){
  v_uv = a_position * .5 + .5;
  gl_Position = vec4(a_position,0.,1.);
}`;

const FRAGMENT = `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_pointer;
uniform vec2 u_resolution;
uniform float u_mode;
uniform float u_zoom;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
void main(){
  vec2 uv=v_uv;
  vec2 p=(uv-.5)*vec2(u_resolution.x/u_resolution.y,1.);
  p += u_pointer*.035;
  p *= mix(2.8,2.1,u_zoom);
  float n=fbm(p*1.65+vec2(u_time*.008,-u_time*.004));
  float ridge=fbm(p*3.2-vec2(u_time*.004,u_time*.005));
  float h=n*.72+ridge*.28;
  float contour=1.-smoothstep(.018,.045,abs(fract(h*12.)-.5));
  float minor=1.-smoothstep(.01,.03,abs(fract(h*32.)-.5));
  vec3 liveBase=vec3(.018,.075,.096);
  vec3 evidenceBase=vec3(.026,.048,.061);
  vec3 base=mix(liveBase,evidenceBase,u_mode);
  vec3 cyan=vec3(.13,.64,.74);
  vec3 amber=vec3(.86,.63,.30);
  vec3 ink=mix(cyan,amber,u_mode);
  float gridX=1.-smoothstep(.0,.012,abs(fract((uv.x+.018*sin(uv.y*8.))*26.)-.5));
  float gridY=1.-smoothstep(.0,.012,abs(fract((uv.y+.016*sin(uv.x*9.))*18.)-.5));
  float grid=max(gridX,gridY)*.055;
  float fog=smoothstep(.08,.9,noise(p*.7+u_time*.01));
  vec3 color=base+ink*(contour*.105+minor*.022+grid);
  color+=vec3(.06,.11,.13)*fog*.08;
  float vignette=smoothstep(.95,.24,length(v_uv-.5));
  color*=.56+.55*vignette;
  gl_FragColor=vec4(color,1.);
}`;

function shader(gl: WebGLRenderingContext, type: number, source: string) {
  const result = gl.createShader(type);
  if (!result) throw new Error('shader');
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result) || 'shader');
  return result;
}

export default function OperationsAtlas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<Mode>('live');
  const [scenario, setScenario] = useState<ScenarioKey>('medical');
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const selected = STAGES[active];
  const caseData = SCENARIOS[scenario];

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setActive(index => (index + 1) % STAGES.length), 2600);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;
    let program: WebGLProgram | null = null;
    try {
      const vs = shader(gl, gl.VERTEX_SHADER, VERTEX);
      const fs = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
      program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      gl.deleteShader(vs); gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    } catch { return; }
    const p = program;
    const buffer = gl.createBuffer();
    if (!buffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(p, 'a_position');
    const uniforms = {
      time: gl.getUniformLocation(p, 'u_time'),
      pointer: gl.getUniformLocation(p, 'u_pointer'),
      resolution: gl.getUniformLocation(p, 'u_resolution'),
      mode: gl.getUniformLocation(p, 'u_mode'),
      zoom: gl.getUniformLocation(p, 'u_zoom'),
    };
    let raf = 0;
    let mx = 0, my = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.6);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0,0,w,h);
    };
    const onPointer = (event: PointerEvent) => {
      mx = event.clientX / Math.max(1, innerWidth) - .5;
      my = event.clientY / Math.max(1, innerHeight) - .5;
    };
    const draw = (now: number) => {
      resize();
      gl.useProgram(p);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uniforms.time, reduced ? 0 : now * .001);
      gl.uniform2f(uniforms.pointer, reduced ? 0 : mx, reduced ? 0 : my);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.mode, mode === 'evidence' ? 1 : 0);
      gl.uniform1f(uniforms.zoom, Math.max(0, Math.min(1, (zoom - .82) / .58)));
      gl.drawArrays(gl.TRIANGLES,0,6);
      raf = requestAnimationFrame(draw);
    };
    resize();
    addEventListener('pointermove', onPointer, { passive: true });
    raf = requestAnimationFrame(draw);
    return () => { removeEventListener('pointermove', onPointer); cancelAnimationFrame(raf); gl.deleteBuffer(buffer); gl.deleteProgram(p); };
  }, [mode, zoom]);

  const mapStyle = useMemo(() => ({
    '--map-x': `${pan.x}px`,
    '--map-y': `${pan.y}px`,
    '--map-scale': zoom,
  }) as React.CSSProperties, [pan, zoom]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setPan({ x: drag.current.px + (event.clientX - drag.current.x), y: drag.current.py + (event.clientY - drag.current.y) });
  };
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onWheel = (event: React.WheelEvent) => setZoom(value => Math.max(.82, Math.min(1.4, value + (event.deltaY > 0 ? -.06 : .06))));

  return (
    <section className={styles.atlas} aria-label="Occu-Med referral operations atlas">
      <canvas ref={canvasRef} className={styles.terrain} aria-hidden="true" />
      <div className={styles.clouds} aria-hidden="true" />

      <header className={styles.head}>
        <div><span>OCCU-MED / OPERATIONS ATLAS</span><h2>A referral is not a line.<br />It is a living system.</h2></div>
        <p>Explore the same case in two views: the live operational path and the evidence trail it leaves behind.</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.modeSwitch}>
          <button type="button" data-active={mode === 'live'} onClick={() => setMode('live')}>LIVE CASE</button>
          <button type="button" data-active={mode === 'evidence'} onClick={() => setMode('evidence')}>EVIDENCE</button>
        </div>
        <div className={styles.scenarios}>
          {(Object.keys(SCENARIOS) as ScenarioKey[]).map(key => <button type="button" key={key} data-active={scenario === key} onClick={() => { setScenario(key); setActive(0); }}>{SCENARIOS[key].label}</button>)}
        </div>
      </div>

      <div className={styles.mapShell} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}>
        <div className={styles.mapWorld} style={mapStyle}>
          <svg className={styles.routes} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M11 64 C16 48 20 43 26 38 S36 51 43 57 S51 38 58 30 S65 46 69 61 S77 49 82 42 S88 56 91 68" pathLength="100" />
            <path className={styles.routeEcho} d="M11 64 C16 48 20 43 26 38 S36 51 43 57 S51 38 58 30 S65 46 69 61 S77 49 82 42 S88 56 91 68" pathLength="100" />
            {mode === 'live' && <circle r=".72" className={styles.casePulse}><animateMotion dur="18s" repeatCount="indefinite" path="M11 64 C16 48 20 43 26 38 S36 51 43 57 S51 38 58 30 S65 46 69 61 S77 49 82 42 S88 56 91 68" /></circle>}
            {mode === 'live' && <circle r=".35" className={styles.casePulseTiny}><animateMotion begin="-6s" dur="18s" repeatCount="indefinite" path="M11 64 C16 48 20 43 26 38 S36 51 43 57 S51 38 58 30 S65 46 69 61 S77 49 82 42 S88 56 91 68" /></circle>}
          </svg>

          {STAGES.map((stage, index) => (
            <button
              key={stage.id}
              type="button"
              className={styles.pin}
              data-active={index === active}
              data-mode={mode}
              style={{ left: `${stage.x}%`, top: `${stage.y}%` }}
              onClick={event => { event.stopPropagation(); setActive(index); setPlaying(false); }}
              aria-label={`${stage.id} ${stage.label}`}
            >
              <i /><span>{stage.id}</span><strong>{stage.label}</strong>
            </button>
          ))}

          <div className={styles.caseCard} style={{ left: `${selected.x}%`, top: `${selected.y}%` }}>
            <Image src={caseData.image} alt="" fill sizes="150px" />
            <span>{caseData.label}</span>
          </div>
        </div>

        <div className={styles.mapLegend}>
          <span>DRAG TO PAN</span><span>SCROLL TO ZOOM</span><span>{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <aside className={styles.intel} data-mode={mode}>
        <div className={styles.intelTop}><span>{selected.id} / {selected.owner}</span><button type="button" onClick={() => setPlaying(value => !value)}>{playing ? 'PAUSE AUTO' : 'PLAY AUTO'}</button></div>
        <h3>{selected.label}</h3>
        {mode === 'live' ? <p>{selected.description}</p> : <p>{selected.evidence}</p>}
        <div className={styles.caseScope}>
          <small>{mode === 'live' ? 'ACTIVE CASE SCOPE' : 'EVIDENCE PACKET'}</small>
          {(mode === 'live' ? caseData.scope : [selected.evidence, 'Provider documentation', 'Case audit trail']).map(item => <span key={item}>{item}</span>)}
        </div>
        <div className={styles.thumb}><Image src={selected.image} alt="" fill sizes="240px" /></div>
      </aside>

      <div className={styles.stageRail} aria-label="Referral stages">
        {STAGES.map((stage,index) => <button type="button" key={`${stage.id}-rail`} data-active={index===active} onClick={() => { setActive(index); setPlaying(false); }}><i /><span>{stage.id}</span><strong>{stage.label}</strong></button>)}
      </div>
    </section>
  );
}
