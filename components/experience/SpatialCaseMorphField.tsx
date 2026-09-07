'use client';

import { useEffect, useRef } from 'react';
import styles from './SpatialCaseMorphField.module.css';

type Vec3 = [number, number, number];
type RGB = [number, number, number];

const COUNT = 168;
const COLORS: RGB[] = [
  [0.49, 0.84, 0.97],
  [0.26, 0.64, 0.77],
  [0.22, 0.74, 0.84],
  [0.92, 0.70, 0.42],
];

const VERTEX = `
attribute vec3 a_method;
attribute vec3 a_referral;
attribute vec3 a_clinical;
attribute vec3 a_work;
uniform float u_stage;
uniform vec2 u_rotation;
uniform float u_aspect;
uniform float u_pointSize;
uniform float u_opacity;
uniform float u_offsetX;
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
  vec3 p;
  if (u_stage < 1.0) {
    p = mix(a_method, a_referral, smoothstep(0.0, 1.0, u_stage));
  } else if (u_stage < 2.0) {
    p = mix(a_referral, a_clinical, smoothstep(1.0, 2.0, u_stage));
  } else {
    p = mix(a_clinical, a_work, smoothstep(2.0, 3.0, u_stage));
  }

  p = rotateX(rotateY(p, u_rotation.x), u_rotation.y);
  float depth = 2.8 - p.z * 0.55;
  float perspective = 1.15 / depth;
  vec2 clip = vec2((p.x * perspective) / max(0.65, u_aspect), p.y * perspective);
  clip *= 1.8;
  clip.x += u_offsetX;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = u_pointSize * (0.75 + perspective * 1.65);
  v_alpha = u_opacity * (0.4 + (p.z + 1.0) * 0.2);
}
`;

const FRAGMENT = `
precision mediump float;
uniform vec3 u_color;
varying float v_alpha;
void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = length(p);
  if (d > 0.5) discard;
  float halo = smoothstep(0.5, 0.08, d);
  float core = smoothstep(0.22, 0.02, d);
  vec3 color = mix(u_color * 0.72, vec3(0.92, 1.0, 1.0), core * 0.62);
  gl_FragColor = vec4(color, v_alpha * (halo * 0.52 + core * 0.72));
}
`;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function hash(index: number, salt: number) {
  const value = Math.sin(index * 91.731 + salt * 37.117) * 43758.5453123;
  return value - Math.floor(value);
}

function methodShape(): Vec3[] {
  return Array.from({ length: COUNT }, (_, index) => {
    const x = hash(index, 1) * 2 - 1;
    const y = hash(index, 2) * 2 - 1;
    const z = hash(index, 3) * 2 - 1;
    const norm = Math.max(0.001, Math.abs(x) + Math.abs(y) + Math.abs(z));
    const radius = 0.72 + hash(index, 4) * 0.25;
    return [x / norm * radius, y / norm * radius, z / norm * radius];
  });
}

function referralShape(): Vec3[] {
  return Array.from({ length: COUNT }, (_, index) => {
    const x = (hash(index, 5) * 2 - 1) * 0.9;
    const y = (hash(index, 6) * 2 - 1) * 0.56;
    const band = index % 7 === 0 ? 0.28 : 0;
    const yy = band ? 0.35 + (hash(index, 7) - 0.5) * 0.045 : y;
    const z = (hash(index, 8) - 0.5) * 0.10 + Math.sin((x + 1) * 2.4) * 0.035;
    return [x, yy, z];
  });
}

function clinicalShape(): Vec3[] {
  return Array.from({ length: COUNT }, (_, index) => {
    const horizontal = hash(index, 9) > 0.5;
    const along = hash(index, 10) * 2 - 1;
    const across = (hash(index, 11) * 2 - 1) * 0.26;
    const x = horizontal ? along * 0.92 : across;
    const y = horizontal ? across : along * 0.92;
    const z = (hash(index, 12) - 0.5) * 0.16;
    return [x, y, z];
  });
}

function workShape(): Vec3[] {
  return Array.from({ length: COUNT }, (_, index) => {
    const x = (hash(index, 13) * 2 - 1) * 0.62;
    const y = (hash(index, 14) * 2 - 1) * 0.9;
    const topNotch = y > 0.62 ? 0.76 : 1;
    const z = (hash(index, 15) - 0.5) * 0.11;
    return [x * topNotch, y, z];
  });
}

function flatten(points: Vec3[]) {
  return new Float32Array(points.flatMap(point => point));
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create WebGL shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const detail = gl.getShaderInfoLog(shader) || 'Shader compile failed.';
    gl.deleteShader(shader);
    throw new Error(detail);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const result = gl.createProgram();
  if (!result) throw new Error('Unable to create WebGL program.');
  gl.attachShader(result, vertex);
  gl.attachShader(result, fragment);
  gl.linkProgram(result);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(result, gl.LINK_STATUS)) {
    const detail = gl.getProgramInfoLog(result) || 'WebGL program link failed.';
    gl.deleteProgram(result);
    throw new Error(detail);
  }
  return result;
}

