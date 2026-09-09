'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import ImmersiveStage, { type ImmersiveStageFrame } from './immersive/ImmersiveStage';
import styles from './ReferenceJourney.module.css';

const PHOTO = '/photos/';

const STORY = [
  {
    id: 'origin',
    chapter: '01 / ORIGIN',
    title: 'The question came first.',
    body: 'In 1976, before Occu-Med existed, research began around a harder employment-health question: how do you connect medical evidence to the real physical and environmental demands of a job? In 1979, that work became an operating company in Honolulu.',
    images: ['Founders.png', 'Founders copy.png', 'California - Hawaii Map.png'],
    accent: 'gold',
  },
  {
    id: 'problem',
    chapter: '02 / THE PROBLEM',
    title: 'A physical alone was never enough.',
    body: 'A normal examination can describe health. Occupational medicine has to answer something narrower and more useful: whether the findings matter for the work the person will actually perform.',
    images: ['Concerned provider.png'],
    accent: 'ember',
  },
  {
    id: 'method',
    chapter: '03 / THE METHOD',
    title: 'Job. Medical. Compatibility.',
    body: 'Occu-Med developed a research-based model that brings valid job information, a job-related medical examination, and a compatibility assessment into the same decision process.',
    images: ['EMPLOYEE ID.png', 'Diverse Healthcare Team Portrait (1).png'],
    accent: 'cyan',
  },
  {
    id: 'referral',
    chapter: '04 / REFERRAL & SCHEDULING',
    title: 'One referral enters the system.',
    body: 'Scheduling connects the examinee, the requested scope, and the right provider location. The clinic receives a clear authorization and the forms needed for that specific referral.',
    images: ['Friendly Medical Appointment Call.png'],
    accent: 'cyan',
  },
  {
    id: 'clinical',
    chapter: '05 / CLINICAL SERVICES',
    title: 'Different services. One coordinated case.',
    body: 'Medical examinations, laboratory collection, dental readiness, audiometry, and vaccination can all be coordinated around the exact authorized scope rather than treated as disconnected appointments.',
    images: ['Medical Eval.png', 'Calm Clinic Blood Draw (1).png', 'Dental Eval.png', 'Audiometry.png', 'Pharmacist Administering a Vaccine(1) (1).png'],
    accent: 'violet',
  },
  {
    id: 'records',
    chapter: '06 / RESULTS & QA',
    title: 'The appointment is not the finish line.',
    body: 'Results, reports, tracings, images, and requested records come back into one case. Provider Relations follows missing documentation and Quality Assurance checks completeness before medical review.',
    images: ['EXAM REPORT.png'],
    accent: 'ice',
  },
  {
    id: 'review',
    chapter: '07 / MEDICAL REVIEW',
    title: 'Evidence becomes an outcome.',
    body: 'The provider documents the clinical findings. Occu-Med evaluates those findings against the applicable job, program, or deployment requirements and communicates the appropriate outcome.',
    images: ['Fitness Determination.png'],
    accent: 'ice',
  },
  {
    id: 'work',
    chapter: '08 / THE WORK',
    title: 'Different work creates different demands.',
    body: 'Industrial, public-safety, technical, government, and deployment roles do not ask the same things of the body. The job remains central to the medical question.',
    images: ['Diverse Workforce.png', 'Diverse Workforce2.png'],
    accent: 'amber',
  },
  {
    id: 'deployment',
    chapter: '09 / INTERNATIONAL READINESS',
    title: 'Readiness crosses borders.',
    body: 'Since 2006, Occu-Med has supported international markets. Deployment standards, destination requirements, medical documentation, and immunization needs can move through one coordinated process.',
    images: ['International Certification.png', 'Vaccine Schedule.png'],
    accent: 'blue',
  },
  {
    id: 'network',
    chapter: '10 / PROVIDER INFRASTRUCTURE',
    title: 'Every referral needs a place to land.',
    body: 'The operating model expanded from a distributed U.S. footprint into international infrastructure. Today the public network spans more than 15,000 provider locations across all 50 states, U.S. territories, and 50+ countries.',
    images: ['Facilities.png', 'International Network.png'],
    accent: 'cyan',
  },
  {
    id: 'values',
    chapter: '11 / THE STANDARD',
    title: 'How the work gets done matters.',
    body: 'Humility. Positivity. Customer Service. Quality. Integrity. Diligence. Six values close the company story and open the provider experience.',
    images: ['Corevalue.png', 'Corevalue2.png', 'Corevalue3.png', 'Corevalue4.png', 'Corevalue5.png', 'Corevalue6.png'],
    accent: 'white',
  },
] as const;

const PORTALS = [
  { id: 'history', href: '/experience/history', number: '01', title: 'History', note: 'Enter the archive', angle: -56, depth: 0 },
  { id: 'network', href: '/experience/network', number: '02', title: 'Network', note: 'Explore provider coverage', angle: -27, depth: 1 },
  { id: 'resources', href: '/experience/resources', number: '03', title: 'Resources', note: 'Choose your specialty', angle: 0, depth: 2 },
  { id: 'questions', href: '/experience/questions', number: '04', title: 'Provider Q&A', note: 'Navigate provider guidance', angle: 27, depth: 1 },
  { id: 'agreement', href: '/experience/agreement', number: '05', title: 'Agreement', note: 'Continue to provider forms', angle: 56, depth: 0 },
] as const;

