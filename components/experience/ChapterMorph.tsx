'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import styles from './ChapterMorph.module.css';

const CHAPTERS = ['Origin', 'History', 'Archive', 'Problem', 'Method', 'Referral', 'Clinical', 'Work', 'Network', 'Values', 'Partner'] as const;
const TONES = [
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

export default function ChapterMorph() {
  const [nextChapter, setNextChapter] = useState('');
  const [morph, setMorph] = useState(0);
  const [tone, setTone] = useState<string>(TONES[0]);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight || 1;
      const base = Array.from(document.querySelectorAll<HTMLElement>('section[data-scrub]'));
      const values = valuesSection();
      const handoff = handoffSection();
      const sections = [...base, ...(values ? [values] : []), ...(handoff ? [handoff] : [])];
      const anchor = vh * 0.52;

      let activeIndex = -1;
      let local = 0;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= anchor && rect.bottom > anchor) {
          activeIndex = index;
          local = clamp((anchor - rect.top) / Math.max(1, rect.height));
        }
      });

      if (activeIndex < 0 || activeIndex >= CHAPTERS.length - 1) {
        setMorph(0);
        return;
      }

      const providerTop = document.getElementById('provider-details')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      if (providerTop < vh * 0.7) {
        setMorph(0);
        return;
      }

      const edge = clamp((local - 0.77) / 0.23);
      setMorph(edge);
      setNextChapter(CHAPTERS[activeIndex + 1] ?? '');
      setTone(TONES[activeIndex + 1] ?? TONES[0]);
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
  }, []);

  return (
    <div
      className={styles.morph}
      style={{ '--morph': morph, '--morph-tone': tone } as CSSProperties}
      aria-hidden="true"
    >
      <div className={styles.bladeA} />
      <div className={styles.bladeB} />
      <div className={styles.iris}><i /><i /></div>
      <div className={styles.label}>
        <span>NEXT</span>
        <strong>{nextChapter}</strong>
      </div>
    </div>
  );
}
