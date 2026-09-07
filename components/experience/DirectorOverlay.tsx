'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './DirectorOverlay.module.css';

const CHAPTERS = ['Origin', 'History', 'Archive', 'Problem', 'Method', 'Referral', 'Clinical', 'Work', 'Network', 'Values', 'Partner'] as const;
const STAGES: Partial<Record<(typeof CHAPTERS)[number], readonly string[]>> = {
  History: ['1976', '1979', '2006', '2016', 'Today'],
  Archive: ['Documents', 'Research', 'Guidelines', 'Method seed'],
  Referral: ['Referral', 'Scheduling', 'Clinic', 'Exam', 'Records', 'QA', 'Review'],
  Clinical: ['Medical', 'Lab', 'Dental', 'Audio', 'Vaccine'],
  Work: ['Industrial', 'Public safety'],
  Values: ['Humility', 'Positivity', 'Customer Service', 'Quality', 'Integrity', 'Diligence'],
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function valuesSection() {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find(section =>
    Array.from(section.querySelectorAll('button strong')).some(node => node.textContent?.trim() === 'Humility')
  ) ?? null;
}

function handoffSection() {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find(section =>
    Boolean(section.querySelector('a[href="#provider-details"]'))
  ) ?? null;
}

function collectSections() {
  const base = Array.from(document.querySelectorAll<HTMLElement>('section[data-scrub]'));
  const values = valuesSection();
  const handoff = handoffSection();
  return [...base, ...(values ? [values] : []), ...(handoff ? [handoff] : [])];
}

function applyStage(section: HTMLElement | undefined, chapter: (typeof CHAPTERS)[number], index: number) {
  if (!section || !(STAGES[chapter]?.length)) return;
  const buttons = Array.from(section.querySelectorAll<HTMLButtonElement>('button'));
  if (buttons[index]) buttons[index].click();
  window.dispatchEvent(new CustomEvent('occumed:director-stage', { detail: { chapter, index } }));
}

export default function DirectorOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [progress, setProgress] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [manualStages, setManualStages] = useState(true);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    setEnabled(new URLSearchParams(window.location.search).get('director') === '1');
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.dataset.directorManualStages = manualStages ? 'true' : 'false';
    return () => {
      delete document.documentElement.dataset.directorManualStages;
    };
  }, [enabled, manualStages]);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const sections = collectSections();
      const anchor = (window.innerHeight || 1) * 0.5;
      let index = 0;
      let local = 0;
      let nearest = Number.POSITIVE_INFINITY;

      sections.forEach((section, sectionIndex) => {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height * 0.5 - anchor);
        if (distance < nearest) {
          nearest = distance;
          index = sectionIndex;
          local = clamp((anchor - rect.top) / Math.max(1, rect.height));
        }
      });

      const resolvedChapter = Math.min(CHAPTERS.length - 1, index);
      const chapterName = CHAPTERS[resolvedChapter];
      setChapter(previous => {
        if (resolvedChapter !== previous) setStageIndex(0);
        return resolvedChapter;
      });
      setProgress(local);

      // Director Mode is mounted after the cinematic controller. Re-applying the selected
      // stage here means manual staging wins after any scroll-driven automatic update.
      if (manualStages && resolvedChapter === chapter) {
        applyStage(sections[resolvedChapter], chapterName, stageIndex);
      }
    };

    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled, manualStages, stageIndex, chapter]);

  const percent = useMemo(() => Math.round(progress * 100), [progress]);
  const currentChapter = CHAPTERS[chapter];
  const stages = STAGES[currentChapter] ?? [];

  if (!enabled) return null;

  const jump = (index: number, targetProgress = 0.12) => {
    const section = collectSections()[index];
    if (!section) return;
    setStageIndex(0);
    const travel = Math.max(0, section.offsetHeight - window.innerHeight * 0.5);
    window.scrollTo({ top: section.offsetTop + travel * targetProgress, behavior: 'auto' });
  };

  const scrub = (value: number) => {
    const section = collectSections()[chapter];
    if (!section) return;
    const anchor = window.innerHeight * 0.5;
    const target = section.offsetTop + section.offsetHeight * value - anchor;
    window.scrollTo({ top: Math.max(0, target), behavior: 'auto' });
  };

  const chooseStage = (index: number) => {
    const section = collectSections()[chapter];
    if (!section) return;
    setManualStages(true);
    setStageIndex(index);
    applyStage(section, currentChapter, index);
  };

  return (
    <aside className={`${styles.director} ${collapsed ? styles.collapsed : ''}`} aria-label="Experience director mode">
      <header>
        <div>
          <span>DIRECTOR MODE</span>
          <strong>{currentChapter}</strong>
        </div>
        <button type="button" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? 'Expand director mode' : 'Collapse director mode'}>
          {collapsed ? '+' : '−'}
        </button>
      </header>

      {!collapsed && (
        <>
          <div className={styles.scrubber}>
            <div><span>SCENE PROGRESS</span><b>{percent}%</b></div>
            <input type="range" min="0" max="100" value={percent} onChange={event => scrub(Number(event.target.value) / 100)} />
          </div>

          <div className={styles.modeRow}>
            <span>INTERNAL STAGING</span>
            <button type="button" className={manualStages ? styles.modeActive : ''} onClick={() => setManualStages(true)}>Manual</button>
            <button type="button" className={!manualStages ? styles.modeActive : ''} onClick={() => setManualStages(false)}>Auto</button>
          </div>

          {stages.length > 0 && (
            <div className={styles.stageStrip}>
              {stages.map((stage, index) => (
                <button key={stage} type="button" onClick={() => chooseStage(index)} className={manualStages && index === stageIndex ? styles.stageActive : ''}>
                  <span>{String(index + 1).padStart(2, '0')}</span>{stage}
                </button>
              ))}
            </div>
          )}

          <div className={styles.chapterGrid}>
            {CHAPTERS.map((name, index) => (
              <button key={name} type="button" onClick={() => jump(index)} className={index === chapter ? styles.active : ''}>
                <span>{String(index + 1).padStart(2, '0')}</span>{name}
              </button>
            ))}
          </div>

          <footer>
            <span>Manual preview utility</span>
            <code>?director=1</code>
          </footer>
        </>
      )}
    </aside>
  );
}
