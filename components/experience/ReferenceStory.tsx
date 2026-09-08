'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import CasePassport from './CasePassport';
import CaseTunnel from './CaseTunnel';
import ClinicalDatabase from './ClinicalDatabase';
import ClinicalToNetworkBridge from './ClinicalToNetworkBridge';
import GlobalCoverageExplorer from './GlobalCoverageExplorer';
import ImmersiveArchive from './ImmersiveArchive';
import MethodAssembler from './MethodAssembler';
import NetworkToValuesBridge from './NetworkToValuesBridge';
import OperationsAtlas from './OperationsAtlas';
import ValuesPlayground from './ValuesPlayground';
import ValuesToPartnerGateway from './ValuesToPartnerGateway';
import styles from './ReferenceStory.module.css';

const CHAPTERS = [
  { id: 'origin', label: 'Origin' },
  { id: 'archive-world', label: 'Archive' },
  { id: 'operations-world', label: 'Operations' },
  { id: 'clinical-world-v2', label: 'Clinical' },
  { id: 'network-world-v2', label: 'Network' },
  { id: 'values-world-v2', label: 'Values' },
  { id: 'partner-gateway', label: 'Partner' },
] as const;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function ReferenceStory() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const total = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / total);
      root.style.setProperty('--story-progress', progress.toFixed(4));

      let nearest = Number.POSITIVE_INFINITY;
      let nearestIndex = 0;
      CHAPTERS.forEach((item,index) => {
        const node = document.getElementById(item.id);
        if (!node) return;
        const r = node.getBoundingClientRect();
        const distance = Math.abs(r.top + r.height * .5 - window.innerHeight * .5);
        if (distance < nearest) { nearest = distance; nearestIndex = index; }
      });
      setChapter(nearestIndex);
    };

    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    const pointer = (event: PointerEvent) => {
      root.style.setProperty('--pointer-x', `${event.clientX / Math.max(1, window.innerWidth)}`);
      root.style.setProperty('--pointer-y', `${event.clientY / Math.max(1, window.innerHeight)}`);
    };

    update();
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    addEventListener('pointermove', pointer, { passive: true });
    return () => {
      removeEventListener('scroll', queue);
      removeEventListener('resize', queue);
      removeEventListener('pointermove', pointer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div ref={rootRef} className={styles.story}>
      <div className={styles.progress} aria-hidden="true"><i /></div>
      <nav className={styles.hud} aria-label="Experience chapters">
        <span>OCCU-MED / EXPERIENCE</span>
        <div>{CHAPTERS.map((item,index) => <button type="button" key={item.id} data-active={chapter===index} onClick={() => jump(item.id)}><i />{item.label}</button>)}</div>
        <b>{String(chapter+1).padStart(2,'0')} / {String(CHAPTERS.length).padStart(2,'0')}</b>
      </nav>
      <CasePassport />

      <section id="origin" className={styles.origin}>
        <Image className={styles.originImage} src="/photos/ChatGPT%20Image%20Sep%206%2C%202026%2C%2010_15_00%20PM.png" alt="Illustrated Occu-Med headquarters" fill priority sizes="100vw" />
        <div className={styles.originShade} />
        <div className={styles.originFog} aria-hidden="true" />
        <div className={styles.originGrid} aria-hidden="true" />
        <div className={styles.originCopy}>
          <span>1976 → TODAY</span>
          <h1>Don’t scroll through a brochure.<br /><em>Enter the system.</em></h1>
          <p>Research became standards. Standards became a case workflow. The workflow became a provider network. This version lets the visitor move through those things as places, objects, routes, and data.</p>
          <button type="button" onClick={() => jump('archive-world')}>DIVE INTO THE ARCHIVE <b>↓</b></button>
        </div>
        <div className={styles.originTelemetry}>
          <span>15,000+ PROVIDER LOCATIONS</span><span>50+ COUNTRIES</span><span>1M+ EMPLOYEES SUPPORTED</span>
        </div>
      </section>

      <div id="archive-world" className={styles.worldWrap}><ImmersiveArchive /></div>
      <MethodAssembler />
      <div id="operations-world" className={styles.worldWrap}><OperationsAtlas /></div>
      <CaseTunnel />
      <div id="clinical-world-v2" className={styles.worldWrap}><ClinicalDatabase /></div>
      <ClinicalToNetworkBridge />
      <div id="network-world-v2" className={styles.worldWrap}><GlobalCoverageExplorer /></div>
      <NetworkToValuesBridge />
      <div id="values-world-v2" className={styles.worldWrap}><ValuesPlayground /></div>
      <ValuesToPartnerGateway />
    </div>
  );
}
