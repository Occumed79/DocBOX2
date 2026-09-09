'use client';

import { useEffect, useRef } from 'react';
import ImmersiveStage, { type ImmersiveStageFrame } from './ImmersiveStage';
import styles from './CinematicWorld.module.css';

type GL = WebGLRenderingContext | WebGL2RenderingContext;

type WorldResources = {
  program: WebGLProgram;
  buffer: WebGLBuffer;
  positionLocation: number;
  uniforms: {
    time: WebGLUniformLocation | null;
    progress: WebGLUniformLocation | null;
    velocity: WebGLUniformLocation | null;
    pointer: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
    scene: WebGLUniformLocation | null;
    arrival: WebGLUniformLocation | null;
    portalFocus: WebGLUniformLocation | null;
  };
};

const VERTEX_100 = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_100 = `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_progress;
uniform float u_velocity;
uniform vec2 u_pointer;
uniform vec2 u_resolution;
uniform float u_scene;
uniform float u_arrival;
uniform float u_portalFocus;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec3 palette(float t) {
  vec3 a = vec3(0.03, 0.08, 0.12);
  vec3 b = vec3(0.16, 0.38, 0.58);
  vec3 c = vec3(0.44, 0.90, 1.00);
  vec3 d = vec3(0.18, 0.08, 0.32);
  float phase = u_scene * 0.071 + t;
  return a + b * 0.28 + c * (0.22 + 0.20 * sin(phase * 6.2831)) + d * (0.18 + 0.12 * cos(phase * 4.0));
}

float ring(vec2 p, vec2 center, float radius, float width) {
  float d = abs(length(p - center) - radius);
  return 1.0 - smoothstep(width, width * 2.4, d);
}

void main() {
  vec2 uv = v_uv - 0.5;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  uv.x *= aspect;

  float velocity = clamp(abs(u_velocity) / 1800.0, 0.0, 1.0);
  vec2 pointerWarp = u_pointer * vec2(0.045, 0.035);
  uv += pointerWarp * (0.35 + 0.65 * (1.0 - u_arrival));

  float travel = u_progress * 10.0 + u_time * 0.035;
  float radial = length(uv);
  float angle = atan(uv.y, uv.x);

  float tunnel = 0.0;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float z = fract(travel * 0.18 + fi * 0.142857);
    float radius = mix(0.04, 0.82, z);
    float width = mix(0.006, 0.018, z) + velocity * 0.012;
    tunnel += ring(uv, vec2(0.0), radius, width) * (1.0 - z) * 0.22;
  }

  vec2 gridUv = uv * mix(75.0, 125.0, velocity * 0.35);
  vec2 cell = floor(gridUv);
  vec2 local = fract(gridUv) - 0.5;
  float rnd = hash21(cell);
  float stars = step(0.986, rnd) * smoothstep(0.16, 0.0, length(local));
  stars *= 0.5 + 0.5 * sin(u_time * (1.5 + rnd * 2.4) + rnd * 40.0);

  float nebula = 0.0;
  vec2 nUv = uv * 1.4;
  for (int i = 0; i < 4; i++) {
    nebula += noise(nUv + vec2(u_time * 0.018, -u_time * 0.012)) / pow(2.0, float(i));
    nUv *= 2.07;
  }
  nebula *= smoothstep(1.15, 0.08, radial) * 0.20;

  float scenePulse = 0.5 + 0.5 * sin((u_scene + 1.0) * 0.83 + u_time * 0.22);
  vec3 color = palette(scenePulse) * (nebula + tunnel * 0.42);
  color += vec3(0.50, 0.88, 1.0) * stars * 0.85;

  if (u_arrival > 0.5) {
    float orbital = 0.0;
    float selected = 0.0;
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float theta = fi * 1.256637 + u_time * (0.085 + fi * 0.006);
      vec2 center = vec2(cos(theta), sin(theta) * 0.58) * (0.34 + 0.04 * sin(u_time * 0.22 + fi));
      float glow = smoothstep(0.115, 0.0, length(uv - center));
      float shell = ring(uv, center, 0.065, 0.008);
      float focus = 1.0 - step(0.25, abs(u_portalFocus - fi));
      orbital += shell * (0.28 + focus * 0.92) + glow * (0.035 + focus * 0.16);
      selected += focus * glow;
    }

    float orbitA = ring(vec2(uv.x, uv.y / 0.58), vec2(0.0), 0.40, 0.004);
    float orbitB = ring(vec2(uv.x, uv.y / 0.58), vec2(0.0), 0.29, 0.003);
    color += vec3(0.28, 0.82, 1.0) * (orbital + orbitA * 0.20 + orbitB * 0.12);
    color += vec3(0.62, 0.44, 1.0) * selected * 0.55;

    float body = smoothstep(0.11, 0.08, length(vec2(uv.x, uv.y + 0.02) / vec2(0.75, 1.25)));
    float helmet = smoothstep(0.072, 0.055, length(uv - vec2(0.0, 0.095)));
    float visor = smoothstep(0.055, 0.038, length((uv - vec2(0.0, 0.102)) / vec2(1.15, 0.72)));
    color += vec3(0.26, 0.62, 0.76) * body * 0.10;
    color += vec3(0.75, 0.95, 1.0) * helmet * 0.16;
    color -= vec3(0.08, 0.18, 0.24) * visor * 0.55;
  }

  float vignette = smoothstep(1.12, 0.20, radial);
  color *= vignette;
  color += vec3(0.02, 0.07, 0.10) * velocity * smoothstep(0.9, 0.0, radial) * 0.5;

  gl_FragColor = vec4(color, clamp(0.25 + tunnel * 0.4 + stars * 0.7 + u_arrival * 0.16, 0.0, 0.92));
}
`;

