'use client';

import { useState, type CSSProperties, type PointerEvent } from 'react';
import styles from './PortalOrbitalNav.module.css';

type Portal = {
  id: string;
  href: string;
  number: string;
  title: string;
  note: string;
  tone: string;
};

const POSITIONS = [
  { x: '-34%', y: '-24%', z: '72px', rotation: '-14deg' },
  { x: '33%', y: '-26%', z: '102px', rotation: '18deg' },
  { x: '39%', y: '18%', z: '58px', rotation: '-8deg' },
  { x: '-39%', y: '18%', z: '86px', rotation: '11deg' },
  { x: '0%', y: '34%', z: '126px', rotation: '-18deg' },
] as const;

const COLORS: Record<string, string> = {
  gold: '#e8b96c',
  cyan: '#78e8ff',
  violet: '#b18cff',
  blue: '#7da7ff',
  white: '#eefaff',
};

function announcePortal(index: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('docbox:portal-focus', { detail: { index } }));
}

export default function PortalOrbitalNav({ portals }: { portals: readonly Portal[] }) {
  const [active, setActive] = useState(-1);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / Math.max(rect.width, 1);
    const py = (event.clientY - rect.top) / Math.max(rect.height, 1);
    setTilt({ x: (0.5 - py) * 5.5, y: (px - 0.5) * 7.5 });
  };

  const focusPortal = (index: number) => {
    setActive(index);
    announcePortal(index);
  };

  const clearPortal = () => {
    setActive(-1);
    announcePortal(-1);
  };

  const activePortal = active >= 0 ? portals[active] : null;

  return (
    <nav
      className={styles.root}
      aria-label="Provider portal orbit"
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        setTilt({ x: 0, y: 0 });
        clearPortal();
      }}
      style={{ '--tilt-x': `${tilt.x}deg`, '--tilt-y': `${tilt.y}deg` } as CSSProperties}
    >
      <div className={styles.field}>
        <div className={styles.center} aria-hidden="true">
          <i className={styles.helmet} />
          <i className={styles.visor} />
          <i className={styles.torso} />
          <i className={styles.shadow} />
        </div>

        {portals.map((portal, index) => {
          const position = POSITIONS[index] ?? POSITIONS[0];
          return (
            <a
              key={portal.id}
              href={portal.href}
              className={styles.portal}
              data-active={active === index}
              onPointerEnter={() => focusPortal(index)}
              onFocus={() => focusPortal(index)}
              onBlur={clearPortal}
              style={{
                '--x': position.x,
                '--y': position.y,
                '--z': position.z,
                '--ring-rotation': position.rotation,
                '--portal-color': COLORS[portal.tone] ?? COLORS.cyan,
              } as CSSProperties}
            >
              <span>{portal.number} / PORTAL</span>
              <strong>{portal.title}</strong>
              <small>{portal.note}</small>
              <b>ENTER EXPERIENCE ↘</b>
            </a>
          );
        })}
      </div>

      <div className={styles.status} aria-live="polite">
        {activePortal ? (
          <><strong>{activePortal.number} — {activePortal.title}</strong> · enter this portal</>
        ) : (
          <>Move through the orbital field or use Tab to inspect all five destinations.</>
        )}
      </div>
    </nav>
  );
}
