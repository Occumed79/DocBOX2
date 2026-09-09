export type QualityTier = 'low' | 'medium' | 'high';

export type PointerState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
};

export type ViewportState = {
  width: number;
  height: number;
  dpr: number;
};

export type ImmersiveFrame = {
  now: number;
  delta: number;
  elapsed: number;
  scrollY: number;
  smoothScrollY: number;
  scrollVelocity: number;
  progress: number;
  pointer: PointerState;
  viewport: ViewportState;
  quality: QualityTier;
  reducedMotion: boolean;
};

export type SceneProgress = {
  progress: number;
  distanceFromCenter: number;
  visible: boolean;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const damp = (current: number, target: number, lambda: number, delta: number) =>
  target + (current - target) * Math.exp(-lambda * delta);

function pickQualityTier(width: number, dpr: number): QualityTier {
  if (typeof navigator === 'undefined') return 'medium';
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = navigator.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;

  if (width < 720 || cores <= 4 || memory <= 4) return 'low';
  if (dpr > 2 || cores <= 8 || memory <= 8) return 'medium';
  return 'high';
}

export function getSceneProgress(element: HTMLElement, viewportHeight: number): SceneProgress {
  const rect = element.getBoundingClientRect();
  const center = rect.top + rect.height * 0.5;
  const viewportCenter = viewportHeight * 0.5;
  const travel = Math.max(rect.height - viewportHeight, viewportHeight * 0.45);
  const progress = clamp((viewportCenter - rect.top) / travel);
  const distanceFromCenter = Math.abs(center - viewportCenter);
  const visible = rect.bottom > 0 && rect.top < viewportHeight;

  return { progress, distanceFromCenter, visible };
}

export type ImmersiveRuntime = {
  step: (now: number) => ImmersiveFrame;
  resize: () => ViewportState;
  destroy: () => void;
};

export function createImmersiveRuntime(): ImmersiveRuntime {
  let startedAt = performance.now();
  let previousNow = startedAt;
  let previousScroll = window.scrollY;
  let smoothScroll = window.scrollY;
  let scrollVelocity = 0;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pointer: PointerState = { x: 0, y: 0, vx: 0, vy: 0, active: false };
  let targetPointerX = 0;
  let targetPointerY = 0;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const onPointerMove = (event: PointerEvent) => {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    targetPointerX = (event.clientX / width) * 2 - 1;
    targetPointerY = -((event.clientY / height) * 2 - 1);
    pointer.active = true;
  };

  const onPointerLeave = () => {
    targetPointerX = 0;
    targetPointerY = 0;
    pointer.active = false;
  };

  const onMotionChange = (event: MediaQueryListEvent) => {
    reducedMotion = event.matches;
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave, { passive: true });
  motionQuery.addEventListener('change', onMotionChange);

  const resize = (): ViewportState => {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    const dpr = Math.min(window.devicePixelRatio || 1, width < 720 ? 1.5 : 2);
    return { width, height, dpr };
  };

  const step = (now: number): ImmersiveFrame => {
    const delta = clamp((now - previousNow) / 1000, 0, 0.1);
    previousNow = now;

    const scrollY = window.scrollY;
    const rawVelocity = delta > 0 ? (scrollY - previousScroll) / delta : 0;
    previousScroll = scrollY;

    smoothScroll = damp(smoothScroll, scrollY, reducedMotion ? 30 : 10, delta);
    scrollVelocity = damp(scrollVelocity, rawVelocity, reducedMotion ? 30 : 8, delta);

    const oldPointerX = pointer.x;
    const oldPointerY = pointer.y;
    pointer.x = damp(pointer.x, targetPointerX, reducedMotion ? 30 : 12, delta);
    pointer.y = damp(pointer.y, targetPointerY, reducedMotion ? 30 : 12, delta);
    pointer.vx = delta > 0 ? (pointer.x - oldPointerX) / delta : 0;
    pointer.vy = delta > 0 ? (pointer.y - oldPointerY) / delta : 0;

    const viewport = resize();
    const maxScroll = Math.max(document.documentElement.scrollHeight - viewport.height, 1);
    const progress = clamp(scrollY / maxScroll);

    return {
      now,
      delta,
      elapsed: (now - startedAt) / 1000,
      scrollY,
      smoothScrollY: smoothScroll,
      scrollVelocity,
      progress,
      pointer: { ...pointer },
      viewport,
      quality: pickQualityTier(viewport.width, viewport.dpr),
      reducedMotion,
    };
  };

  const destroy = () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerleave', onPointerLeave);
    motionQuery.removeEventListener('change', onMotionChange);
  };

  return { step, resize, destroy };
}
