'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import ClinicalDatabase from './ClinicalDatabase';
import GlobalCoverageExplorer from './GlobalCoverageExplorer';
import ImmersiveArchive from './ImmersiveArchive';
import OperationsAtlas from './OperationsAtlas';
import styles from './ReferenceStory.module.css';

const CHAPTERS = [
  { id: 'origin', label: 'Origin' },
  { id: 'archive-world', label: 'Archive' },
  { id: 'operations-world', label: 'Operations' },
  { id: 'clinical-world-v2', label: 'Clinical' },
  { id: 'network-world-v2', label: 'Network' },
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

      <section className={styles.methodBridge} aria-label="Research becomes methodology">
        <div className={styles.bridgeCopy}>
          <span>RESEARCH → OPERATING MODEL</span>
          <h2>The archive does not end.<br />It assembles into a method.</h2>
          <p>Three bodies of information are forced into the same decision space: what the job requires, what the medical evidence shows, and whether the two are compatible.</p>
        </div>
        <div className={styles.methodMachine} aria-hidden="true">
          <div className={styles.axisA}><span>VALID JOB INFORMATION</span></div>
          <div className={styles.axisB}><span>JOB-RELATED MEDICAL EXAM</span></div>
          <div className={styles.axisC}><span>COMPATIBILITY ASSESSMENT</span></div>
          <div className={styles.core}>EXAMQA</div>
          <div className={styles.packet}><Image src="/photos/EXAM%20REPORT.png" alt="" fill sizes="220px" /></div>
          <div className={styles.identity}><Image src="/photos/EMPLOYEE%20ID.png" alt="" fill sizes="180px" /></div>
        </div>
      </section>

      <div id="operations-world" className={styles.worldWrap}><OperationsAtlas /></div>

      <section className={styles.caseTransition}>
        <div className={styles.caseBeam} aria-hidden="true" />
        <div className={styles.caseTransitionCopy}><span>ONE CASE / MANY CLINICAL FORMS</span><h2>The route stays consistent.<br />The medicine changes.</h2><button type="button" onClick={() => jump('clinical-world-v2')}>OPEN CLINICAL DATABASE →</button></div>
      </section>

      <div id="clinical-world-v2" className={styles.worldWrap}><ClinicalDatabase /></div>
      <div id="network-world-v2" className={styles.worldWrap}><GlobalCoverageExplorer /></div>

      <section id="partner-gateway" className={styles.gateway}>
        <div className={styles.gatewayNetwork} aria-hidden="true">
          {Array.from({ length: 36 },(_,i) => (
            <i
              key={i}
              style={{
                '--i': i,
                '--radius': `${120 + (i % 6) * 38}px`,
                '--alpha': 0.18 + (i % 4) * 0.09,
              } as React.CSSProperties}
            />
          ))}
        </div>
        <div className={styles.gatewayImage} aria-hidden="true"><Image src="/photos/Diverse%20Healthcare%20Team%20Portrait%20(1).png" alt="" fill sizes="55vw" /></div>
        <div className={styles.gatewayCopy}>
          <span>THE NEXT NODE IS YOUR FACILITY</span>
          <h2>Now the experience stops talking about the network.<br /><em>It asks you to join it.</em></h2>
          <p>From here forward the interface becomes deliberately practical: specialty, capabilities, provider information, rates, terms, and the actual Forms-based fee proposal workflow.</p>
          <a href="#provider-details">BEGIN PROVIDER ONBOARDING <b>→</b></a>
        </div>
      </section>
    </div>
  );
}
