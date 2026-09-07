'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './CinematicContinuity.module.css';

const CHAPTERS = ['Origin', 'History', 'Archive', 'Problem', 'Method', 'Referral', 'Clinical', 'Work', 'Network', 'Values', 'Partner'] as const;
const VALUE_EFFECTS = ['humility', 'positivity', 'customer-service', 'quality', 'integrity', 'diligence'] as const;
const PALETTES = [
  '91 178 221',
  '78 135 176',
  '196 157 101',
  '120 173 203',
  '74 132 168',
  '67 164 197',
  '57 153 184',
  '173 122 76',
  '56 214 211',
  '238 187 86',
  '109 169 190',
] as const;

type AutoKey = 'history' | 'process' | 'clinical' | 'workforce' | 'values';

type DirectorStageDetail = {
  chapter?: string;
  index?: number;
};

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
  const [activeValueEffect, setActiveValueEffect] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const lastAuto = useRef<Record<AutoKey, number>>({ history: -1, process: -1, clinical: -1, workforce: -1, values: -1 });

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let settleTimer = 0;
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();

    const root = document.documentElement;
    root.style.setProperty('--pointer-x', '50%');
    root.style.setProperty('--pointer-y', '45%');

    const clickIndexedButton = (key: AutoKey, section: HTMLElement | null, index: number) => {
      if (!section || lastAuto.current[key] === index) return;
      const buttons = Array.from(section.querySelectorAll<HTMLButtonElement>('button'));
      if (!buttons[index]) return;
      lastAuto.current[key] = index;
      buttons[index].click();
    };

    const onDirectorStage = (event: Event) => {
      const detail = (event as CustomEvent<DirectorStageDetail>).detail;
      if (detail?.chapter === 'Values' && typeof detail.index === 'number') {
        setActiveValueEffect(Math.max(0, Math.min(VALUE_EFFECTS.length - 1, detail.index)));
      }
    };

    const update = () => {
      frame = 0;
      const now = performance.now();
      const vh = window.innerHeight || 1;
      const baseSections = Array.from(document.querySelectorAll<HTMLElement>('section[data-scrub]'));
      const values = findValuesSection();
      const handoff = findHandoffSection();
      const allSections = [...baseSections, ...(values ? [values] : []), ...(handoff ? [handoff] : [])];
      const docHeight = Math.max(document.documentElement.scrollHeight - vh, 1);
      const global = clamp(window.scrollY / docHeight);
      const elapsed = Math.max(16, now - lastTime);
      const scrollEnergy = clamp(Math.abs(window.scrollY - lastScrollY) / elapsed / 1.15);
      lastScrollY = window.scrollY;
      lastTime = now;

      setOverallProgress(global);
      root.style.setProperty('--experience-progress', global.toFixed(4));
      root.style.setProperty('--experience-x', `${12 + global * 72}%`);
      root.style.setProperty('--experience-x-reverse', `${88 - global * 52}%`);
      root.style.setProperty('--scroll-energy', scrollEnergy.toFixed(4));

      let nearest = 0;
      let nearestProgress = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      allSections.forEach((section, index) => {
        const p = sceneProgress(section, vh);
        const rect = section.getBoundingClientRect();
        const centerDistance = Math.abs(rect.top + rect.height * 0.5 - vh * 0.48);
        if (centerDistance < nearestDistance) {
          nearestDistance = centerDistance;
          nearest = index;
          nearestProgress = p;
        }

        section.style.setProperty('--story', p.toFixed(4));
        section.style.setProperty('--story-in', clamp(p * 2.2).toFixed(4));
        section.style.setProperty('--story-out', clamp((p - 0.58) * 2.38).toFixed(4));

        if (!reducedMotion) {
          const images = Array.from(section.querySelectorAll<HTMLImageElement>('img')).slice(0, 3);
          images.forEach((image, imageIndex) => {
            const direction = imageIndex % 2 === 0 ? 1 : -1;
            const yDrift = (p - 0.5) * (index === 0 ? 34 : 44 + imageIndex * 12);
            const xDrift = (p - 0.5) * direction * imageIndex * 16;
            const scale = 1.025 + p * (index === 8 ? 0.12 : 0.055 + imageIndex * 0.012);
            image.style.animation = 'none';
            image.style.willChange = 'transform, filter';
            image.style.transform = `translate3d(${xDrift.toFixed(2)}px, ${yDrift.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
          });

          const heading = section.querySelector<HTMLElement>('h1, h2');
          if (heading) {
            heading.style.willChange = 'transform, opacity';
            heading.style.transform = `translate3d(0, ${((0.5 - p) * 24).toFixed(2)}px, 0)`;
            heading.style.opacity = String(0.58 + clamp(1 - Math.abs(p - 0.5) * 1.45) * 0.42);
          }
        }
      });

      const manualDirectorStages = root.dataset.directorManualStages === 'true';

      if (!manualDirectorStages) {
        baseSections.forEach((section, index) => {
          const p = sceneProgress(section, vh);
          if (index === 1) clickIndexedButton('history', section, Math.min(4, Math.floor(clamp((p - 0.05) / 0.9) * 5)));
          if (index === 5) clickIndexedButton('process', section, Math.min(6, Math.floor(clamp((p - 0.03) / 0.94) * 7)));
          if (index === 6) clickIndexedButton('clinical', section, Math.min(4, Math.floor(clamp((p - 0.04) / 0.92) * 5)));
          if (index === 7) clickIndexedButton('workforce', section, p < 0.52 ? 0 : 1);
        });
      }

      if (values) {
        const p = sceneProgress(values, vh);
        root.style.setProperty('--value-progress', clamp((p * 6) % 1).toFixed(4));
        if (!manualDirectorStages) {
          const valueIndex = Math.min(5, Math.floor(clamp((p - 0.05) / 0.9) * 6));
          clickIndexedButton('values', values, valueIndex);
          setActiveValueEffect(valueIndex);
        }
      }

      const provider = document.getElementById('provider-details');
      const providerTop = provider?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      const cinema = clamp((providerTop - vh * 0.12) / (vh * 0.72));
      root.style.setProperty('--cinema', cinema.toFixed(4));
      root.style.setProperty('--chapter-progress', nearestProgress.toFixed(4));
      root.style.setProperty('--chapter-y', `${18 + nearestProgress * 54}%`);
      root.style.setProperty('--orb-shift', `${(nearestProgress - 0.5) * 80}px`);
      root.style.setProperty('--orb-shift-reverse', `${(0.5 - nearestProgress) * 95}px`);
      root.style.setProperty('--continuity-tone', PALETTES[nearest] ?? PALETTES[0]);
      setActiveChapter(Math.min(CHAPTERS.length - 1, nearest));
    };

    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const onScroll = () => {
      queue();
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => root.style.setProperty('--scroll-energy', '0'), 110);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion) return;
      root.style.setProperty('--pointer-x', `${(event.clientX / Math.max(1, window.innerWidth)) * 100}%`);
      root.style.setProperty('--pointer-y', `${(event.clientY / Math.max(1, window.innerHeight)) * 100}%`);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', queue);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('occumed:director-stage', onDirectorStage);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', queue);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('occumed:director-stage', onDirectorStage);
      window.clearTimeout(settleTimer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const jumpTo = (index: number) => {
    storySections()[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const effectChapter = CHAPTERS[activeChapter].toLowerCase();

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
        section[data-scrub] { isolation: isolate; }
        @media (min-width: 901px) {
          main > section:nth-of-type(1) { min-height: 118vh; }
          main > section:nth-of-type(2) { min-height: 235vh !important; }
          main > section:nth-of-type(2) > div:last-child { position: sticky; top: 5vh; }
          main > section:nth-of-type(3) { min-height: 205vh !important; }
          main > section:nth-of-type(3) > div:last-child { position: sticky; top: 4vh; }
          main > section:nth-of-type(4) { min-height: 165vh !important; }
          main > section:nth-of-type(5) { min-height: 150vh !important; }
          main > section:nth-of-type(6) { min-height: 300vh !important; }
          main > section:nth-of-type(6) > div:last-child { position: sticky; top: 5vh; }
          main > section:nth-of-type(7) { min-height: 250vh !important; }
          main > section:nth-of-type(7) > div:last-child { position: sticky; top: 5vh; }
          main > section:nth-of-type(8) { min-height: 185vh !important; }
          main > section:nth-of-type(8) > div:last-child { position: sticky; top: 20vh; }
          main > section:nth-of-type(9) { min-height: 185vh !important; }
          main > section:nth-of-type(9) > div:nth-child(3) { position: sticky; top: 24vh; }
          main > section:nth-of-type(10) { min-height: 235vh !important; }
          main > section:nth-of-type(10) > div:last-child { position: sticky; top: 7vh; }
          main > section:nth-of-type(11) { min-height: 128vh !important; }
          main > section:nth-of-type(-n+11) > * { backface-visibility: hidden; }
        }
      `}</style>
      <div className={styles.atmosphere} aria-hidden="true"><i /><i /><i /></div>
      <div className={styles.effectField} data-chapter={effectChapter} data-value={VALUE_EFFECTS[activeValueEffect]} aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
        <b /><b /><b />
      </div>
      <div className={styles.progress} aria-hidden="true"><i style={{ transform: `scaleX(${overallProgress})` }} /></div>
      <div className={styles.chapterStamp} aria-hidden="true">
        <span>{String(activeChapter + 1).padStart(2, '0')}</span>
        <strong>{CHAPTERS[activeChapter]}</strong>
      </div>
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
