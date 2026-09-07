'use client';

import { useEffect, useRef } from 'react';
import styles from './SpatialValuesPartnerField.module.css';

type Vec3 = [number, number, number];
type DirectorStageDetail = { chapter?: string; index?: number };

const GROUPS = 6;
const POINTS_PER_GROUP = 36;
const POINT_COUNT = GROUPS * POINTS_PER_GROUP;

const VERTEX = `
attribute vec3 a_start;
attribute vec3 a_end;
attribute float a_group;
uniform float u_transition;
uniform float u_active;
uniform float u_pointSize;
uniform float u_opacity;
uniform vec2 u_pointer;
varying float v_alpha;
varying float v_group;
varying float v_transition;

float ease(float t) {
  return t * t * (3.0 - 2.0 * t);
}

vec3 rotateY(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

void main() {
  float t = ease(clamp(u_transition, 0.0, 1.0));
  vec3 p = mix(a_start, a_end, t);
  float activeDistance = abs(a_group - u_active);
  float activePulse = 1.0 - smoothstep(0.0, 1.2, activeDistance);
  float spread = (1.0 - t) * activePulse * 0.085;
  p.xy *= 1.0 + spread;
  p = rotateY(p, (1.0 - t) * (u_pointer.x * 0.24));
  p.x += u_pointer.x * 0.055 * (1.0 - t);
  p.y -= u_pointer.y * 0.045 * (1.0 - t);

  float depth = 2.45 - p.z;
  float perspective = 1.16 / depth;
  gl_Position = vec4(p.x * perspective, p.y * perspective, 0.0, 1.0);
  gl_PointSize = u_pointSize * (0.76 + perspective * 1.7) * (1.0 + activePulse * 0.42 * (1.0 - t));
  v_alpha = u_opacity * (0.34 + activePulse * 0.58 * (1.0 - t));
  v_group = a_group;
  v_transition = t;
}
`;

const POINT_FRAGMENT = `
precision mediump float;
varying float v_alpha;
varying float v_group;
varying float v_transition;

vec3 groupColor(float groupIndex) {
  if (groupIndex < 0.5) return vec3(0.93, 0.75, 0.31);
  if (groupIndex < 1.5) return vec3(0.45, 0.87, 0.96);
  if (groupIndex < 2.5) return vec3(0.70, 0.83, 0.98);
  if (groupIndex < 3.5) return vec3(0.97, 0.65, 0.34);
  if (groupIndex < 4.5) return vec3(0.56, 0.90, 0.80);
  return vec3(0.83, 0.72, 0.98);
}

void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = length(p);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.05, d);
  vec3 valuesColor = groupColor(v_group);
  vec3 partnerColor = vec3(0.08, 0.30, 0.42);
  vec3 color = mix(valuesColor, partnerColor, v_transition);
  gl_FragColor = vec4(color, v_alpha * core);
}
`;

const LINE_FRAGMENT = `
precision mediump float;
varying float v_alpha;
varying float v_group;
varying float v_transition;

vec3 groupColor(float groupIndex) {
  if (groupIndex < 0.5) return vec3(0.93, 0.75, 0.31);
  if (groupIndex < 1.5) return vec3(0.45, 0.87, 0.96);
  if (groupIndex < 2.5) return vec3(0.70, 0.83, 0.98);
  if (groupIndex < 3.5) return vec3(0.97, 0.65, 0.34);
  if (groupIndex < 4.5) return vec3(0.56, 0.90, 0.80);
  return vec3(0.83, 0.72, 0.98);
}

void main() {
  vec3 color = mix(groupColor(v_group), vec3(0.08, 0.30, 0.42), v_transition);
  gl_FragColor = vec4(color, v_alpha * mix(0.24, 0.5, v_transition));
}
`;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create WebGL shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const detail = gl.getShaderInfoLog(shader) || 'Unknown shader error';
    gl.deleteShader(shader);
    throw new Error(detail);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, fragment: string) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const frag = compile(gl, gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!program) throw new Error('Could not create WebGL program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const detail = gl.getProgramInfoLog(program) || 'Unknown WebGL link error';
    gl.deleteProgram(program);
    throw new Error(detail);
  }
  return program;
}

