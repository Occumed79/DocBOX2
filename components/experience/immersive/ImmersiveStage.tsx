'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { createImmersiveRuntime, type ImmersiveFrame } from './runtime';

export type ImmersiveStageFrame = ImmersiveFrame & {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
};

export type ImmersiveStageProps = {
  className?: string;
  interactive?: boolean;
  clearColor?: [number, number, number, number];
  onReady?: (gl: WebGLRenderingContext | WebGL2RenderingContext, canvas: HTMLCanvasElement) => void | (() => void);
  onFrame?: (frame: ImmersiveStageFrame) => void;
};

export default function ImmersiveStage({
  className,
  interactive = false,
  clearColor = [0.01, 0.025, 0.04, 1],
  onReady,
  onFrame,
}: ImmersiveStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onFrameRef = useRef(onFrame);
  const onReadyRef = useRef(onReady);
  const clearColorRef = useRef(clearColor);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    clearColorRef.current = clearColor;
  }, [clearColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // The shared scene shaders intentionally target GLSL ES 1.00 so that the
    // cinematic layer reaches older phones and embedded browsers as well as
    // current desktop GPUs. WebGL2-specific worlds can be introduced later
    // behind their own renderer without changing this persistent stage.
    const renderContext = canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    if (!renderContext) {
      canvas.dataset.webgl = 'unsupported';
      return;
    }

    canvas.dataset.webgl = 'ready';
    canvas.dataset.webglMode = 'webgl1';
    const runtime = createImmersiveRuntime();
    let cleanupScene: void | (() => void);
    let animationFrame = 0;
    let disposed = false;

    const resize = () => {
      const viewport = runtime.resize();
      const pixelWidth = Math.max(1, Math.floor(viewport.width * viewport.dpr));
      const pixelHeight = Math.max(1, Math.floor(viewport.height * viewport.dpr));

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      renderContext.viewport(0, 0, pixelWidth, pixelHeight);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    cleanupScene = onReadyRef.current?.(renderContext, canvas);

    const render = (now: number) => {
      if (disposed) return;
      const frame = runtime.step(now);

      const [r, g, b, a] = clearColorRef.current;
      renderContext.clearColor(r, g, b, a);
      renderContext.clear(renderContext.COLOR_BUFFER_BIT | renderContext.DEPTH_BUFFER_BIT);

      onFrameRef.current?.({ ...frame, gl: renderContext, canvas });
      animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      runtime.destroy();
      if (typeof cleanupScene === 'function') cleanupScene();

      const loseContext = renderContext.getExtension('WEBGL_lose_context');
      loseContext?.loseContext();
    };
  }, []);

  const style = {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100svh',
    pointerEvents: interactive ? 'auto' : 'none',
    zIndex: 0,
  } satisfies CSSProperties;

  return <canvas ref={canvasRef} className={className} style={style} aria-hidden="true" />;
}
