'use client';

import { useEffect, useRef } from 'react';
import styles from './SpatialNetworkField.module.css';

type Vec3 = [number, number, number];

const VERTEX = `
attribute vec3 a_position;
uniform vec2 u_rotation;
uniform float u_pointSize;
uniform float u_opacity;
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
  vec3 p = rotateX(rotateY(a_position, u_rotation.x), u_rotation.y);
  float depth = 2.65 - p.z;
  float perspective = 1.2 / depth;
  gl_Position = vec4(p.x * perspective, p.y * perspective, 0.0, 1.0);
  gl_PointSize = u_pointSize * (0.72 + perspective * 1.75);
  v_alpha = u_opacity * (0.28 + (p.z + 1.0) * 0.36);
}
`;

const POINT_FRAGMENT = `
precision mediump float;
varying float v_alpha;
void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = length(p);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.05, d);
  gl_FragColor = vec4(0.34, 0.94, 0.95, v_alpha * core);
}
`;

const LINE_FRAGMENT = `
precision mediump float;
varying float v_alpha;
void main() {
  gl_FragColor = vec4(0.20, 0.82, 0.91, v_alpha * 0.34);
}
`;

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

function program(gl: WebGLRenderingContext, fragment: string) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const frag = compile(gl, gl.FRAGMENT_SHADER, fragment);
  const result = gl.createProgram();
  if (!result) throw new Error('Could not create WebGL program.');
  gl.attachShader(result, vertex);
  gl.attachShader(result, frag);
  gl.linkProgram(result);
  gl.deleteShader(vertex);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(result, gl.LINK_STATUS)) {
    const detail = gl.getProgramInfoLog(result) || 'Unknown WebGL link error';
    gl.deleteProgram(result);
    throw new Error(detail);
  }
  return result;
}

function fibonacciSphere(count: number): Vec3[] {
  const points: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index / Math.max(1, count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * index;
    const jitter = 0.965 + ((index * 37) % 13) / 420;
    points.push([Math.cos(theta) * radius * jitter, y * jitter, Math.sin(theta) * radius * jitter]);
  }
  return points;
}

function dot(a: Vec3, b: Vec3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function buildEdges(nodes: Vec3[]) {
  const lineVertices: number[] = [];
  const used = new Set<string>();
  nodes.forEach((node, index) => {
    const candidates = nodes
      .map((other, otherIndex) => ({ other, otherIndex, similarity: dot(node, other) }))
      .filter(item => item.otherIndex !== index)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    candidates.forEach(item => {
      const a = Math.min(index, item.otherIndex);
      const b = Math.max(index, item.otherIndex);
      const key = `${a}-${b}`;
      if (used.has(key)) return;
      used.add(key);
      lineVertices.push(...nodes[a], ...nodes[b]);
    });
  });
  return new Float32Array(lineVertices);
}

function flatten(nodes: Vec3[]) {
  return new Float32Array(nodes.flatMap(point => point));
}

function sectionProgress(section: HTMLElement, vh: number) {
  const rect = section.getBoundingClientRect();
  return Math.max(0, Math.min(1, (vh * 0.82 - rect.top) / Math.max(1, rect.height + vh * 0.24)));
}

export default function SpatialNetworkField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return;

    let pointProgram: WebGLProgram;
    let lineProgram: WebGLProgram;
    try {
      pointProgram = program(gl, POINT_FRAGMENT);
      lineProgram = program(gl, LINE_FRAGMENT);
    } catch {
      return;
    }

    const nodes = fibonacciSphere(108);
    const nodeData = flatten(nodes);
    const edgeData = buildEdges(nodes);
    const nodeBuffer = gl.createBuffer();
    const edgeBuffer = gl.createBuffer();
    if (!nodeBuffer || !edgeBuffer) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, nodeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, nodeData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, edgeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, edgeData, gl.STATIC_DRAW);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetOpacity = 0;
    let opacity = 0;
    let networkProgress = 0;
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

    const updateVisibility = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-scrub]'));
      const network = sections[8];
      if (!network) {
        targetOpacity = 0;
        return;
      }
      const vh = window.innerHeight || 1;
      const rect = network.getBoundingClientRect();
      const center = vh * 0.5;
      const distance = Math.abs(rect.top + rect.height * 0.5 - center);
      const reach = Math.max(vh * 0.9, rect.height * 0.62);
      const proximity = Math.max(0, Math.min(1, 1 - distance / reach));
      networkProgress = sectionProgress(network, vh);
      targetOpacity = Math.pow(proximity, 1.45) * 0.92;

      const providerTop = document.getElementById('provider-details')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      if (providerTop < vh * 0.75) targetOpacity = 0;
    };

    const bindAndDraw = (renderProgram: WebGLProgram, buffer: WebGLBuffer, mode: number, count: number, pointSize: number, rotationX: number, rotationY: number, alpha: number) => {
      gl.useProgram(renderProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const position = gl.getAttribLocation(renderProgram, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
      gl.uniform2f(gl.getUniformLocation(renderProgram, 'u_rotation'), rotationX, rotationY);
      gl.uniform1f(gl.getUniformLocation(renderProgram, 'u_pointSize'), pointSize);
      gl.uniform1f(gl.getUniformLocation(renderProgram, 'u_opacity'), alpha);
      gl.drawArrays(mode, 0, count);
    };

    const draw = (now: number) => {
      const delta = Math.min(50, now - last);
      last = now;
      opacity += (targetOpacity - opacity) * Math.min(1, delta / 130);
      canvas.style.opacity = opacity.toFixed(3);

      if (opacity > 0.005) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        const time = reducedMotion ? 0 : now * 0.00012;
        const rotationX = time + networkProgress * 1.15 + pointerX * 0.22;
        const rotationY = -0.18 + Math.sin(time * 0.8) * 0.12 + pointerY * 0.12 + (networkProgress - 0.5) * 0.2;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);

        bindAndDraw(lineProgram, edgeBuffer, gl.LINES, edgeData.length / 3, 1, rotationX, rotationY, opacity);
        bindAndDraw(pointProgram, nodeBuffer, gl.POINTS, nodes.length, 4.6 * dpr, rotationX, rotationY, opacity);
      } else {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }

      frame = window.requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX / Math.max(1, window.innerWidth) - 0.5;
      pointerY = event.clientY / Math.max(1, window.innerHeight) - 0.5;
    };
    const onScroll = () => updateVisibility();
    const onResize = () => { resize(); updateVisibility(); };

    resize();
    updateVisibility();
    frame = window.requestAnimationFrame(draw);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.cancelAnimationFrame(frame);
      gl.deleteBuffer(nodeBuffer);
      gl.deleteBuffer(edgeBuffer);
      gl.deleteProgram(pointProgram);
      gl.deleteProgram(lineProgram);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