function valuesShape(): { positions: Vec3[]; groups: number[] } {
  const positions: Vec3[] = [];
  const groups: number[] = [];
  for (let group = 0; group < GROUPS; group += 1) {
    const angle = (Math.PI * 2 * group) / GROUPS - Math.PI / 2;
    const centerX = Math.cos(angle) * 0.76;
    const centerY = Math.sin(angle) * 0.76;
    for (let index = 0; index < POINTS_PER_GROUP; index += 1) {
      const local = (Math.PI * 2 * index) / POINTS_PER_GROUP;
      const petalRadius = 0.19 + 0.045 * Math.sin(local * 3 + group * 0.7);
      const tangentX = Math.cos(local) * petalRadius;
      const tangentY = Math.sin(local) * petalRadius * 0.68;
      const rotate = angle + Math.PI / 2;
      const x = centerX + tangentX * Math.cos(rotate) - tangentY * Math.sin(rotate);
      const y = centerY + tangentX * Math.sin(rotate) + tangentY * Math.cos(rotate);
      const z = 0.13 * Math.sin(local * 2 + group * 0.8);
      positions.push([x, y, z]);
      groups.push(group);
    }
  }
  return { positions, groups };
}

function partnerShape(): Vec3[] {
  const positions: Vec3[] = [];
  const archTop = 0.58;
  const archRadius = 0.58;
  for (let group = 0; group < GROUPS; group += 1) {
    for (let index = 0; index < POINTS_PER_GROUP; index += 1) {
      const globalIndex = group * POINTS_PER_GROUP + index;
      const normalized = globalIndex / Math.max(1, POINT_COUNT - 1);
      const lane = group % 3;
      let x = 0;
      let y = 0;

      if (normalized < 0.32) {
        const p = normalized / 0.32;
        x = -0.58;
        y = -0.78 + p * 1.33;
      } else if (normalized < 0.68) {
        const p = (normalized - 0.32) / 0.36;
        const a = Math.PI - p * Math.PI;
        x = Math.cos(a) * archRadius;
        y = archTop + Math.sin(a) * archRadius;
      } else {
        const p = (normalized - 0.68) / 0.32;
        x = 0.58;
        y = 0.55 - p * 1.33;
      }

      const laneOffset = (lane - 1) * 0.035;
      const z = (group - 2.5) * 0.018 + Math.sin(index * 0.73) * 0.02;
      positions.push([x + laneOffset, y, z]);
    }
  }
  return positions;
}

function buildLineIndices() {
  const pairs: Array<[number, number]> = [];
  for (let group = 0; group < GROUPS; group += 1) {
    const base = group * POINTS_PER_GROUP;
    for (let index = 0; index < POINTS_PER_GROUP; index += 3) {
      pairs.push([base + index, base + ((index + 3) % POINTS_PER_GROUP)]);
    }
    pairs.push([base, ((group + 1) % GROUPS) * POINTS_PER_GROUP]);
  }
  return pairs;
}

function flatten(points: Vec3[]) {
  return new Float32Array(points.flatMap(point => point));
}

function lineData(points: Vec3[], groups: number[], pairs: Array<[number, number]>) {
  const positions: number[] = [];
  const lineGroups: number[] = [];
  pairs.forEach(([a, b]) => {
    positions.push(...points[a], ...points[b]);
    lineGroups.push(groups[a], groups[b]);
  });
  return { positions: new Float32Array(positions), groups: new Float32Array(lineGroups) };
}

function sectionProgress(section: HTMLElement, vh: number) {
  const rect = section.getBoundingClientRect();
  return clamp((vh * 0.78 - rect.top) / Math.max(1, rect.height + vh * 0.18));
}

function findValuesSection() {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find(section =>
    Array.from(section.querySelectorAll('button strong')).some(node => node.textContent?.trim() === 'Humility')
  ) ?? null;
}

function findPartnerSection() {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find(section =>
    Boolean(section.querySelector('a[href="#provider-details"]'))
  ) ?? null;
}

