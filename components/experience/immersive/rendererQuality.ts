import * as THREE from 'three';

export type RendererQualityOptions = {
  exposure?: number;
  dprCap?: number;
};

export function configureCinematicRenderer(
  renderer: THREE.WebGLRenderer,
  { exposure = 1, dprCap = 2 }: RendererQualityOptions = {},
) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.sortObjects = true;
  return renderer;
}