type GLScene = {
  program: WebGLProgram;
  buffer: WebGLBuffer;
  position: number;
  time: WebGLUniformLocation | null;
  scroll: WebGLUniformLocation | null;
  pointer: WebGLUniformLocation | null;
  aspect: WebGLUniformLocation | null;
  count: number;
};

const VERTEX = `
attribute vec3 a_position;
uniform float u_time;
uniform float u_scroll;
uniform vec2 u_pointer;
uniform float u_aspect;
varying float v_depth;

void main() {
  vec3 p = a_position;
  float drift = u_time * (0.035 + p.z * 0.012);
  float cs = cos(drift), sn = sin(drift);
  p.xy = mat2(cs, -sn, sn, cs) * p.xy;
  p.x += u_pointer.x * (0.02 + p.z * 0.018);
  p.y += u_pointer.y * (0.015 + p.z * 0.012);
  p.y += sin(u_scroll * 5.0 + p.x * 4.0) * 0.018;
  float depth = 1.9 + p.z;
  vec2 clip = p.xy / max(0.72, depth);
  clip.x /= max(0.7, u_aspect);
  gl_Position = vec4(clip * 1.8, 0.0, 1.0);
  gl_PointSize = 1.5 + (1.0 - p.z) * 2.2;
  v_depth = clamp(1.25 - p.z, 0.15, 1.0);
}
`;

const FRAGMENT = `
precision mediump float;
varying float v_depth;
void main() {
  vec2 p = gl_PointCoord - vec2(.5);
  float d = length(p);
  if (d > .5) discard;
  float core = smoothstep(.5, .02, d);
  vec3 color = mix(vec3(.18,.55,.72), vec3(.78,.95,1.0), v_depth);
  gl_FragColor = vec4(color, core * (.22 + v_depth * .55));
}
`;

function compile(gl: WebGLRenderingContext | WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create immersive shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const detail = gl.getShaderInfoLog(shader) || 'Shader compilation failed';
    gl.deleteShader(shader);
    throw new Error(detail);
  }
  return shader;
}

function createStage(gl: WebGLRenderingContext | WebGL2RenderingContext): GLScene | null {
  try {
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }

    const count = 620;
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const a = i * 2.399963229728653;
      const radius = Math.sqrt((i + .5) / count) * 1.25;
      points[i * 3] = Math.cos(a) * radius;
      points[i * 3 + 1] = Math.sin(a) * radius;
      points[i * 3 + 2] = ((i * 47) % 101) / 100 * 1.55 - .55;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

    return {
      program,
      buffer,
      position: gl.getAttribLocation(program, 'a_position'),
      time: gl.getUniformLocation(program, 'u_time'),
      scroll: gl.getUniformLocation(program, 'u_scroll'),
      pointer: gl.getUniformLocation(program, 'u_pointer'),
      aspect: gl.getUniformLocation(program, 'u_aspect'),
      count,
    };
  } catch {
    return null;
  }
}

