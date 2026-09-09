'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import styles from './NetworkExperience.module.css';

type Layer = 'all' | 'medical' | 'dental' | 'diagnostic' | 'pharmacy';
type Point = { lat: number; lon: number; type: Layer; label?: string };
type AggregatePoint = Point & { count: number };
type Hover = { x: number; y: number; title: string; detail: string } | null;

const TOTALS: Record<Layer, number> = {
  all: 23544,
  medical: 14133,
  dental: 3143,
  diagnostic: 2885,
  pharmacy: 3309,
};

const LAYER_LABELS: Record<Layer, string> = {
  all: 'All facilities',
  medical: 'Medical',
  dental: 'Dental',
  diagnostic: 'Diagnostics',
  pharmacy: 'Pharmacy',
};

const COLORS: Record<Layer, string> = {
  all: '#82ebff',
  medical: '#7fe8ff',
  dental: '#b48bff',
  diagnostic: '#8ab5ff',
  pharmacy: '#e7be74',
};

const AGGREGATE_GEO: AggregatePoint[] = [
  { label: 'California', lat: 36.7, lon: -119.4, count: 2512, type: 'all' },
  { label: 'Texas', lat: 31.0, lon: -99.9, count: 2065, type: 'all' },
  { label: 'Florida', lat: 27.8, lon: -81.7, count: 1211, type: 'all' },
  { label: 'New York', lat: 43.0, lon: -75.0, count: 936, type: 'all' },
  { label: 'Georgia', lat: 32.7, lon: -83.3, count: 808, type: 'all' },
  { label: 'Illinois', lat: 40.0, lon: -89.2, count: 802, type: 'all' },
  { label: 'North Carolina', lat: 35.5, lon: -79.4, count: 793, type: 'all' },
  { label: 'Pennsylvania', lat: 41.0, lon: -77.7, count: 760, type: 'all' },
  { label: 'South Africa', lat: -30.6, lon: 22.9, count: 160, type: 'all' },
  { label: 'India', lat: 21.1, lon: 78.0, count: 63, type: 'all' },
  { label: 'Australia', lat: -25.3, lon: 133.8, count: 42, type: 'all' },
  { label: 'Canada', lat: 56.1, lon: -106.3, count: 32, type: 'all' },
  { label: 'Turkey', lat: 39.0, lon: 35.2, count: 30, type: 'all' },
  { label: 'United Kingdom', lat: 55.0, lon: -3.4, count: 29, type: 'all' },
  { label: 'Jordan', lat: 31.2, lon: 36.5, count: 22, type: 'all' },
  { label: 'Afghanistan', lat: 33.9, lon: 67.7, count: 22, type: 'all' },
];

const BREAKDOWNS = [
  {
    title: 'Facility capacity',
    total: 23544,
    rows: [
      ['Medical provider', 9420], ['Pharmacy', 3309], ['Dental', 3143], ['Urgent care', 2635],
      ['Laboratory', 1919], ['Occupational medicine', 1415], ['Hospitals', 590], ['Diagnostics & specialists', 1063],
    ] as const,
  },
  {
    title: 'International reach',
    total: 866,
    rows: [
      ['South Africa', 160], ['India', 63], ['Australia', 42], ['Canada', 32],
      ['Turkey', 30], ['United Kingdom', 29], ['Jordan', 22], ['Afghanistan', 22],
    ] as const,
  },
  {
    title: 'Largest U.S. states',
    total: 22678,
    rows: [
      ['California', 2512], ['Texas', 2065], ['Florida', 1211], ['New York', 936],
      ['Georgia', 808], ['Illinois', 802], ['North Carolina', 793], ['Pennsylvania', 760],
    ] as const,
  },
  {
    title: 'Diagnostic capacity',
    total: 2885,
    rows: [
      ['Laboratory', 1919], ['Drug testing laboratory', 294], ['Imaging / radiology', 278],
      ['Cardiology', 267], ['Audiology / hearing', 127],
    ] as const,
  },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function classify(value: unknown): Layer {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('dental')) return 'dental';
  if (text.includes('pharm') || text.includes('vaccin')) return 'pharmacy';
  if (text.includes('lab') || text.includes('diagn') || text.includes('imag') || text.includes('radio') || text.includes('cardio') || text.includes('audio')) return 'diagnostic';
  return 'medical';
}

