'use client';

import { useEffect, useRef } from 'react';
import styles from './SpatialArchiveField.module.css';

type Vec3 = [number, number, number];
type DirectorStageDetail = { chapter?: string; index?: number };

const COUNT = 216;

const VERTEX = `
attribute vec3 a_archive;
attribute vec3 a_research;
attribute vec3 a_guidelines;
attribute vec3 a_method;
uniform float u_stage;
uniform vec2 u_rotation;
uniform float u_aspect;
uniform float u_size;
uniform float u_opacity;
varying float v_mix;
varying float v_alpha;

vec3 rotateY(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}
vec3 rotateX(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

void main() {
  float first = smoothstep(0.0, 1.0, min(u_stage, 1.0));
  float second = smoothstep(1.0, 2.0, u_stage);
  float third = smoothstep(2.0, 3.0, u_stage);
  vec3 p = mix(a_archive, a_research, first);
  p = mix(p, a_guidelines, second);
  p = mix(p, a_method, third);
  p = rotateX(rotateY(p, u_rotation.x), u_rotation.y);

  float depth = 3.15 - p.z * 0.72;
  float perspective = 1.28 / max(1.45, depth);
  vec2 clip = vec2((p.x * perspective) / max(.72, u_aspect), p.y * perspective);
  clip *= 2.05;
  clip.x += .19;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = u_size * (.72 + perspective * 2.0);
  v_mix = clamp(u_stage / 2.6, 0.0, 1.0);
  v_alpha = u_opacity * (.42 + (p.z + 1.0) * .18);
}
`;

const FRAGMENT = `
precision mediump float;
varying float v_mix;
varying float v_alpha;
void main() {
  vec2 point = gl_PointCoord - vec2(.5);
  float d = length(point);
  if (d > .5) discard;
  float halo = smoothstep(.5, .05, d);
  float core = smoothstep(.2, .01, d);
  vec3 archival = vec3(.91, .74, .49);
  vec3 research = vec3(.49, .83, .96);
  vec3 color = mix(archival, research, v_mix);
  color = mix(color, vec3(.93, 1.0, 1.0), core * .58);
  gl_FragColor = vec4(color, v_alpha * (halo * .46 + core * .74));
}
`;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / Math.max(.0001, edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function hash(index: number, salt: number) {
  const value = Math.sin(index * 71.417 + salt * 43.113) * 43758.5453123;
  return value - Math.floor(value);
}

function archiveShape(): Vec3[] {
  return Array.from({ length: COUNT }, (_, index) => {
    const sheet = index % 3;
    const column = Math.floor(index / 3) % 12;
    const row = Math.floor(index / 36);
    const baseX = sheet === 0 ? -0.72 : sheet === 1 ? 0 : 0.72;
    const x = baseX + (column / 11 - .5) * .56 + (hash(index, 1) - .5) * .035;
    const y = .7 - row * .29 + (hash(index, 2) - .5) * .06;
    const z = (sheet - 1) * .18 + (hash(index, 3) - .5) * .09;
    return [x, y, z];
  });
}

function researchShape(): Vec3[] {
  return Array.from({ length: COUNT }, (_, index) => {
    const lane = index % 3;
    const t = Math.floor(index / 3) / Math.max(1, COUNT / 3 - 1);
    const angle = t * Math.PI * 2.2 + lane * 2.08;
    const radius = .34 + lane * .28 + (hash(index, 4) - .5) * .08;
    return [
      Math.cos(angle) * radius,
      (t - .5) * 1.35 + Math.sin(angle * .65) * .12,
      Math.sin(angle) * radius * .58,
    ];
  });
}

function guidelinesShape(): Vec3[] {
  return Array.from({ length: COUNT }, (_, index) => {
    const node = index % 12;
    const ring = Math.floor(index / 12);
    const angle = node / 12 * Math.PI * 2;
    const localAngle = ring / 18 * Math.PI * 2;
    const centerRadius = .78;
    const clusterRadius = .08 + hash(index, 5) * .045;
    const x = Math.cos(angle) * centerRadius + Math.cos(localAngle) * clusterRadius;
    const y = Math.sin(angle) * centerRadius * .76 + Math.sin(localAngle) * clusterRadius;
    const z = Math.sin(angle * 2) * .23 + (hash(index, 6) - .5) * .12;
    return [x, y, z];
  });
}

function methodSeedShape(): Vec3[] {
  return Array.from({ length: COUNT }, (_, index) => {
    const x = hash(index, 7) * 2 - 1;
    const y = hash(index, 8) * 2 - 1;
    const z = hash(index, 9) * 2 - 1;
    const norm = Math.max(.001, Math.abs(x) + Math.abs(y) + Math.abs(z));
    const radius = .72 + hash(index, 10) * .23;
    return [x / norm * radius, y / norm * radius, z / norm * radius];
  });
}

function flatten(points: Vec3[]) {
  return new Float32Array(points.flatMap(point => point));
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create archive shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const detail = gl.getShaderInfoLog(shader) || 'Archive shader compile failed.';
    gl.deleteShader(shader);
    throw new Error(detail);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create archive WebGL program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const detail = gl.getProgramInfoLog(program) || 'Archive program link failed.';
    gl.deleteProgram(program);
    throw new Error(detail);
  }
  return program;
}

