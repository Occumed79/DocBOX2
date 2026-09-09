'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import styles from './NasdaqHistoryPortal.module.css';

const HISTORY = [
  { year:'1976', topic:'Research', title:'The research starts before the company exists.', copy:'A federally funded project begins investigating safer, medically appropriate and legally defensible employment standards tied to the actual work.', image:'/photos/Concerned%20provider.png' },
  { year:'1979', topic:'Company', title:'Occu-Med is founded in Honolulu.', copy:'The research becomes an operating company built around job-specific occupational medical evaluation rather than a generic physical.', image:'/photos/Founders.png' },
  { year:'1980', topic:'Method', title:'Job demands and medical standards are operating together.', copy:'Archival evidence shows comprehensive pre-employment medical standards being used alongside formal analysis of position physical effort.', image:'/photos/EMPLOYEE%20ID.png' },
  { year:'1994', topic:'Method', title:'A national occupational-health system is visible.', copy:'Historical records describe job profiles built from physical and environmental demands, physical-ability categories and specialist medical input.', image:'/photos/Diverse%20Healthcare%20Team%20Portrait%20(1).png' },
  { year:'2006', topic:'International', title:'The operating model goes international.', copy:'Occu-Med begins serving international markets and extends its coordination model into global and deployment-oriented medical readiness.', image:'/photos/International%20Certification.png' },
  { year:'2013', topic:'Growth', title:'A distributed U.S. operating footprint.', copy:'Public records describe Fresno headquarters and secondary offices across multiple U.S. regions before the later global network becomes visible.', image:'/photos/California%20-%20Hawaii%20Map.png' },
  { year:'2016', topic:'International', title:'Infrastructure spans more than 36 countries.', copy:'A contemporary profile describes pre-placement examination infrastructure in more than 36 countries and external recognition of the company’s growth.', image:'/photos/Facilities.png' },
  { year:'TODAY', topic:'Network', title:'One connected provider network.', copy:'Occu-Med now describes more than 15,000 provider locations across all 50 states, U.S. territories and 50+ countries, supporting more than one million employees.', image:'/photos/International%20Network.png' },
] as const;

type GLState = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  lineBuffer: WebGLBuffer;
  count: number;
  position: number;
  line: number;
  time: WebGLUniformLocation | null;
  active: WebGLUniformLocation | null;
  pointer: WebGLUniformLocation | null;
  aspect: WebGLUniformLocation | null;
};

const VERTEX = `
attribute vec2 a_position;
attribute float a_line;
uniform float u_time;
uniform float u_active;
uniform vec2 u_pointer;
uniform float u_aspect;
varying float v_line;
varying float v_focus;
varying float v_depth;

void main(){
  float line = a_line;
  float x = a_position.x;
  float base = (line - 3.5) * .145;
  float wave = sin(x * 5.1 + line * .73 + u_time * .15) * (.035 + mod(line, 3.0) * .008);
  wave += sin(x * 11.0 - u_time * .09 + line) * .012;
  float focus = 1.0 - min(1.0, abs(line - u_active) / 2.4);
  float cursor = exp(-pow((x - u_pointer.x) * 3.4, 2.0));
  float y = base + wave + u_pointer.y * .018 * (line - 3.5);
  float zDepth = .5 + .5 * sin(x * 2.2 + line * 1.7);
  float perspective = 1.0 - zDepth * .08;
  vec2 clip = vec2(x * perspective, y);
  clip.x /= max(.72, u_aspect);
  gl_Position = vec4(clip * vec2(1.9, 1.55), 0.0, 1.0);
  gl_PointSize = (1.4 + zDepth * 2.2) * (1.0 + focus * .95 + cursor * focus * .75);
  v_line = line;
  v_focus = focus;
  v_depth = zDepth;
}
`;

