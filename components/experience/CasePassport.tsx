'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import styles from './CasePassport.module.css';

type Stage = {
  id: string;
  label: string;
  title: string;
  fields: Array<[string, string]>;
};

const STAGES: Stage[] = [
  { id: 'origin', label: 'ORIGIN', title: 'Research question', fields: [['Record', '1976'], ['State', 'Unresolved'], ['Focus', 'Job-specific standards']] },
  { id: 'archive-world', label: 'ARCHIVE', title: 'Standards record', fields: [['Evidence', 'Research + history'], ['Method', 'Compendium → Guidelines'], ['State', 'Structured']] },
  { id: 'operations-world', label: 'OPERATIONS', title: 'Referral case', fields: [['Case', 'OM / REF'], ['Packet', 'Authorized scope'], ['State', 'In motion']] },
  { id: 'clinical-world-v2', label: 'CLINICAL', title: 'Service packet', fields: [['Input', 'Medical evidence'], ['Output', 'Provider results'], ['State', 'Documented']] },
  { id: 'network-world-v2', label: 'NETWORK', title: 'Provider node', fields: [['Network', '15,000+ locations'], ['Reach', '50+ countries'], ['State', 'Connected']] },
  { id: 'values-world-v2', label: 'VALUES', title: 'Operating standard', fields: [['Principles', '6'], ['Behavior', 'Applied'], ['State', 'Accountable']] },
  { id: 'partner-gateway', label: 'PARTNER', title: 'Your facility', fields: [['Specialty', 'Select next'], ['Rates', 'Fee proposal'], ['State', 'Ready to connect']] },
];

export default function CasePassport() {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = Math.max(1, window.innerHeight);
      let nearest = Number.POSITIVE_INFINITY;
      let nextStage = 0;
      let local = 0;

      STAGES.forEach((item,index) => {
        const node = document.getElementById(item.id);
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height * .5 - vh * .5);
        if (distance < nearest) {
          nearest = distance;
          nextStage = index;
          local = Math.max(0, Math.min(1, (vh * .72 - rect.top) / Math.max(vh, rect.height)));
        }
      });

      const providerTop = document.getElementById('provider-details')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      setVisible(providerTop > vh * .78);
      setStage(nextStage);
      setProgress(local);
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    return () => {
      removeEventListener('scroll', queue);
      removeEventListener('resize', queue);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const current = STAGES[stage];
  const partnerHandoff = stage === STAGES.length - 1 ? Math.max(0, Math.min(1, (progress - .55) / .45)) : 0;
  const passportStyle = {
    '--passport-lift': `${Math.round(partnerHandoff * 210)}px`,
    '--passport-scale': `${(1 - partnerHandoff * .08).toFixed(4)}`,
  } as CSSProperties;

  return (
    <aside className={styles.passport} data-stage={stage} data-visible={visible} aria-label="Persistent Occu-Med case passport" style={passportStyle}>
      <div className={styles.edge}><i style={{ height: `${Math.max(8, progress * 100)}%` }} /></div>
      <div className={styles.topline}><span>{current.label}</span><b>{String(stage + 1).padStart(2,'0')} / {String(STAGES.length).padStart(2,'0')}</b></div>
      <strong className={styles.title}>{current.title}</strong>
      <div className={styles.fields}>
        {current.fields.map(([key,value]) => <div key={key}><span>{key}</span><b>{value}</b></div>)}
      </div>
      <div className={styles.code}>OCCU-MED // SYSTEM OBJECT</div>
    </aside>
  );
}