function archiveProgress(section: HTMLElement) {
  const rect = section.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const raw = (vh * .72 - rect.top) / Math.max(1, rect.height - vh * .15);
  return clamp(raw);
}

function proximity(section: HTMLElement | undefined, vh: number) {
  if (!section) return 0;
  const rect = section.getBoundingClientRect();
  const distance = Math.abs(rect.top + rect.height * .5 - vh * .5);
  const reach = Math.max(vh * .95, rect.height * .68);
  return clamp(1 - distance / reach);
}

export default function SpatialArchiveField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return;

    let program: WebGLProgram;
    try {
      program = createProgram(gl);
    } catch {
      return;
    }

    const shapes = [archiveShape(), researchShape(), guidelinesShape(), methodSeedShape()];
    const buffers = shapes.map(shape => {
      const buffer = gl.createBuffer();
      if (!buffer) return null;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(shape), gl.STATIC_DRAW);
      return buffer;
    });
    if (buffers.some(buffer => !buffer)) return;

    const attributeNames = ['a_archive', 'a_research', 'a_guidelines', 'a_method'] as const;
    const attributes = attributeNames.map(name => gl.getAttribLocation(program, name));
    const uniforms = {
      stage: gl.getUniformLocation(program, 'u_stage'),
      rotation: gl.getUniformLocation(program, 'u_rotation'),
      aspect: gl.getUniformLocation(program, 'u_aspect'),
      size: gl.getUniformLocation(program, 'u_size'),
      opacity: gl.getUniformLocation(program, 'u_opacity'),
    };

    const root = document.documentElement;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetStage = 0;
    let stage = 0;
    let manualStage: number | null = null;
    let targetOpacity = 0;
    let opacity = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      const width = Math.max(1, Math.round(window.innerWidth * dpr));
      const height = Math.max(1, Math.round(window.innerHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
      }
      gl.viewport(0, 0, width, height);
    };

    const updateTarget = () => {
      const archive = document.querySelector<HTMLElement>('[data-spatial-archive]');
      if (!archive) {
        targetOpacity = 0;
        return;
      }

      const vh = window.innerHeight || 1;
      const archiveRect = archive.getBoundingClientRect();
      const archiveDistance = Math.abs(archiveRect.top + archiveRect.height * .5 - vh * .5);
      const archiveReach = archiveRect.height * .72 + vh * .45;
      const progress = archiveProgress(archive);
      const archiveOpacity = clamp(1 - archiveDistance / Math.max(vh, archiveReach)) * .56;

      const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-scrub]'));
      const method = sections[4];
      const methodNear = proximity(method, vh);
      let bridge = 0;
      if (method && methodNear > .035) {
        const methodRect = method.getBoundingClientRect();
        bridge = smoothstep(-.12, .86, (vh * .94 - methodRect.top) / Math.max(1, vh * 1.48));
      }

      const automaticStage = methodNear > .035 ? Math.max(progress * 2, 2 + bridge) : progress * 2;
      const manual = root.dataset.directorManualStages === 'true' && manualStage !== null;
      targetStage = manual ? manualStage as number : automaticStage;
      targetOpacity = Math.max(archiveOpacity, methodNear * .34);
      if (archiveRect.bottom < vh * .06 && methodNear < .035) targetOpacity *= .22;
    };

    const draw = (now: number) => {
      const delta = Math.min(50, now - last);
      last = now;
      if (manualStage !== null && root.dataset.directorManualStages !== 'true') {
        manualStage = null;
        updateTarget();
      }
      const response = Math.min(1, delta / 150);
      stage += (targetStage - stage) * response;
      opacity += (targetOpacity - opacity) * response;
      canvas.style.opacity = opacity.toFixed(3);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (opacity > .004) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.useProgram(program);

        buffers.forEach((buffer, index) => {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer as WebGLBuffer);
          const location = attributes[index];
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
        });

        const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
        gl.uniform1f(uniforms.stage, stage);
        gl.uniform2f(uniforms.rotation, -.1 + pointerX * .18 + stage * .055, -.08 + pointerY * .12);
        gl.uniform1f(uniforms.aspect, window.innerWidth / Math.max(1, window.innerHeight));
        gl.uniform1f(uniforms.size, 4.6 * dpr);
        gl.uniform1f(uniforms.opacity, opacity);
        gl.drawArrays(gl.POINTS, 0, COUNT);
      }

      frame = window.requestAnimationFrame(draw);
    };

    const onDirectorStage = (event: Event) => {
      const detail = (event as CustomEvent<DirectorStageDetail>).detail;
      if (detail?.chapter === 'Archive' && typeof detail.index === 'number') {
        manualStage = clamp(detail.index, 0, 3);
        targetStage = manualStage;
      } else if (detail?.chapter && detail.chapter !== 'Archive') {
        manualStage = null;
      }
      updateTarget();
    };
    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX / Math.max(1, window.innerWidth) - .5;
      pointerY = event.clientY / Math.max(1, window.innerHeight) - .5;
    };
    const onScroll = () => updateTarget();
    const onResize = () => { resize(); updateTarget(); };

    resize();
    updateTarget();
    frame = window.requestAnimationFrame(draw);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('occumed:director-stage', onDirectorStage);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('occumed:director-stage', onDirectorStage);
      window.cancelAnimationFrame(frame);
      buffers.forEach(buffer => { if (buffer) gl.deleteBuffer(buffer); });
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" data-spatial-archive-canvas />;
}