export default function ReferenceJourney() {
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<GLScene | null>(null);
  const [activeScene, setActiveScene] = useState(0);
  const [travel, setTravel] = useState<string | null>(null);

  const handleReady = useCallback((gl: WebGLRenderingContext | WebGL2RenderingContext) => {
    const scene = createStage(gl);
    stageRef.current = scene;
    return () => {
      if (!scene) return;
      gl.deleteBuffer(scene.buffer);
      gl.deleteProgram(scene.program);
      stageRef.current = null;
    };
  }, []);

  const handleFrame = useCallback((frame: ImmersiveStageFrame) => {
    const scene = stageRef.current;
    if (!scene || frame.reducedMotion) return;
    const { gl } = frame;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(scene.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, scene.buffer);
    gl.enableVertexAttribArray(scene.position);
    gl.vertexAttribPointer(scene.position, 3, gl.FLOAT, false, 0, 0);
    gl.uniform1f(scene.time, frame.elapsed);
    gl.uniform1f(scene.scroll, frame.progress);
    gl.uniform2f(scene.pointer, frame.pointer.x, frame.pointer.y);
    gl.uniform1f(scene.aspect, frame.viewport.width / Math.max(1, frame.viewport.height));
    gl.drawArrays(gl.POINTS, 0, scene.count);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-story-scene]'));
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = Math.max(window.innerHeight, 1);
      let nearest = 0;
      let distance = Number.POSITIVE_INFINITY;

      scenes.forEach((scene, index) => {
        const rect = scene.getBoundingClientRect();
        const travelDistance = Math.max(rect.height - vh * .55, vh * .65);
        const local = Math.max(0, Math.min(1, (vh * .62 - rect.top) / travelDistance));
        scene.style.setProperty('--local', local.toFixed(4));
        const d = Math.abs(rect.top + rect.height * .5 - vh * .5);
        if (d < distance) {
          distance = d;
          nearest = index;
        }
      });

      root.style.setProperty('--scroll', `${window.scrollY}px`);
      setActiveScene(Math.min(nearest, STORY.length - 1));
    };

    const queue = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const enterPortal = (event: MouseEvent<HTMLAnchorElement>, id: string, href: string) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    event.preventDefault();
    if (travel) return;
    setTravel(id);
    window.setTimeout(() => window.location.assign(href), 720);
  };

  return (
    <main ref={rootRef} className={`${styles.root} ${travel ? styles.traveling : ''}`} data-travel={travel || undefined}>
      <ImmersiveStage className={styles.stage} clearColor={[0.008, 0.021, 0.032, 1]} onReady={handleReady} onFrame={handleFrame} />

      <section className={styles.prologue}>
        <div className={styles.prologueMedia}>
          <Image src={`${PHOTO}Founders.png`} alt="Occu-Med founders illustration" fill priority sizes="100vw" />
        </div>
        <div className={styles.prologueWash} />
        <div className={styles.prologueCopy}>
          <span>OCCU-MED / PROVIDER EXPERIENCE</span>
          <h1>We start<br /><em>with the job.</em></h1>
          <p>Scroll through the company story. The story ends inside an interactive provider world.</p>
          <a href="#story">Enter the story <b>↓</b></a>
        </div>
        <div className={styles.prologueIndex}>1976 — TODAY</div>
      </section>

      <div id="story" className={styles.story}>
        <nav className={styles.rail} aria-label="Company story chapters">
          <span>STORY</span>
          {STORY.map((item, index) => (
            <a key={item.id} href={`#scene-${item.id}`} aria-current={activeScene === index ? 'step' : undefined}>
              <i /><b>{String(index + 1).padStart(2, '0')}</b><small>{item.chapter.split('/ ')[1]}</small>
            </a>
          ))}
        </nav>

        {STORY.map((scene, sceneIndex) => (
          <section
            id={`scene-${scene.id}`}
            key={scene.id}
            className={styles.scene}
            data-story-scene
            data-tone={scene.accent}
            style={{ '--scene-index': sceneIndex } as CSSProperties}
          >
            <div className={styles.sceneWorld}>
              <div className={styles.mediaConstellation}>
                {scene.images.map((image, imageIndex) => (
                  <figure
                    key={image}
                    className={styles.mediaPlane}
                    style={{ '--image-index': imageIndex, '--image-count': scene.images.length } as CSSProperties}
                  >
                    <Image
                      src={`${PHOTO}${encodeURIComponent(image)}`}
                      alt={`${scene.title} — visual ${imageIndex + 1}`}
                      fill
                      sizes="(max-width: 800px) 88vw, 58vw"
                    />
                  </figure>
                ))}
                <div className={styles.sceneHalo} aria-hidden="true" />
                <div className={styles.sceneVector} aria-hidden="true" />
              </div>
            </div>

            <div className={styles.sceneCopy}>
              <span>{scene.chapter}</span>
              <h2>{scene.title}</h2>
              <p>{scene.body}</p>
              <small>{String(sceneIndex + 1).padStart(2, '0')} / {STORY.length}</small>
            </div>
          </section>
        ))}
      </div>

      <section className={styles.hub} id="provider-world">
        <div className={styles.hubSky} aria-hidden="true">
          <div className={styles.overheadObject}><i /><b /><span /></div>
          <div className={styles.horizon} />
          <div className={styles.gridFloor} />
        </div>

        <div className={styles.astronaut} aria-hidden="true">
          <div className={styles.helmet}><i /></div>
          <div className={styles.body}><i /></div>
          <div className={styles.leftArm} />
          <div className={styles.rightArm} />
          <div className={styles.leftLeg} />
          <div className={styles.rightLeg} />
          <div className={styles.pack} />
        </div>

        <div className={styles.hubCopy}>
          <span>YOUR FACILITY / FIVE PATHS</span>
          <h2>Choose where<br />you want to go.</h2>
          <p>The company story is over. From here, the experience becomes yours.</p>
        </div>

        <div className={styles.portalWorld}>
          {PORTALS.map((portal) => (
            <a
              key={portal.id}
              className={styles.portal}
              data-id={portal.id}
              data-selected={travel === portal.id ? 'true' : undefined}
              href={portal.href}
              onClick={(event) => enterPortal(event, portal.id, portal.href)}
              style={{ '--angle': `${portal.angle}deg`, '--depth': portal.depth } as CSSProperties}
            >
              <span className={styles.portalRing}><i /><b /></span>
              <small>{portal.number}</small>
              <strong>{portal.title}</strong>
              <em>{portal.note}</em>
            </a>
          ))}
        </div>

        <div className={styles.hubHint}>MOVE / HOVER / SELECT A PORTAL</div>
      </section>

      <div className={styles.travelFlash} aria-hidden="true"><i /><b /></div>
    </main>
  );
}