function normalizeDataset(payload: unknown): Point[] {
  const rows = Array.isArray(payload) ? payload : (payload && typeof payload === 'object' && Array.isArray((payload as { points?: unknown[] }).points) ? (payload as { points: unknown[] }).points : []);
  const points: Point[] = [];

  for (const row of rows) {
    if (Array.isArray(row)) {
      const lon = Number(row[0]);
      const lat = Number(row[1]);
      if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        points.push({ lon, lat, type: classify(row[2]) });
      }
      continue;
    }
    if (!row || typeof row !== 'object') continue;
    const record = row as Record<string, unknown>;
    const lat = Number(record.lat ?? record.latitude ?? record.y);
    const lon = Number(record.lon ?? record.lng ?? record.longitude ?? record.x);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    points.push({
      lat,
      lon,
      type: classify(record.type ?? record.category ?? record.provider_type),
      label: typeof record.label === 'string' ? record.label : undefined,
    });
  }

  return points;
}

function project(lon: number, lat: number, width: number, height: number, zoom: number, panX: number, panY: number) {
  const baseX = ((lon + 180) / 360) * width;
  const baseY = ((90 - lat) / 180) * height;
  return {
    x: (baseX - width / 2) * zoom + width / 2 + panX,
    y: (baseY - height / 2) * zoom + height / 2 + panY,
  };
}

