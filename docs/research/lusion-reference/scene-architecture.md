# Lusion About Hero — scene architecture notes

These notes preserve the implementation mechanics recovered from the reference scene for use in DocBOX2. They intentionally summarize behavior rather than copying the production source.

## 1. Render architecture

The scene is not a single `renderer.render(scene, camera)` pass. It is a layered WebGL pipeline with reusable render targets.

Conceptual order:

1. update world clocks / interaction ratios
2. update moving light
3. update GPU particle simulation
4. update sliced light field
5. update instanced rocks/debris
6. update astronaut/person animation
7. update fog / halo / ground / authored terrain lines
8. render motion / prepass information
9. render the main scene into offscreen targets
10. apply ScreenPaint-derived distortion
11. apply halo / color separation
12. apply bloom / convolution
13. composite to the final canvas

The reference renderer reuses buffers, textures, programs and render targets across frames. Captured frames reported zero frame-local creation for buffers, renderbuffers, textures and programs.

## 2. Main AboutHero timing model

The hero keeps two important notions of time:

- normal page/frame delta
- slowed hero delta

Mouse hold moves `freezeRatio` toward the active state with exponential-like smoothing (`0.1` response per frame). The slowed hero delta interpolates from `1.0x` to `0.1x` normal delta.

This slowed delta is used by the cinematic world systems. Several UI/HUD systems continue on normal delta.

### Practical DocBOX rule

Do not globally change requestAnimationFrame timing or CSS playback rate.

Instead maintain:

- `realDelta`
- `worldDelta = realDelta * mix(1.0, 0.1, freezeRatio)`

Use `worldDelta` only for world-suspension systems. Keep navigation, cursor response, portal hover labels and UI transitions on `realDelta`.

## 3. Camera choreography

The reference camera is driven from authored samples rather than ad-hoc scroll transforms.

Recovered asset:

- 200 position/quaternion samples
- first 150 samples are the primary hero journey
- final 50 samples form a secondary/panning continuation

Runtime sampling uses fractional sample indices, linear interpolation for position and quaternion SLERP for orientation.

Base camera lens: 60 degrees.

A dolly-zoom offset reaches approximately -10 degrees during the main approach/retreat window, giving an effective lens close to 50 degrees.

### Captured choreography characteristics

The hero moves from a wide, distant framing toward the light volume, penetrates the scene, gates some solid geometry away near the closest point, then re-establishes a wide retreat. The retreat changes both camera position and lens, which is why the scene feels cinematic rather than like a simple zoom.

### DocBOX translation

Author portal-stage camera keyframes/spline samples and interpolate them in 3D. Do not approximate the sequence with only CSS scale or a linear Z move.

Recommended stages:

1. distant reveal — astronaut small, portal field high above
2. approach — active portal grows, terrain parallax increases
3. penetration — camera enters light/debris volume
4. transition threshold — nonessential geometry fades/gates away
5. portal fill — active portal/light fills frame
6. destination transition — route-specific transition takes over

## 4. Light + scatter model

Recovered central light position:

- `[0, 8, 0]`

Recovered scatter line endpoints:

- `[0, 18, 0]`
- `[0, 0, 0]`

Recovered scatter divider:

- `[1.1, 5.5]`

The important design lesson is that the visible beam is treated as a line/volume, not as a single point source with bloom.

### DocBOX translation

Each active portal can expose:

- portal core position
- vertical or angled scatter segment
- ground contact / pool
- local particle attraction region
- debris force/orbit center

The inactive portals can remain much dimmer and should not all produce full shafts simultaneously.

## 5. Light field

The reference `AboutHeroLightField` uses:

- logical grid: 64 x 64 x 64
- volume width seed: 8 world units
- slice atlas packed into a 2D render target
- current / previous / drawn slice targets
- temporal blending between frames

This is a compact way to give scene objects access to a persistent 3D-ish light density representation without raymarching a full high-resolution 3D volume every frame.

### DocBOX translation

A literal clone is optional. Similar perception can be achieved with one of:

- a lower-resolution 3D texture / sliced atlas
- depth-aware cone/volume meshes
- screen-space scattering combined with world-space particle density

The important part is that debris/particles feel embedded in the luminous volume rather than simply layered over it.

## 6. Particle system

Captured particle population: 24,576.

The simulation stores particle position/life in textures and continuously updates them around the moving light using procedural noise/curl-like motion.

The 24,576 population appears repeatedly across simulation and render passes, confirming that the same logical particle field is reused through several stages.

### DocBOX translation

Use GPU-friendly simulation/data textures or instanced particles. Avoid one React/Three object per particle.

Portal behavior can be:

- low-level drift while idle
- increasing orbit/attraction around hovered portal
- stronger vertical lift near active portal
- slower worldDelta while mouse is held