function compileShader(gl: GL, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create WebGL shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader) || 'Unknown WebGL shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(error);
  }
  return shader;
}

function createWorld(gl: GL): WorldResources {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_100);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_100);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create WebGL program.');
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program) || 'Unknown WebGL program link error.';
    gl.deleteProgram(program);
    throw new Error(error);
  }

  const buffer = gl.createBuffer();
  if (!buffer) throw new Error('Unable to create WebGL geometry buffer.');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  return {
    program,
    buffer,
    positionLocation,
    uniforms: {
      time: gl.getUniformLocation(program, 'u_time'),
      progress: gl.getUniformLocation(program, 'u_progress'),
      velocity: gl.getUniformLocation(program, 'u_velocity'),
      pointer: gl.getUniformLocation(program, 'u_pointer'),
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      scene: gl.getUniformLocation(program, 'u_scene'),
      arrival: gl.getUniformLocation(program, 'u_arrival'),
      portalFocus: gl.getUniformLocation(program, 'u_portalFocus'),
    },
  };
}

export default function CinematicWorld({ sceneIndex }: { sceneIndex: number }) {
  const resourcesRef = useRef<WorldResources | null>(null);
  const sceneRef = useRef(sceneIndex);
  const portalFocusRef = useRef(-1);

  useEffect(() => {
    sceneRef.current = sceneIndex;
  }, [sceneIndex]);

  useEffect(() => {
    const onPortalFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ index?: number }>).detail;
      portalFocusRef.current = typeof detail?.index === 'number' ? detail.index : -1;
    };
    window.addEventListener('docbox:portal-focus', onPortalFocus);
    return () => window.removeEventListener('docbox:portal-focus', onPortalFocus);
  }, []);

  const onReady = (gl: GL) => {
    const resources = createWorld(gl);
    resourcesRef.current = resources;
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return () => {
      gl.deleteBuffer(resources.buffer);
      gl.deleteProgram(resources.program);
      resourcesRef.current = null;
    };
  };

  const onFrame = (frame: ImmersiveStageFrame) => {
    const resources = resourcesRef.current;
    if (!resources) return;

    const { gl, canvas, elapsed, progress, scrollVelocity, pointer, reducedMotion } = frame;
    const arrival = sceneRef.current >= 11 ? 1 : 0;
    const time = reducedMotion ? 0 : elapsed;

    gl.useProgram(resources.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, resources.buffer);
    gl.enableVertexAttribArray(resources.positionLocation);
    gl.vertexAttribPointer(resources.positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(resources.uniforms.time, time);
    gl.uniform1f(resources.uniforms.progress, progress);
    gl.uniform1f(resources.uniforms.velocity, reducedMotion ? 0 : scrollVelocity);
    gl.uniform2f(resources.uniforms.pointer, reducedMotion ? 0 : pointer.x, reducedMotion ? 0 : pointer.y);
    gl.uniform2f(resources.uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(resources.uniforms.scene, Math.min(sceneRef.current, 10));
    gl.uniform1f(resources.uniforms.arrival, arrival);
    gl.uniform1f(resources.uniforms.portalFocus, portalFocusRef.current);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  return (
    <div data-cinematic-world aria-hidden="true">
      <ImmersiveStage className={styles.stage} clearColor={[0, 0, 0, 0]} onReady={onReady} onFrame={onFrame} />
    </div>
  );
}