export default function SpatialValuesPartnerField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return;

    let pointProgram: WebGLProgram;
    let lineProgram: WebGLProgram;
    try {
      pointProgram = createProgram(gl, POINT_FRAGMENT);
      lineProgram = createProgram(gl, LINE_FRAGMENT);
    } catch {
      return;
    }

    const start = valuesShape();
    const end = partnerShape();
    const pairs = buildLineIndices();
    const startLines = lineData(start.positions, start.groups, pairs);
    const endLines = lineData(end, start.groups, pairs);

    const pointStart = gl.createBuffer();
    const pointEnd = gl.createBuffer();
    const pointGroups = gl.createBuffer();
    const lineStart = gl.createBuffer();
    const lineEnd = gl.createBuffer();
    const lineGroups = gl.createBuffer();
    if (!pointStart || !pointEnd || !pointGroups || !lineStart || !lineEnd || !lineGroups) return;

    const fill = (buffer: WebGLBuffer, data: Float32Array) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    };

    fill(pointStart, flatten(start.positions));
    fill(pointEnd, flatten(end));
    fill(pointGroups, new Float32Array(start.groups));
    fill(lineStart, startLines.positions);
    fill(lineEnd, endLines.positions);
    fill(lineGroups, startLines.groups);

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetOpacity = 0;
    let opacity = 0;
    let transition = 0;
    let activeValue = 0;
    let last = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
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

    const proximity = (section: HTMLElement | null, vh: number) => {
      if (!section) return 0;
      const rect = section.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height * 0.5 - vh * 0.5);
      const reach = Math.max(vh * 0.9, rect.height * 0.62);
      return clamp(1 - distance / reach);
    };

    const updateVisibility = () => {
      const vh = window.innerHeight || 1;
      const values = findValuesSection();
      const partner = findPartnerSection();
      const valuesNear = proximity(values, vh);
      const partnerNear = proximity(partner, vh);
      const valuesProgress = values ? sectionProgress(values, vh) : 0;
      const partnerProgress = partner ? sectionProgress(partner, vh) : 0;
      const manual = document.documentElement.dataset.directorManualStages === 'true';

      if (!manual) activeValue = Math.min(5, Math.floor(clamp((valuesProgress - 0.05) / 0.9) * 6));
      transition = clamp(partnerProgress * 1.16);
      targetOpacity = Math.max(Math.pow(valuesNear, 1.35) * 0.8, Math.pow(partnerNear, 1.25) * 0.72);

      const providerTop = document.getElementById('provider-details')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      if (providerTop < vh * 0.72) targetOpacity = 0;
    };

    const bind = (
      renderProgram: WebGLProgram,
      startBuffer: WebGLBuffer,
      endBuffer: WebGLBuffer,
      groupBuffer: WebGLBuffer,
      count: number,
      mode: number,
      pointSize: number,
    ) => {
      gl.useProgram(renderProgram);
      const startLocation = gl.getAttribLocation(renderProgram, 'a_start');
      const endLocation = gl.getAttribLocation(renderProgram, 'a_end');
      const groupLocation = gl.getAttribLocation(renderProgram, 'a_group');

      gl.bindBuffer(gl.ARRAY_BUFFER, startBuffer);
      gl.enableVertexAttribArray(startLocation);
      gl.vertexAttribPointer(startLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, endBuffer);
      gl.enableVertexAttribArray(endLocation);
      gl.vertexAttribPointer(endLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, groupBuffer);
      gl.enableVertexAttribArray(groupLocation);
      gl.vertexAttribPointer(groupLocation, 1, gl.FLOAT, false, 0, 0);

      gl.uniform1f(gl.getUniformLocation(renderProgram, 'u_transition'), transition);
      gl.uniform1f(gl.getUniformLocation(renderProgram, 'u_active'), activeValue);
      gl.uniform1f(gl.getUniformLocation(renderProgram, 'u_pointSize'), pointSize);
      gl.uniform1f(gl.getUniformLocation(renderProgram, 'u_opacity'), opacity);
      gl.uniform2f(gl.getUniformLocation(renderProgram, 'u_pointer'), pointerX, pointerY);
      gl.drawArrays(mode, 0, count);
    };

    const draw = (now: number) => {
      const delta = Math.min(50, now - last);
      last = now;
      opacity += (targetOpacity - opacity) * Math.min(1, delta / 125);
      canvas.style.opacity = opacity.toFixed(3);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (opacity > 0.004) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        bind(lineProgram, lineStart, lineEnd, lineGroups, startLines.positions.length / 3, gl.LINES, 1);
        bind(pointProgram, pointStart, pointEnd, pointGroups, POINT_COUNT, gl.POINTS, 5.1 * dpr);
      }
      frame = window.requestAnimationFrame(draw);
    };

    const onDirectorStage = (event: Event) => {
      const detail = (event as CustomEvent<DirectorStageDetail>).detail;
      if (detail?.chapter === 'Values' && typeof detail.index === 'number') activeValue = clamp(detail.index / 5) * 5;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion) return;
      pointerX = event.clientX / Math.max(1, window.innerWidth) - 0.5;
      pointerY = event.clientY / Math.max(1, window.innerHeight) - 0.5;
    };
    const onScroll = () => updateVisibility();
    const onResize = () => { resize(); updateVisibility(); };

    resize();
    updateVisibility();
    frame = window.requestAnimationFrame(draw);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('occumed:director-stage', onDirectorStage);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('occumed:director-stage', onDirectorStage);
      window.cancelAnimationFrame(frame);
      [pointStart, pointEnd, pointGroups, lineStart, lineEnd, lineGroups].forEach(buffer => gl.deleteBuffer(buffer));
      gl.deleteProgram(pointProgram);
      gl.deleteProgram(lineProgram);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} data-spatial-values-canvas aria-hidden="true" />;
}