function localProgress(section: HTMLElement, vh: number) {
  const rect = section.getBoundingClientRect();
  return clamp((vh * 0.74 - rect.top) / Math.max(1, rect.height + vh * 0.18));
}

function mixColor(stage: number): RGB {
  const from = Math.min(2, Math.max(0, Math.floor(stage)));
  const to = Math.min(3, from + 1);
  const amount = clamp(stage - from);
  return [
    COLORS[from][0] + (COLORS[to][0] - COLORS[from][0]) * amount,
    COLORS[from][1] + (COLORS[to][1] - COLORS[from][1]) * amount,
    COLORS[from][2] + (COLORS[to][2] - COLORS[from][2]) * amount,
  ];
}

export default function SpatialCaseMorphField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return;

    let renderProgram: WebGLProgram;
    try {
      renderProgram = createProgram(gl);
    } catch {
      return;
    }

    const buffers = [methodShape(), referralShape(), clinicalShape(), workShape()].map(shape => {
      const buffer = gl.createBuffer();
      if (!buffer) return null;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(shape), gl.STATIC_DRAW);
      return buffer;
    });
    if (buffers.some(buffer => !buffer)) return;

    const attributes = ['a_method', 'a_referral', 'a_clinical', 'a_work'] as const;
    const attributeLocations = attributes.map(name => gl.getAttribLocation(renderProgram, name));
    const uniforms = {
      stage: gl.getUniformLocation(renderProgram, 'u_stage'),
      rotation: gl.getUniformLocation(renderProgram, 'u_rotation'),
      aspect: gl.getUniformLocation(renderProgram, 'u_aspect'),
      pointSize: gl.getUniformLocation(renderProgram, 'u_pointSize'),
      opacity: gl.getUniformLocation(renderProgram, 'u_opacity'),
      offsetX: gl.getUniformLocation(renderProgram, 'u_offsetX'),
      color: gl.getUniformLocation(renderProgram, 'u_color'),
    };

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetStage = 0;
    let stage = 0;
    let targetOpacity = 0;
    let opacity = 0;
    let last = performance.now();

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

    const updateTarget = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-scrub]'));
      const vh = window.innerHeight || 1;
      let bestIndex = -1;
      let bestDistance = Number.POSITIVE_INFINITY;
      let progress = 0;

      for (let index = 4; index <= 7; index += 1) {
        const section = sections[index];
        if (!section) continue;
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height * 0.5 - vh * 0.5);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
          progress = localProgress(section, vh);
        }
      }

      if (bestIndex < 4 || bestIndex > 7) {
        targetOpacity = 0;
        return;
      }

      const chapter = bestIndex - 4;
      const nextMorph = chapter < 3 ? smoothstep(0.58, 0.92, progress) : 0;
      targetStage = Math.min(3, chapter + nextMorph);
      const reach = vh * 1.55;
      targetOpacity = clamp(1 - bestDistance / reach) * 0.62;

      const providerTop = document.getElementById('provider-details')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      if (providerTop < vh * 0.76) targetOpacity = 0;
    };

    const draw = (now: number) => {
      const delta = Math.min(50, now - last);
      last = now;
      const response = Math.min(1, delta / 155);
      stage += (targetStage - stage) * response;
      opacity += (targetOpacity - opacity) * response;
      canvas.style.opacity = opacity.toFixed(3);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (opacity > 0.004) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.useProgram(renderProgram);

        buffers.forEach((buffer, index) => {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer as WebGLBuffer);
          const location = attributeLocations[index];
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
        });

        const color = mixColor(stage);
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        const wide = window.innerWidth > 900;
        gl.uniform1f(uniforms.stage, stage);
        gl.uniform2f(uniforms.rotation, (stage - 1.5) * 0.12 + pointerX * 0.22, -0.1 + pointerY * 0.14);
        gl.uniform1f(uniforms.aspect, window.innerWidth / Math.max(1, window.innerHeight));
        gl.uniform1f(uniforms.pointSize, 5.2 * dpr);
        gl.uniform1f(uniforms.opacity, opacity);
        gl.uniform1f(uniforms.offsetX, wide ? 0.34 : 0);
        gl.uniform3f(uniforms.color, color[0], color[1], color[2]);
        gl.drawArrays(gl.POINTS, 0, COUNT);
      }

      frame = window.requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX / Math.max(1, window.innerWidth) - 0.5;
      pointerY = event.clientY / Math.max(1, window.innerHeight) - 0.5;
    };
    const onScroll = () => updateTarget();
    const onResize = () => { resize(); updateTarget(); };

    resize();
    updateTarget();
    frame = window.requestAnimationFrame(draw);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.cancelAnimationFrame(frame);
      buffers.forEach(buffer => { if (buffer) gl.deleteBuffer(buffer); });
      gl.deleteProgram(renderProgram);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
