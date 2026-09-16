# Raw research artifact manifest

This manifest records the local files gathered during the Lusion reference investigation. It exists so the raw package can be verified and reattached later without losing provenance.

The raw third-party site bundle/assets are not committed to this public repository. Their filenames, sizes and SHA-256 hashes are preserved here.

## Primary archive

| File | Bytes | SHA-256 |
|---|---:|---|
| `lusion.co.zip` | 31,546,423 | `2dd519e1215e598cc17f32004b0aceba97eff3545a1d427112900d65cd72b552` |

## Recovered binary reference assets

| File | Bytes | SHA-256 | Recovered header summary |
|---|---:|---|---|
| `bg_box.buf` | 454 | `2c2b4afd860eed3215af1afbed279e714cc1f452be189c9be6c63b173dee422f` | 8 vertices, 30 indices, mesh |
| `camera_spline.buf` | 4,784 | `80249a7d29069e6f31d8cd9669273ceb292d8ed14d375a2ae76bbdb0cbe5c64a` | 200 points; position + quaternion orientation |
| `letter_placements.buf` | 2,272 | `3444250a0ce1bbb285ebc6f2a50dfefbc82c7f82b1994919e1b46a040bf07650` | 196 points; position, density, depth-of-field value |
| `logo_text.buf` | 22,748 | `18a123ef46422bb3b67321d255ea8da3da98cd9b1c317ee94ec6209555863f5b` | 1,400 vertices, 6,270 indices |
| `person.buf` | 86,170 | `0b5d623b78d3000d2dae46b014eeee6aef27effe7283aafd7b25bfd13eaa72e3` | 2,666 vertices, 11,952 indices; skinned person mesh |
| `person_idle.buf` | 101,372 | `c1efc427813a116f1a7c4f2ab2689972e04e6be8a0cb6a277de04831f9f92945` | 4,590 animation samples; position + quaternion orientation |
| `terrain.buf` | 396,996 | `44018abc47fa75ac5e78795528406b07300d7d6981abcbe7ebb640bff6e25052` | 13,872 vertices, 80,238 indices |
| `terrain_lines.buf` | 71,276 | `ea3800cbe1090f3381aa26d863fbd6abbc680d5e778e2f4077691faf2a093754` | 11,832 points |

## Spector/WebGL captures

| File | Bytes | SHA-256 |
|---|---:|---|
| `capture 19_09_24.json` | 6,803,293 | `29d5a8eda8310668303da59ffc21e68cb5b7fc5aa597295cb34a68319064c07b` |
| `capture 19_35_02.json` | 5,904,737 | `1d76cb7d222f7e47fb04431eecb20f409a4efdd782a9c25804ff6055565c84f6` |
| `capture 19_40_01 (2).json` | 6,212,477 | `4c5770c65b9c3c0ff11dc1090cde3c94d3965037fb46d9eed56a05101cda88dd` |
| `capture 19_42_17.json` | 6,481,843 | `35291cdc4b5687fae0b3641214d890a1f9f9e4531560cc7f5437498f5970b99d` |
| `capture 19_42_17 (1).json` | 6,481,843 | `35291cdc4b5687fae0b3641214d890a1f9f9e4531560cc7f5437498f5970b99d` |
| `capture 19_43_14.json` | 6,638,185 | `2379e51c7fc8b3a6ac57e6ba688f6fa2ee6b5eaa7ffb1eba9a84d531aec0a34a` |
| `capture 19_43_58.json` | 7,468,564 | `be0ec7c7c536e1b0bd2442c3993a51be4d0e7169c783e695303ba427b4987b65` |
| `capture 19_45_19.json` | 7,479,986 | `016076502176c02d03756371c7bf8d70289ae6dec13f9c9fc2eb5901d5da5ffc` |
| `capture 19_46_24.json` | 7,816,502 | `cdbb5df08d0ebd7a65e2bbe72283079ec940afadeb6a78f78b2f6e4823f94137` |
| `capture 19_47_32.json` | 6,434,169 | `93a9007f0bdf64915538922ab5de627ee5cec108956fc34daf3f607b354cb93c` |
| `capture 19_48_43.json` | 5,727,224 | `93ed8cec387112d1b33f38a5a4215b3a95701c5cea99e0efb1727f7c982e590b` |
| `capture 19_49_55.json` | 5,048,652 | `3602dc66b0916141796144747b6b34474ea6e030e762992f5ac90326b8b31471` |
| `capture 19_55_25.json` | 862,576 | `bc0fa314c3cd68a006944c1331baeb985560ac21b466227912210f5c8d4d54af` |
| `capture 19_55_25 (2).json` | 862,576 | `bc0fa314c3cd68a006944c1331baeb985560ac21b466227912210f5c8d4d54af` |

### Confirmed duplicates

- `capture 19_42_17.json` and `capture 19_42_17 (1).json` are byte-identical.
- `capture 19_55_25.json` and `capture 19_55_25 (2).json` are byte-identical.

## DevTools / interaction probes

| File | Bytes | SHA-256 |
|---|---:|---|
| `lusion-devtools-canvas-full.json` | 7,407,469 | `2e50c4825dd895b75881a420dd58adaec26d84e360a4244ed8c3db91fc7e6776` |
| `lusion-mouse-color-probe.json` | 921,210 | `09e0d54c897f9d3ecd444f47ce64d78ececef779b2c3228dcee704e85d327ef6` |

## `.buf` container format recovered

Each `.buf` file begins with:

1. 32-bit little-endian JSON header length
2. UTF-8 JSON header describing `vertexCount`, `indexCount`, attributes, component sizes, typed-array storage and packing ranges
3. packed binary attribute data

The headers decode cleanly and account for the expected file contents.

### Recovered packed bounds

#### `camera_spline.buf`

- X from `-19.1331158`, delta `19.1331158`
- Y from `5.46889019`, delta `44.53110981`
- Z from `-75.1132812`, delta `70.1132812`

#### `terrain.buf`

- X from `-37.4282227`, delta `90.8383599`
- Y from `-1.01878357`, delta `20.46981237`
- Z from `-26.8102531`, delta `92.206913`

#### `terrain_lines.buf`

- X from `-63.2222748`, delta `121.3617096`
- Y from `1`, delta `18`
- Z from `-24.5342274`, delta `116.0014668`

#### `bg_box.buf`

- X from `-187.141113`, delta `454.191833`
- Y from `-1.01878357`, delta `999.99998457`
- Z from `-200`, delta `265.3966599`

## Screenshot/reference captures present in the local research package

The local package also contained screenshots captured during the interaction study, including the wide astronaut/light composition and DevTools/Spector views. Those images are not duplicated in this public repository; the implementation notes preserve the useful recovered measurements and behavior.

## Verification command

When the raw archive is available locally, verify a file with:

```bash
shasum -a 256 <filename>
```

The output should match the corresponding value above.