const FRAGMENT = `
precision mediump float;
varying float v_line;
varying float v_focus;
varying float v_depth;
void main(){
  vec2 p = gl_PointCoord - vec2(.5);
  float d = length(p);
  if(d > .5) discard;
  float soft = smoothstep(.5, .02, d);
  vec3 darkBlue = vec3(.035,.18,.28);
  vec3 cyan = vec3(.0,.80,1.0);
  vec3 white = vec3(.82,.97,1.0);
  vec3 c = mix(darkBlue, cyan, .32 + v_focus * .58);
  c = mix(c, white, v_focus * v_depth * .28);
  float alpha = soft * (.12 + v_focus * .68) * (.48 + v_depth * .52);
  gl_FragColor = vec4(c, alpha);
}
`;

function shader(gl: WebGLRenderingContext, type: number, source: string) {
  const s = gl.createShader(type);
  if (!s) throw new Error('Unable to create history shader');
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(s) || 'History shader compile failure';
    gl.deleteShader(s);
    throw new Error(error);
  }
  return s;
}

function createScene(gl: WebGLRenderingContext): GLState | null {
  try {
    const vs = shader(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

    const perLine = 190;
    const count = HISTORY.length * perLine;
    const points = new Float32Array(count * 2);
    const lines = new Float32Array(count);
    let cursor = 0;
    HISTORY.forEach((_, line) => {
      for (let p = 0; p < perLine; p += 1) {
        const t = p / (perLine - 1);
        points[cursor * 2] = t * 2 - 1;
        points[cursor * 2 + 1] = 0;
        lines[cursor] = line;
        cursor += 1;
      }
    });
    const buffer = gl.createBuffer();
    const lineBuffer = gl.createBuffer();
    if (!buffer || !lineBuffer) return null;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer); gl.bufferData(gl.ARRAY_BUFFER, lines, gl.STATIC_DRAW);
    return {
      gl, program, buffer, lineBuffer, count,
      position: gl.getAttribLocation(program,'a_position'),
      line: gl.getAttribLocation(program,'a_line'),
      time: gl.getUniformLocation(program,'u_time'),
      active: gl.getUniformLocation(program,'u_active'),
      pointer: gl.getUniformLocation(program,'u_pointer'),
      aspect: gl.getUniformLocation(program,'u_aspect'),
    };
  } catch { return null; }
}