export default function NetworkExperience() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [layer, setLayer] = useState<Layer>('all');
  const [points, setPoints] = useState<Point[]>([]);
  const [mode, setMode] = useState<'coordinates' | 'aggregate' | 'loading'>('loading');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState<Hover>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const projectedRef = useRef<Array<{ x: number; y: number; point: Point; radius: number; count?: number }>>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/provider-network-points.json', { cache: 'force-cache' })
      .then(response => {
        if (!response.ok) throw new Error('coordinate dataset unavailable');
        return response.json();
      })
      .then(payload => {
        if (cancelled) return;
        const normalized = normalizeDataset(payload);
        if (!normalized.length) throw new Error('coordinate dataset empty');
        setPoints(normalized);
        setMode('coordinates');
      })
      .catch(() => {
        if (cancelled) return;
        setMode('aggregate');
      });
    return () => { cancelled = true; };
  }, []);

  const filteredPoints = useMemo(() => {
    if (mode !== 'coordinates') return [];
    return layer === 'all' ? points : points.filter(point => point.type === layer);
  }, [layer, mode, points]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const pixelWidth = Math.floor(width * dpr);
    const pixelHeight = Math.floor(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.strokeStyle = 'rgba(111, 222, 246, .09)';
    ctx.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 30) {
      const a = project(lon, -90, width, height, zoom, pan.x, pan.y);
      const b = project(lon, 90, width, height, zoom, pan.x, pan.y);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const a = project(-180, lat, width, height, zoom, pan.x, pan.y);
      const b = project(180, lat, width, height, zoom, pan.x, pan.y);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();

    const projected: Array<{ x: number; y: number; point: Point; radius: number; count?: number }> = [];
    if (mode === 'coordinates') {
      for (const point of filteredPoints) {
        const p = project(point.lon, point.lat, width, height, zoom, pan.x, pan.y);
        if (p.x < -10 || p.y < -10 || p.x > width + 10 || p.y > height + 10) continue;
        const radius = clamp(1.2 * Math.sqrt(zoom), 1.1, 3.2);
        ctx.beginPath();
        ctx.fillStyle = COLORS[point.type] ?? COLORS.all;
        ctx.globalAlpha = .58;
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
        projected.push({ ...p, point, radius: radius + 5 });
      }
      ctx.globalAlpha = 1;
    } else {
      for (const point of AGGREGATE_GEO) {
        const p = project(point.lon, point.lat, width, height, zoom, pan.x, pan.y);
        if (p.x < -50 || p.y < -50 || p.x > width + 50 || p.y > height + 50) continue;
        const radius = clamp(5 + Math.sqrt(point.count) * .18 * Math.sqrt(zoom), 7, 28);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 2.4);
        gradient.addColorStop(0, 'rgba(119, 232, 255, .9)');
        gradient.addColorStop(.22, 'rgba(72, 196, 225, .42)');
        gradient.addColorStop(1, 'rgba(72, 196, 225, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(p.x, p.y, radius * 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#bdf5ff';
        ctx.globalAlpha = .85;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(2.4, radius * .14), 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        projected.push({ ...p, point, radius: Math.max(12, radius), count: point.count });
      }
    }
    projectedRef.current = projected;
  }, [filteredPoints, mode, pan.x, pan.y, zoom]);

  useEffect(() => {
    draw();
    const wrap = wrapRef.current;
    if (!wrap || !window.ResizeObserver) return;
    const observer = new ResizeObserver(draw);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [draw]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (dragRef.current) {
      setPan({
        x: dragRef.current.panX + event.clientX - dragRef.current.x,
        y: dragRef.current.panY + event.clientY - dragRef.current.y,
      });
      setHover(null);
      return;
    }

    const rect = wrap.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let nearest: (typeof projectedRef.current)[number] | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const candidate of projectedRef.current) {
      const distance = Math.hypot(candidate.x - x, candidate.y - y);
      if (distance < candidate.radius && distance < nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }
    if (!nearest) {
      setHover(null);
      return;
    }
    const title = nearest.point.label || LAYER_LABELS[nearest.point.type];
    const detail = nearest.count
      ? `${nearest.count.toLocaleString()} aggregate directory records`
      : `${nearest.point.type} · ${nearest.point.lat.toFixed(1)}°, ${nearest.point.lon.toFixed(1)}°`;
    setHover({ x, y, title, detail });
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const next = clamp(zoom * (event.deltaY > 0 ? .9 : 1.1), .8, 5);
    setZoom(next);
  };

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setHover(null);
  };

  return (
    <main className={styles.root}>
      <header className={styles.topbar}>
        <a href="/experience#provider-portals">OCCU-MED / NETWORK ATLAS</a>
        <nav aria-label="Provider portals">
          <a href="/experience/history">History</a>
          <a href="/experience/network" aria-current="page">Network</a>
          <a href="/experience/resources">Resources</a>
          <a href="/experience/questions">Q&A</a>
          <a href="/experience/agreement">Agreement</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.copy}>
          <span>PORTAL 02 / PROVIDER NETWORK</span>
          <h1>Follow the<br />network.</h1>
          <p>Explore Occu-Med’s anonymized provider infrastructure as a geographic system. Drag the field, zoom through regions, switch clinical layers, and inspect the underlying capacity without exposing provider identities.</p>
          <div className={styles.mode} data-mode={mode}>
            <i />
            {mode === 'coordinates' ? `${points.length.toLocaleString()} coordinate records loaded` : mode === 'loading' ? 'Loading coordinate layer…' : 'Aggregate geography active · coordinate file awaiting recovery'}
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}><b>23,544</b><small>active directory records</small></div>
            <div className={styles.stat}><b>22,678</b><small>U.S. & territories</small></div>
            <div className={styles.stat}><b>866</b><small>international records</small></div>
          </div>
        </div>

        <div className={styles.mapShell}>
          <div className={styles.mapToolbar}>
            <div className={styles.layers} aria-label="Network layers">
              {(Object.keys(LAYER_LABELS) as Layer[]).map(key => (
                <button key={key} type="button" aria-pressed={layer === key} onClick={() => setLayer(key)}>
                  {LAYER_LABELS[key]} · {TOTALS[key].toLocaleString()}
                </button>
              ))}
            </div>
            <button className={styles.reset} type="button" onClick={reset}>Reset view</button>
          </div>

          <div
            ref={wrapRef}
            className={styles.canvasWrap}
            data-dragging={dragging}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={() => { if (!dragging) setHover(null); }}
            onWheel={onWheel}
          >
            <canvas ref={canvasRef} className={styles.canvas} aria-label="Interactive anonymized provider network map" />
            <div className={styles.instructions}>Drag to pan · wheel or trackpad to zoom · choose a clinical layer above. Provider names and contact details are never rendered.</div>
            {hover && (
              <div className={styles.tooltip} style={{ left: hover.x, top: hover.y }}>
                <b>{hover.title}</b><small>{hover.detail}</small>
              </div>
            )}
          </div>

          <div className={styles.mapFooter} aria-live="polite">
            <span><strong>{LAYER_LABELS[layer]}</strong> selected · {TOTALS[layer].toLocaleString()} directory records</span>
            <span>Zoom {zoom.toFixed(1)}× · {mode === 'coordinates' ? 'individual anonymized coordinates' : 'verified aggregate geography'}</span>
          </div>
        </div>
      </section>

      <section className={styles.explorer}>
        <div className={styles.explorerHead}>
          <div><span className={styles.panelLabel}>NETWORK INTELLIGENCE / ACCESSIBLE DETAIL</span><h2>The map has a second language.</h2></div>
          <p>The geographic view is paired with equivalent aggregate results so the network remains understandable without relying on pointer interaction or color alone.</p>
        </div>

        <div className={styles.breakdown}>
          {BREAKDOWNS.map(group => {
            const max = Math.max(...group.rows.map(([, count]) => count));
            return (
              <article key={group.title}>
                <header><h3>{group.title}</h3><b>{group.total.toLocaleString()}</b></header>
                {group.rows.map(([name, count]) => (
                  <div className={styles.bar} key={name}>
                    <span>{name}</span><i style={{ transform: `scaleX(${count / max})` }} /><b>{count.toLocaleString()}</b>
                  </div>
                ))}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
