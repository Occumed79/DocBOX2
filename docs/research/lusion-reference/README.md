# Lusion portal-stage reference archive

This folder preserves the technical research gathered for the DocBOX2 cinematic portal landing / transition stage, using the Lusion `about` hero as a visual and interaction reference.

## Why this exists

The goal is not to copy the reference site verbatim. The goal is to preserve the mechanics we verified so the DocBOX2 implementation can reproduce the same *class of experience*: a small astronaut in a dark terrain world, a large suspended light/portal field, rising debris, GPU particles, volumetric-looking scattering, cinematic camera motion, selective hold-to-slow interaction, and screen-paint color/distortion effects.

## Verified renderer / scene facts

- Main renderer: Three.js r158 on WebGL 2.
- Context: `powerPreference: high-performance`, alpha off, browser antialias off, depth on.
- The smooth final image is therefore heavily post-processed instead of relying on native MSAA.
- Captured frames showed roughly 80 draw calls, about 120k triangles, and a persistent 24,576-point GPU particle population.
- The scene uses multiple offscreen render targets and ping-pong passes.
- The bloom implementation includes an FFT/convolution path rather than only a basic Gaussian bloom.
- A separate ScreenPaint system maintains a low-resolution persistent paint/velocity field used for distortion and color reveal.

## Major scene systems recovered

### Camera

`camera_spline.buf` contains 200 authored camera samples: position + quaternion orientation. Runtime interpolation uses normal position interpolation and quaternion SLERP.

- Samples 0-149: primary hero journey.
- Samples 150-199: secondary/panning continuation.
- Base camera FOV is 60 degrees.
- The hero applies a dolly-zoom FOV offset down to approximately -10 degrees, producing an effective ~50 degree lens during the retreat.
- Packed position bounds in the asset header:
  - X: -19.1331158 to 0
  - Y: 5.46889019 to 50
  - Z: -75.1132812 to -5

### Hold-to-slow interaction

The About hero smooths a `freezeRatio` toward the current mouse-down state with a 0.1 easing factor. The hero delta is then mixed from normal speed to 10% speed.

Important: the slowdown is selective.

Slowed delta drives systems including:

- moving light
- light field
- hero particles
- rocks
- astronaut/person
- fog
- halo
- hero clock

Some UI/HUD/faces/letters and other supporting systems continue using normal delta. That selective split is why the effect feels like the world is suspended rather than the whole page simply changing playback rate.

### Moving light + volumetric-looking scatter

The main light center is around `[0, 8, 0]`.

The scatter source is a vertical line segment:

- top: `[0, 18, 0]`
- bottom: `[0, 0, 0]`
- divider/shaping values: `[1.1, 5.5]`

This is a key reason the wide shot reads as a tall luminous shaft instead of just a glowing point light.

### 3D light field

`AboutHeroLightField` uses a 64 x 64 x 64 logical grid. The slices are packed into a 2D atlas and blended across frames. The system is centered around the moving light and is updated through offscreen render targets.

### GPU particle simulation

The hero particle population is 24,576. The simulation keeps particle position/life in textures and updates them continuously using noise/curl-like motion around the moving light.

The particle field is not only decorative; it participates in the luminous/light-field look.

### Rocks / debris

`AboutHeroRocks` uses:

- 16 logical rock pieces
- 120 animation frames
- 60 FPS source animation timing
- 64 instances on desktop, 48 on mobile
- four rock mesh families / texture channels

The rocks are instanced and animated procedurally/data-texture driven rather than as hundreds of independent Three.js objects.

### Astronaut/person

`person.buf`:

- 2,666 vertices
- 11,952 indices
- 3,984 triangles
- 54-bone skinning
- two bone influences per vertex

`person_idle.buf`:

- 4,590 animation transforms
- 54 bones
- 85 animation frames

The hero advances the person animation at half delta, giving an effective ~30 animation frames/second and an idle loop around 2.83 seconds.

### Terrain

`terrain.buf`:

- 13,872 vertices
- 80,238 indices
- 26,746 triangles

The ground shader combines terrain texture data, height-derived normal perturbation, shadows, moving-light contribution, fog, scattering and blue-noise/dithering.

### Terrain lines

`terrain_lines.buf` contains 11,832 authored points. The production source splits those points using 41 cumulative thresholds and constructs three-sided procedural tube/ribbon geometry from them. The result is animated illuminated path geometry rather than a flat line texture.

### Atmospheric box

`bg_box.buf` is deliberately simple geometry:

- 8 vertices
- 30 indices
- 10 triangles

Its packed bounds are huge, approximately:

- X: -187.141113 to 267.05072
- Y: -1.01878357 to 998.981201
- Z: -200 to 65.39666

It serves the large atmospheric/halo/scattering treatment around the hero.

### ScreenPaint mouse-color system

The color-reveal effect is a persistent GPU paint field, not a DOM hover color.

Verified behavior:

1. A low-resolution paint texture stores motion/weight information.
2. Mouse movement writes a segment from previous position to current position.
3. Velocity is injected into the field.
4. Curl/noise advects the stored field.
5. Different channels decay at different rates.
6. Dark geometry samples the paint texture.
7. A repeating gradient texture converts the paint state into vivid color.
8. Edge geometry responds more strongly than base geometry.

Captured values included:

- push strength: 25
- dissipation vector: ~0.975 / 0.95 / 0.80 in the captured state
- curl scale: ~0.02
- curl strength: 3
- paint texture: quarter-resolution (308 x 332 while the main canvas was 1232 x 1328)
- color/distortion pass: amount 3, RGB shift 0.5, multiplier 5, color multiplier 10, shade 1.25

### Bloom / halo / post

The captured renderer uses multiple render targets and a convolution/FFT bloom path. The halo path exposes controls such as width, RGB separation, strength and inner/outer masks. ScreenPaint is also used later for directional scene distortion/smearing.

## DocBOX2 translation

For the DocBOX2 portal landing, preserve the mechanics rather than the exact source design:

1. dark sculpted terrain / void
2. small astronaut in the lower composition
3. floating portal/light constellation above
4. active portal produces a vertical scattering shaft / ground pool
5. instanced rocks/debris rise and orbit near the active portal
6. GPU particles move through the light volume
7. subtle astronaut idle/head-tracking response
8. pointer hold eases the world toward ~10% simulation speed
9. supporting UI remains responsive during slow mode
10. ScreenPaint-style mouse field can be reused selectively for color/distortion transitions
11. camera movement should be spline-driven and cinematic, including lens/FOV choreography
12. avoid allocating render targets/materials every frame; initialize and reuse GPU resources

## Files in this research folder

- `README.md` — this overview.
- `scene-architecture.md` — implementation-focused rendering/choreography notes.
- `artifacts-manifest.md` — exact local artifact names, sizes and SHA-256 hashes.
- `implementation-parameters.json` — machine-readable recovered measurements.

## Raw artifact note

The raw Lusion captures, site bundle, screenshots and binary reference assets are **not committed into this public repository**. Their exact names, byte sizes and SHA-256 hashes are preserved in `artifacts-manifest.md`, so the local research package can be verified/reconnected later without losing provenance. If the repository is made private, the raw package can be archived there separately.