export default function NasdaqHistoryPortal() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [entered, setEntered] = useState(false);
  const [active, setActive] = useState(1);
  const [topic, setTopic] = useState('All');
  const [search, setSearch] = useState('');
  const activeRef = useRef(active);
  const pointerRef = useRef({x:0,y:0});
  activeRef.current = active;

  const topics = useMemo(() => ['All', ...Array.from(new Set(HISTORY.map(item => item.topic)))], []);
  const visible = useMemo(() => HISTORY.map((item,index)=>({item,index})).filter(({item}) => {
    const topicMatch = topic === 'All' || item.topic === topic;
    const q = search.trim().toLowerCase();
    const searchMatch = !q || `${item.year} ${item.topic} ${item.title} ${item.copy}`.toLowerCase().includes(q);
    return topicMatch && searchMatch;
  }), [topic, search]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const gl = canvas.getContext('webgl', { alpha:true, antialias:true, premultipliedAlpha:false });
    if (!gl) return;
    const scene = createScene(gl);
    if (!scene) return;
    let raf = 0;
    let start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
      const width = Math.max(1, Math.round(window.innerWidth * dpr));
      const height = Math.max(1, Math.round(window.innerHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      canvas.style.width = `${window.innerWidth}px`; canvas.style.height = `${window.innerHeight}px`;
      gl.viewport(0,0,width,height);
    };
    resize(); window.addEventListener('resize', resize);

    const draw = (now:number) => {
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(scene.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, scene.buffer);
      gl.enableVertexAttribArray(scene.position); gl.vertexAttribPointer(scene.position,2,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER, scene.lineBuffer);
      gl.enableVertexAttribArray(scene.line); gl.vertexAttribPointer(scene.line,1,gl.FLOAT,false,0,0);
      gl.uniform1f(scene.time,(now-start)/1000);
      gl.uniform1f(scene.active,activeRef.current);
      gl.uniform2f(scene.pointer,pointerRef.current.x,pointerRef.current.y);
      gl.uniform1f(scene.aspect,window.innerWidth/Math.max(1,window.innerHeight));
      gl.drawArrays(gl.POINTS,0,scene.count);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize); gl.deleteBuffer(scene.buffer); gl.deleteBuffer(scene.lineBuffer); gl.deleteProgram(scene.program); };
  }, []);

  const movePointer = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current = { x: ((event.clientX-rect.left)/Math.max(1,rect.width))*2-1, y: -(((event.clientY-rect.top)/Math.max(1,rect.height))*2-1) };
  };

  const entry = HISTORY[active];

  return (
    <main className={`${styles.root} ${entered ? styles.entered : ''}`} onPointerMove={movePointer}>
      <canvas ref={canvasRef} className={styles.webgl} aria-hidden="true" />
      <nav className={styles.topNav} aria-label="Provider portals">
        <a href="/experience#provider-world">OCCU-MED / PORTALS</a>
        <div><a data-active href="/experience/history">History</a><a href="/experience/network">Network</a><a href="/experience/resources">Resources</a><a href="/experience/questions">Q&A</a><a href="/experience/agreement">Agreement</a></div>
        <a href="/experience#provider-world">Return to hub ↗</a>
      </nav>

      <section className={styles.intro} aria-hidden={entered || undefined}>
        <div className={styles.introGlow} />
        <div className={styles.particleYear}>1979</div>
        <div className={styles.introCopy}>
          <span>OCCU-MED / COMPANY HISTORY</span>
          <h1>From one question<br/>to a global network.</h1>
          <p>Enter a chronological exhibition of the research, methods and infrastructure that shaped Occu-Med.</p>
          <button type="button" onClick={()=>setEntered(true)}>ENTER <i>↘</i></button>
        </div>
      </section>

      <section className={styles.exhibition} aria-hidden={!entered || undefined}>
        <header className={styles.exhibitionHeader}>
          <span>HISTORY / 1976 — TODAY</span>
          <strong>{entry.year}</strong>
          <small>{entry.topic}</small>
        </header>

        <div className={styles.discoveryBar}>
          <label><span>SEARCH THE ARCHIVE</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search years, methods, network…" /></label>
          <div>{topics.map(item=><button key={item} type="button" data-active={topic===item || undefined} onClick={()=>setTopic(item)}>{item}</button>)}</div>
        </div>

        <div className={styles.timelineField}>
          <div className={styles.depthBlur} aria-hidden="true" />
          <div className={styles.timelineTargets}>
            {HISTORY.map((item,index)=><button key={item.year} type="button" onMouseEnter={()=>setActive(index)} onFocus={()=>setActive(index)} onClick={()=>setActive(index)} data-active={active===index || undefined} style={{'--line':index} as CSSProperties} aria-label={`${item.year} ${item.title}`}><i/><span>{item.year}</span><small>{item.topic}</small></button>)}
          </div>

          <article className={styles.storyCard} aria-live="polite">
            <div className={styles.storyImage}><Image src={entry.image} alt="" fill sizes="360px" /></div>
            <div className={styles.storyText}><span>{entry.topic.toUpperCase()} / {String(active+1).padStart(2,'0')}</span><h2>{entry.title}</h2><p>{entry.copy}</p></div>
          </article>
        </div>

        <footer className={styles.chapterJump}>
          <span>EXPLORE</span>
          <div>{visible.map(({item,index})=><button key={item.year} type="button" data-active={active===index || undefined} onClick={()=>setActive(index)}><b>{item.year}</b><small>{item.topic}</small></button>)}</div>
        </footer>
      </section>
    </main>
  );
}
