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

export function tryCreateCinematicRenderer(
  parameters: THREE.WebGLRendererParameters = {},
  options: RendererQualityOptions = {},
) {
  try {
    return configureCinematicRenderer(new THREE.WebGLRenderer(parameters), options);
  } catch (error) {
    console.warn('WebGL is unavailable; continuing with the accessible HTML experience.', error);
    return null;
  }
}
