'use client';

import { useEffect, useRef } from 'react';
import styles from './CinematicHandoff.module.css';

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function findHandoffSection() {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find(section =>
    Boolean(section.querySelector('a[href="#provider-details"]'))
  ) ?? null;
}

export default function CinematicHandoff() {
  const bridgeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bridge = bridgeRef.current;
    if (!bridge) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    const update = () => {
      frame = 0;
      const handoff = findHandoffSection();
      const provider = document.getElementById('provider-details');
      if (!handoff || !provider) {
        bridge.style.setProperty('--bridge-alpha', '0');
        return;
      }

      const vh = Math.max(1, window.innerHeight);
      const handoffRect = handoff.getBoundingClientRect();
      const providerRect = provider.getBoundingClientRect();

      const progress = clamp((vh * 0.82 - handoffRect.top) / Math.max(vh * 0.9, handoffRect.height * 0.86));
      const entry = clamp((vh * 0.94 - handoffRect.top) / (vh * 0.56));
      const exit = clamp((providerRect.top - vh * 0.04) / (vh * 0.62));
      const alpha = entry * exit;

      bridge.style.setProperty('--bridge', progress.toFixed(4));
      bridge.style.setProperty('--bridge-alpha', alpha.toFixed(4));
      bridge.style.setProperty('--bridge-reveal', clamp((progress - 0.12) / 0.72).toFixed(4));
      bridge.style.setProperty('--bridge-finish', clamp((progress - 0.72) / 0.28).toFixed(4));
    };

    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);

    if (!reducedMotion) {
      const onPointerMove = (event: PointerEvent) => {
        bridge.style.setProperty('--bridge-pointer-x', `${(event.clientX / Math.max(1, window.innerWidth)) * 100}%`);
        bridge.style.setProperty('--bridge-pointer-y', `${(event.clientY / Math.max(1, window.innerHeight)) * 100}%`);
      };
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      return () => {
        window.removeEventListener('scroll', queue);
        window.removeEventListener('resize', queue);
        window.removeEventListener('pointermove', onPointerMove);
        if (frame) window.cancelAnimationFrame(frame);
      };
    }

    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={bridgeRef} className={styles.bridge} aria-hidden="true">
      <div className={styles.curtainLeft} />
      <div className={styles.curtainRight} />
      <div className={styles.glow} />
      <div className={styles.seam} />

      <div className={styles.transitionLabel}>
        <span>FROM</span>
        <strong>STORY</strong>
        <i>→</i>
        <strong>PARTNERSHIP</strong>
      </div>

      <div className={styles.rail}>
        <div className={styles.railLine}><i /></div>
        <div className={styles.step}><span>01</span><strong>Specialty</strong></div>
        <div className={styles.step}><span>02</span><strong>Capabilities</strong></div>
        <div className={styles.step}><span>03</span><strong>Locations</strong></div>
        <div className={styles.step}><span>04</span><strong>Rates &amp; terms</strong></div>
      </div>

      <div className={styles.cornerLeft}>OCCU-MED / PROVIDER NETWORK</div>
      <div className={styles.cornerRight}>THE PRACTICAL WORK BEGINS</div>
    </div>
  );
}
