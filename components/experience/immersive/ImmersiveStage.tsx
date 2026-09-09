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

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext('webgl2', {
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }) ||
      canvas.getContext('webgl', {
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });

    if (!gl) {
      canvas.dataset.webgl = 'unsupported';
      return;
    }

    canvas.dataset.webgl = 'ready';
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
      gl.viewport(0, 0, pixelWidth, pixelHeight);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    cleanupScene = onReadyRef.current?.(gl, canvas);

    const render = (now: number) => {
      if (disposed) return;
      const frame = runtime.step(now);

      const [r, g, b, a] = clearColor;
      gl.clearColor(r, g, b, a);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      onFrameRef.current?.({ ...frame, gl, canvas });
      animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      runtime.destroy();
      if (typeof cleanupScene === 'function') cleanupScene();

      const loseContext = gl.getExtension('WEBGL_lose_context');
      loseContext?.loseContext();
    };
  }, [clearColor]);

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
