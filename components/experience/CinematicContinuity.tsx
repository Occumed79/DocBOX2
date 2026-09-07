'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './CinematicContinuity.module.css';

const CHAPTERS = ['Origin', 'History', 'Archive', 'Problem', 'Method', 'Referral', 'Clinical', 'Work', 'Network', 'Values', 'Partner'] as const;

type AutoKey = 'history' | 'process' | 'clinical' | 'workforce' | 'values';

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function sceneProgress(section: HTMLElement, viewportHeight: number) {
  const rect = section.getBoundingClientRect();
  return clamp((viewportHeight * 0.72 - rect.top) / Math.max(1, rect.height + viewportHeight * 0.2));
}

function findValuesSection() {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find(section =>
    Array.from(section.querySelectorAll('button strong')).some(node => node.textContent?.trim() === 'Humility')
  ) ?? null;
}

function findHandoffSection() {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find(section =>
    Boolean(section.querySelector('a[href="#provider-details"]'))
  ) ?? null;
}

function storySections() {
  const base = Array.from(document.querySelectorAll<HTMLElement>('section[data-scrub]'));
  const values = findValuesSection();
  const handoff = findHandoffSection();
  return [...base, ...(values ? [values] : []), ...(handoff ? [handoff] : [])];
}

export default function CinematicContinuity() {
  const [activeChapter, setActiveChapter] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const lastAuto = useRef<Record<AutoKey, number>>({ history: -1, process: -1, clinical: -1, workforce: -1, values: -1 });

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    const clickIndexedButton = (key: AutoKey, section: HTMLElement | null, index: number) => {
      if (!section || lastAuto.current[key] === index) return;
      const buttons = Array.from(section.querySelectorAll<HTMLButtonElement>('button'));
      if (!buttons[index]) return;
      lastAuto.current[key] = index;
      buttons[index].click();
    };

    const update = () => {
      frame = 0;
      const vh = window.innerHeight || 1;
      const baseSections = Array.from(document.querySelectorAll<HTMLElement>('section[data-scrub]'));
      const values = findValuesSection();
      const handoff = findHandoffSection();
      const allSections = [...baseSections, ...(values ? [values] : []), ...(handoff ? [handoff] : [])];
      const docHeight = Math.max(document.documentElement.scrollHeight - vh, 1);
      const global = clamp(window.scrollY / docHeight);
      setOverallProgress(global);
      document.documentElement.style.setProperty('--experience-progress', global.toFixed(4));

      let nearest = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      allSections.forEach((section, index) => {
        const p = sceneProgress(section, vh);
        const rect = section.getBoundingClientRect();
        const centerDistance = Math.abs(rect.top + rect.height * 0.5 - vh * 0.48);
        if (centerDistance < nearestDistance) {
          nearestDistance = centerDistance;
          nearest = index;
        }

        section.style.setProperty('--story', p.toFixed(4));
        section.style.setProperty('--story-in', clamp(p * 2.2).toFixed(4));
        section.style.setProperty('--story-out', clamp((p - 0.58) * 2.38).toFixed(4));

        if (!reducedMotion) {
          const image = section.querySelector<HTMLImageElement>('img');
          if (image) {
            const drift = (p - 0.5) * (index === 0 ? 34 : 52);
            const scale = 1.035 + p * (index === 8 ? 0.13 : 0.075);
            image.style.animation = 'none';
            image.style.willChange = 'transform, filter';
            image.style.transform = `translate3d(0, ${drift.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
          }

          const heading = section.querySelector<HTMLElement>('h1, h2');
          if (heading) {
            heading.style.willChange = 'transform, opacity';
            heading.style.transform = `translate3d(0, ${((0.5 - p) * 22).toFixed(2)}px, 0)`;
            heading.style.opacity = String(0.62 + clamp(1 - Math.abs(p - 0.5) * 1.4) * 0.38);
          }
        }
      });

      baseSections.forEach((section, index) => {
        const p = sceneProgress(section, vh);
        if (index === 1) clickIndexedButton('history', section, Math.min(4, Math.floor(clamp((p - 0.05) / 0.9) * 5)));
        if (index === 5) clickIndexedButton('process', section, Math.min(6, Math.floor(clamp((p - 0.03) / 0.94) * 7)));
        if (index === 6) clickIndexedButton('clinical', section, Math.min(4, Math.floor(clamp((p - 0.04) / 0.92) * 5)));
        if (index === 7) clickIndexedButton('workforce', section, p < 0.52 ? 0 : 1);
      });

      if (values) {
        const p = sceneProgress(values, vh);
        clickIndexedButton('values', values, Math.min(5, Math.floor(clamp((p - 0.05) / 0.9) * 6)));
      }

      setActiveChapter(Math.min(CHAPTERS.length - 1, nearest));
    };

    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const jumpTo = (index: number) => {
    storySections()[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
        section[data-scrub] { isolation: isolate; }
        @media (min-width: 901px) {
          section[data-scrub] { min-height: 112vh; }
          section[data-scrub] > * { backface-visibility: hidden; }
        }
      `}</style>
      <div className={styles.progress} aria-hidden="true"><i style={{ transform: `scaleX(${overallProgress})` }} /></div>
      <nav className={styles.chapterNav} aria-label="Experience chapters">
        {CHAPTERS.map((chapter, index) => (
          <button key={chapter} type="button" className={index === activeChapter ? styles.active : ''} onClick={() => jumpTo(index)}>
            <i />
            <span>{chapter}</span>
          </button>
        ))}
      </nav>
      <div className={styles.vignette} aria-hidden="true" />
    </>
  );
}
