# Third-Party Reference Notices

## Lusion Ltd — WebGL-Scroll-Sync

DocBOX2's immersive runtime architecture was informed by Lusion Ltd's official `WebGL-Scroll-Sync` reference implementation.

Upstream repository:

`https://github.com/lusionltd/WebGL-Scroll-Sync`

License: MIT

Copyright (c) 2025 Lusion Ltd

The DocBOX2 implementation is a React/Next-oriented rewrite of the architectural ideas (persistent WebGL surface, DOM/render synchronization, rAF scroll state, velocity-driven render response and viewport culling), not a verbatim copy of the upstream source.

The upstream MIT license permits use, modification and distribution subject to preservation of its copyright and permission notice in copies or substantial portions of the software.

## ORYZO-1

Lusion Ltd also publishes the ORYZO-1 model family at:

`https://github.com/lusionltd/ORYZO-1`

That repository is MIT licensed and is referenced as technical evidence for the real-time 3D production workflow behind Oryzo AI. No ORYZO model file is currently bundled into DocBOX2.

## Other visual references

Zero Tech, the current Lusion studio website, Nasdaq 50th Anniversary, and Protecting Blue Corridors are used as visual/interaction references only. Their proprietary production assets and source bundles are not vendored into DocBOX2. Their public behavior has been re-specified into clean-room implementation requirements in `docs/reference-sites-extraction.md` and `docs/reference-source-map.md`.