## 7. Rocks / debris

Reference values:

- 16 logical rock pieces
- 120 animation frames
- 60 FPS source animation timing
- 64 instances desktop
- 48 instances mobile
- 4 mesh/channel families

Each family is instanced. Animation data is stored in textures rather than animated as independent object timelines.

### DocBOX translation

Use a small set of low-poly rock/debris meshes with instancing. Give each instance seeded values for:

- radial offset
- vertical offset
- spin axis
- phase
- scale
- lift speed
- portal affinity

When slow mode is active, advance them with `worldDelta`.

## 8. Astronaut/person

Recovered mesh:

- 2,666 vertices
- 3,984 triangles
- 54 bones
- 2 influences per vertex

Recovered idle animation:

- 85 frames
- 54 bones
- effective playback near 30 animation frames/second because the hero advances the animation at half delta
- approximate idle-loop duration: 2.83 seconds

### DocBOX translation

The astronaut should not be rigid. Even minimal skeletal or procedural motion is enough:

- breathing / torso drift
- subtle weight shift
- head/helmet orientation toward active portal
- slight reaction when a portal is selected

## 9. Terrain and terrain-line geometry

Main terrain:

- 13,872 vertices
- 80,238 indices
- 26,746 triangles

Terrain-line source:

- 11,832 authored points
- 41 source line groups recovered from cumulative thresholds
- runtime expands each path into a three-sided tube/ribbon

The terrain shader combines texture channels, height-derived normal detail, moving-light contribution, fog, shadow/scatter and blue-noise/dither.

### DocBOX translation

The terrain should remain visually subordinate to the portals. Use enough geometry for silhouette, parallax and light response, but allow darkness to hide detail outside the active lighting volume.

## 10. ScreenPaint interaction field

The reference ScreenPaint system is a persistent GPU feedback simulation.

Per-frame flow:

1. swap current/previous paint render targets
2. derive pointer movement distance
3. map movement distance to brush radius
4. create a line segment from previous to current pointer position
5. inject velocity along that segment
6. advect previous data using stored velocity
7. add procedural curl/noise
8. apply channel-specific dissipation
9. write next paint state
10. downsample/blur for later distortion/color use

Reference configuration recovered from the production class and capture:

- quarter-resolution main paint target
- one-eighth-resolution low target
- push strength: 25
- captured curl scale: ~0.02
- captured curl strength: 3
- captured dissipation state: ~0.975 / 0.95 / 0.80

The color-reveal shader samples this paint field, derives a hue coordinate and samples a repeating gradient texture. Edge geometry is given a stronger paint response than the base geometry.

### DocBOX translation

This is useful for:

- portal-edge color reveals
- transition-surface illumination
- mouse-driven energy trails
- temporary color blooming over otherwise dark geometry

Do not treat it as a CSS hover state. It should be a persistent field that lingers and decays.

## 11. Distortion / RGB separation

Captured post values in the color-interaction section:

- amount: 3
- RGB shift: 0.5
- multiplier: 5
- color multiplier: 10
- shade: 1.25

A later distortion pass samples the ScreenPaint field to smear/distort scene pixels and introduce RGB separation.

For DocBOX, keep this restrained outside transitions. It should read as spatial energy, not constant glitching.

## 12. Bloom / halo

The reference Bloom class includes an FFT/convolution path and reusable half-float render targets.

Default/reference-class controls include:

- amount
- radius
- threshold
- smooth width
- halo width
- halo RGB shift
- halo strength
- inner/outer halo masks

Captured frames showed repeated ping-pong FFT subtransform sizes stepping through powers of two.

### DocBOX translation

The portal cores should bloom broadly but retain a defined center. Avoid pure neon outlines. Use bloom/halo as atmosphere around a physically readable light source.

## 13. Performance rules to carry forward

- WebGL 2 path.
- Prefer instancing for debris and repeated geometry.
- Prefer data textures / GPU simulation for large particle populations.
- Reuse materials, buffers and render targets.
- Avoid per-frame object creation.
- Keep paint/distortion buffers below full resolution.
- Keep browser MSAA optional/off if post-processing already provides the final smoothing.
- Maintain a reduced mobile instance/quality path.

## 14. Fidelity priorities for DocBOX

Highest priority:

1. monumental composition: tiny astronaut + huge dark world + luminous portal field
2. camera spline and lens choreography
3. active-portal vertical light/scatter volume
4. rising instanced debris
5. particles embedded in the light volume
6. selective hold-to-slow behavior
7. restrained atmospheric bloom/fog
8. persistent ScreenPaint-style mouse energy

Lower priority:

- exact mesh topology of the reference terrain
- exact third-party shader implementation
- exact original textures/assets

The DocBOX scene should be its own environment while preserving the verified interaction grammar.