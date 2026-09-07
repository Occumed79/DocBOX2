'use client';

import { useEffect, useMemo, useRef, useState, type MutableRefObject, type PointerEvent } from 'react';
import { downloadPdf, providerDocumentPdf } from './documentCapture';
import styles from './FormsProviderAgreement.module.css';

type Props = {
  services: string[];
  specialty: string;
};

type ProviderDocumentType = 'fee-proposal' | 'service-agreement';
type SignatureType = 'typed' | 'drawn';
type AddressData = { street1: string; street2: string; city: string; state: string; zip: string };
type ProviderServiceRow = { id: string; component: string; price: string; source: 'occu-med' | 'provider' };
type ProviderDocumentData = {
  documentType: ProviderDocumentType;
  documentNumber: string;
  providerName: string;
  providerContactName: string;
  providerEmail: string;
  providerPhone: string;
  address: AddressData;
  preparedBy: string;
  preparedByTitle: string;
  issuedDate: string;
  expiresDate: string;
  billingTerms: string;
  services: ProviderServiceRow[];
  notes: string;
  providerSignerName: string;
  providerSignerTitle: string;
  providerSignatureType: SignatureType;
  providerSignatureData: string;
  providerSignedDate: string;
  agreedElectronic: boolean;
  electronicConsentText: string;
};

const ELECTRONIC_RECORD_CONSENT_TEXT =
  'I agree to use electronic records and electronic signatures for this document and understand that my electronic signature has the same legal effect as a handwritten signature.';

const SERVICE_AGREEMENT_SECTIONS = [
  {
    title: 'Scheduling Process',
    body: "An Occu-Med team member will coordinate each appointment with the provider's preferred point of contact. Before the patient arrives, Occu-Med will send an authorization containing the patient's demographic information, client and invoicing information, and the services authorized for that visit.",
  },
  {
    title: 'Reporting Process',
    body: 'After the authorized services are completed, results and associated paperwork should be sent promptly to harvesting@occu-med.com. Results should be reported as they become available unless Occu-Med provides different instructions for a specific referral.',
  },
  {
    title: 'Billing Terms',
    body: 'Occu-Med will pay undisputed, itemized invoices according to the billing terms shown in this agreement. The payment period begins when Occu-Med receives an invoice that accurately reflects the authorized services performed at the agreed rates. Invoices should be sent to Finance@occu-med.com.',
  },
] as const;

const DRAFT_KEY = 'occumed-forms-provider-agreement-v1';
let rowCounter = 0;

function createProviderServiceRow(component = '', price = '', source: ProviderServiceRow['source'] = 'occu-med'): ProviderServiceRow {
  rowCounter += 1;
  return { id: `provider-service-${Date.now()}-${rowCounter}`, component, price, source };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createProviderDocumentData(documentType: ProviderDocumentType, services: string[]): ProviderDocumentData {
  return {
    documentType,
    documentNumber: `OM-${documentType === 'fee-proposal' ? 'FP' : 'PSA'}-${Date.now().toString(36).toUpperCase()}`,
    providerName: '',
    providerContactName: '',
    providerEmail: '',
    providerPhone: '',
    address: { street1: '', street2: '', city: '', state: '', zip: '' },
    preparedBy: 'Occu-Med Network Management',
    preparedByTitle: 'Network Management Analyst',
    issuedDate: today(),
    expiresDate: '',
    billingTerms: 'Net 30',
    services: services.map(service => createProviderServiceRow(service)),
    notes: '',
    providerSignerName: '',
    providerSignerTitle: '',
    providerSignatureType: 'typed',
    providerSignatureData: '',
    providerSignedDate: '',
    agreedElectronic: false,
    electronicConsentText: ELECTRONIC_RECORD_CONSENT_TEXT,
  };
}

function documentTitle(documentType: ProviderDocumentType) {
  return documentType === 'fee-proposal' ? 'Provider Fee Proposal' : 'Provider Service Agreement';
}

function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function validate(data: ProviderDocumentData) {
  const errors: string[] = [];
  if (!data.providerName.trim()) errors.push('Provider or facility name is required.');
  if (!data.providerContactName.trim()) errors.push('Provider contact name is required.');
  if (!data.providerEmail.trim() || !/^\S+@\S+\.\S+$/.test(data.providerEmail.trim())) errors.push('A valid provider email is required.');
  if (!data.address.street1.trim() || !data.address.city.trim() || !data.address.state.trim() || !data.address.zip.trim()) errors.push('Complete the provider address.');
  if (!data.services.some(row => row.component.trim())) errors.push('Add at least one service.');
  if (data.services.some(row => row.component.trim() && !row.price.trim())) errors.push('Enter a fee for every listed service.');
  if (!data.providerSignerName.trim()) errors.push('Provider signer name is required.');
  if (!data.providerSignerTitle.trim()) errors.push('Provider signer title is required.');
  if (data.providerSignatureType === 'drawn' && !data.providerSignatureData.startsWith('data:image/png;base64,')) errors.push('Draw your signature before completing the document.');
  if (!data.agreedElectronic) errors.push('Electronic signature consent is required.');
  return errors;
}

function safeFilename(data: ProviderDocumentData) {
  const provider = data.providerName.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return `${data.documentType}-${provider || data.documentNumber}.pdf`;
}

function OccuMedSignature() {
  return (
    <div className={styles.occuSignature} aria-label="Occu-Med verified electronic signature">
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeLinecap="round">
          <path d="M32 6C18 6 8 17 8 31c0 10 4 19 11 25" /><path d="M32 11c-11 0-19 9-19 20 0 9 3 16 9 22" /><path d="M32 16c-8 0-14 7-14 15 0 8 3 15 8 21" /><path d="M32 21c-6 0-9 5-9 11 0 8 3 14 7 19" /><path d="M32 26c-3 0-5 3-5 6 0 7 2 12 5 17" />
          <path d="M32 6c14 0 24 11 24 25 0 10-4 19-11 25" /><path d="M32 11c11 0 19 9 19 20 0 9-3 16-9 22" /><path d="M32 16c8 0 14 7 14 15 0 8-3 15-8 21" /><path d="M32 21c6 0 9 5 9 11 0 8-3 14-7 19" /><path d="M32 26c3 0 5 3 5 6 0 7-2 12-5 17" />
        </g>
        <text x="32" y="36" textAnchor="middle">OM</text>
      </svg>
      <div><strong>OCCU-MED</strong><span>Verified electronic signature</span></div>
    </div>
  );
}

function SignaturePad({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(Boolean(value));

  const prepareContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#102344';
    return context;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = prepareContext();
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!value) {
      setHasInk(false);
      return;
    }
    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setHasInk(true);
    };
    image.src = value;
  }, [value]);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (event.currentTarget.width / rect.width),
      y: (event.clientY - rect.top) * (event.currentTarget.height / rect.height),
    };
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const context = prepareContext();
    if (!context) return;
    const current = point(event);
    context.beginPath();
    context.moveTo(current.x, current.y);
    drawingRef.current = true;
  };

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = prepareContext();
    if (!context) return;
    const current = point(event);
    context.lineTo(current.x, current.y);
    context.stroke();
    setHasInk(true);
  };

  const finish = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = prepareContext();
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange('');
  };

  return (
    <div className={styles.signaturePad}>
      <canvas ref={canvasRef} width={720} height={220} aria-label="Draw your signature" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} />
      <span aria-hidden="true" />
      <button type="button" onClick={clear} disabled={!hasInk}>Clear</button>
    </div>
  );
}

function ProviderDocumentPreview({ data, previewRef }: { data: ProviderDocumentData; previewRef: MutableRefObject<HTMLDivElement | null> }) {
  const address = [data.address.street1, data.address.street2, [data.address.city, data.address.state, data.address.zip].filter(Boolean).join(', ')].filter(Boolean);
  const services = data.services.filter(row => row.component.trim() || row.price.trim());
  const capacity = data.documentType === 'service-agreement' ? 7 : 14;
  const pages = useMemo(() => {
    if (services.length <= capacity) return [services];
    const result: ProviderServiceRow[][] = [];
    let remaining = [...services];
    while (remaining.length > capacity) {
      const take = Math.min(18, remaining.length - capacity);
      result.push(remaining.slice(0, take));
      remaining = remaining.slice(take);
    }
    result.push(remaining);
    return result;
  }, [services, capacity]);

  return (
    <div ref={node => { previewRef.current = node; }} className={styles.preview} aria-label={`${documentTitle(data.documentType)} PDF preview`}>
      {pages.map((pageServices, pageIndex) => {
        const firstPage = pageIndex === 0;
        const finalPage = pageIndex === pages.length - 1;
        return (
          <section className={styles.page} data-pdf-page key={`${pageIndex}-${pageServices[0]?.id || 'empty'}`}>
            <header className={styles.documentHeader}>
              <div className={styles.logoMark}>OM</div>
              <div><div className={styles.company}>Occu-Med, LTD</div><h2>{documentTitle(data.documentType)}</h2></div>
              <div className={styles.documentNumber}><span>Document</span><strong>{data.documentNumber || '—'}</strong><em>Provider Review</em></div>
            </header>

            {firstPage && (
              <>
                <div className={styles.meta}>
                  <div><span>Prepared for</span><strong>{data.providerName || 'Provider / Facility'}</strong><p>{data.providerContactName || 'Provider contact'}</p>{address.length ? address.map(line => <p key={line}>{line}</p>) : <p>Provider address</p>}<p>{[data.providerPhone, data.providerEmail].filter(Boolean).join(' · ') || 'Provider contact details'}</p></div>
                  <dl><div><dt>Issued</dt><dd>{formatDate(data.issuedDate)}</dd></div><div><dt>Valid through</dt><dd>{formatDate(data.expiresDate)}</dd></div><div><dt>Billing terms</dt><dd>{data.billingTerms || '—'}</dd></div><div><dt>Prepared by</dt><dd>{data.preparedBy}{data.preparedByTitle ? `, ${data.preparedByTitle}` : ''}</dd></div></dl>
                </div>

                <div className={styles.intro}>{data.documentType === 'fee-proposal' ? 'Submit the following fees for Occu-Med review. The provider may remove services that are not available, add relevant services, and return its proposed self-pay rates. A final Provider Service Agreement is issued separately through the secure Occu-Med Forms invitation workflow after review.' : 'This agreement records the services, fees, and operating terms accepted by Occu-Med and the provider. Only services authorized by Occu-Med for a specific referral may be performed and invoiced.'}</div>

                {data.documentType === 'service-agreement' && <div className={styles.terms}>{SERVICE_AGREEMENT_SECTIONS.map((section, index) => <div key={section.title}><span>{index + 1}</span><strong>{section.title}</strong><p>{section.body}</p></div>)}</div>}
              </>
            )}

            <div className={styles.sectionHeading}><span>{firstPage ? 'Services and proposed fees' : 'Services and proposed fees — continued'}</span><span>{pageIndex + 1} / {pages.length}</span></div>
            <table className={styles.servicesTable}><thead><tr><th>Service / Exam Component</th><th>Fee</th><th>Added by</th></tr></thead><tbody>{pageServices.length ? pageServices.map(row => <tr key={row.id}><td>{row.component || '—'}</td><td>{row.price || '—'}</td><td>{row.source === 'provider' ? 'Provider' : 'Occu-Med'}</td></tr>) : <tr><td colSpan={3} className={styles.empty}>No services have been added.</td></tr>}</tbody></table>

            {finalPage && data.notes && <div className={styles.notes}><strong>Notes</strong><p>{data.notes}</p></div>}

            {finalPage && <div className={styles.signatures}><div><span>Prepared by Occu-Med</span><OccuMedSignature /><strong>{data.preparedBy}</strong><p>{data.preparedByTitle}</p><p>{formatDate(data.issuedDate)}</p></div><div><span>Provider pricing response</span>{data.providerSignatureType === 'drawn' && data.providerSignatureData ? <img className={styles.drawnSignature} src={data.providerSignatureData} alt={`Signature of ${data.providerSignerName}`} /> : <strong className={data.providerSignerName ? styles.typedSignature : ''}>{data.providerSignerName || 'Pending provider signature'}</strong>}{data.providerSignatureType === 'drawn' && data.providerSignerName && <p>{data.providerSignerName}</p>}<p>{data.providerSignerTitle || 'Title'}</p><p>{formatDate(data.providerSignedDate)}</p></div></div>}

            <footer><span>Occu-Med · Provider Network Management</span><span>{data.documentNumber || 'Draft'}</span></footer>
          </section>
        );
      })}
    </div>
  );
}

export default function FormsProviderAgreement({ services, specialty }: Props) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ProviderDocumentData>(() => createProviderDocumentData('fee-proposal', services));
  const [newService, setNewService] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as ProviderDocumentData;
        if (draft && draft.documentNumber && Array.isArray(draft.services)) {
          setData({
            ...draft,
            documentType: 'fee-proposal',
            documentNumber: draft.documentType === 'fee-proposal' ? draft.documentNumber : `OM-FP-${Date.now().toString(36).toUpperCase()}`,
          });
        }
      }
    } catch {
      // A malformed browser draft should not block the agreement workflow.
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    setData(current => {
      const byName = new Map(current.services.map(row => [row.component, row]));
      const selected = services.map(service => byName.get(service) || createProviderServiceRow(service));
      const providerAdded = current.services.filter(row => row.source === 'provider' && !services.includes(row.component));
      return { ...current, documentType: 'fee-proposal', services: [...selected, ...providerAdded] };
    });
  }, [services]);

  useEffect(() => {
    if (!data.agreedElectronic || !data.providerSignerName.trim() || data.providerSignedDate) return;
    setData(current => ({ ...current, providerSignedDate: today() }));
  }, [data.agreedElectronic, data.providerSignerName, data.providerSignedDate]);

  useEffect(() => {
    if (!draftLoaded) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        setLastSaved(new Date());
      } catch {
        // Draft persistence is an enhancement only.
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [data, draftLoaded]);

  const set = <K extends keyof ProviderDocumentData>(key: K, value: ProviderDocumentData[K]) => setData(current => ({ ...current, [key]: value }));
  const setAddress = (key: keyof AddressData, value: string) => setData(current => ({ ...current, address: { ...current.address, [key]: value } }));
  const updateService = (id: string, patch: Partial<ProviderServiceRow>) => setData(current => ({ ...current, services: current.services.map(row => row.id === id ? { ...row, ...patch } : row) }));
  const removeService = (id: string) => setData(current => ({ ...current, services: current.services.filter(row => row.id !== id) }));

  const addService = () => {
    const value = newService.trim();
    if (!value) return;
    setData(current => ({ ...current, services: [...current.services, createProviderServiceRow(value, '', 'provider')] }));
    setNewService('');
  };

  const completeAndDownload = async () => {
    const finalData: ProviderDocumentData = {
      ...data,
      documentType: 'fee-proposal',
      providerSignatureData: data.providerSignatureType === 'typed' ? data.providerSignerName : data.providerSignatureData,
      providerSignedDate: data.providerSignedDate || today(),
      electronicConsentText: ELECTRONIC_RECORD_CONSENT_TEXT,
    };
    const errors = validate(finalData);
    if (errors.length) {
      setError(errors[0]);
      return;
    }
    setError('');
    setData(finalData);
    setBusy(true);
    try {
      await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
      if (!previewRef.current) throw new Error('The pricing proposal preview is not ready.');
      const bytes = await providerDocumentPdf(previewRef.current);
      downloadPdf(bytes, safeFilename(finalData));
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Could not generate the PDF.');
    } finally {
      setBusy(false);
    }
  };

  const clearDraft = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    setData(createProviderDocumentData('fee-proposal', services));
    setError('');
    setLastSaved(null);
  };

  const completedServices = data.services.filter(row => row.component.trim() && row.price.trim()).length;

  return (
    <section className={styles.shell} aria-label="Occu-Med provider pricing proposal workflow">
      <div className={styles.launch}>
        <div><span>OCCU-MED FORMS</span><h3>Build the pricing response Occu-Med will review.</h3><p>{specialty} · {services.length} selected service{services.length === 1 ? '' : 's'} · Provider Fee Proposal</p></div>
        <button type="button" onClick={() => setOpen(value => !value)}>{open ? 'Close workspace' : 'Open pricing workspace →'}</button>
      </div>

      {open && <div className={styles.workspace}>
        <div className={styles.toolbar}>
          <div><span>DOCUMENT</span><div className={styles.typeSwitch}><button type="button" className={styles.activeType} disabled>Provider Fee Proposal</button></div></div>
          <div className={styles.status}><span>{completedServices}/{data.services.filter(row => row.component.trim()).length || 0} rates entered</span><span>{lastSaved ? `Draft saved ${lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Local draft'}</span></div>
        </div>

        <div className={styles.layout}>
          <aside className={styles.editor}>
            <div className={styles.editorIntro}><span>YOUR PRICING RESPONSE</span><h4>Provider Fee Proposal</h4><p>Review the requested services, enter your self-pay fees, complete your facility information, and sign the exact pricing response that will be sent to Occu-Med for review.</p></div>

            {error && <div className={styles.error} role="alert">{error}</div>}

            <fieldset><legend>Provider information</legend><label>Provider / Facility Name<input value={data.providerName} onChange={event => set('providerName', event.target.value)} /></label><div className={styles.twoCol}><label>Contact Name<input value={data.providerContactName} onChange={event => set('providerContactName', event.target.value)} /></label><label>Telephone<input value={data.providerPhone} onChange={event => set('providerPhone', event.target.value)} /></label></div><label>Email<input type="email" value={data.providerEmail} onChange={event => set('providerEmail', event.target.value)} /></label></fieldset>

            <fieldset><legend>Provider address</legend><label>Street address<input value={data.address.street1} onChange={event => setAddress('street1', event.target.value)} /></label><label>Suite / Building<input value={data.address.street2} onChange={event => setAddress('street2', event.target.value)} /></label><div className={styles.addressGrid}><label>City<input value={data.address.city} onChange={event => setAddress('city', event.target.value)} /></label><label>State / Region<input value={data.address.state} onChange={event => setAddress('state', event.target.value)} /></label><label>ZIP / Postal<input value={data.address.zip} onChange={event => setAddress('zip', event.target.value)} /></label></div></fieldset>

            <fieldset><legend>Proposal terms</legend><div className={styles.twoCol}><label>Billing terms<select value={data.billingTerms} onChange={event => set('billingTerms', event.target.value)}><option>Net 30</option><option>Net 15</option><option>Other — see notes</option></select></label><label>Pricing valid through<input type="date" value={data.expiresDate} onChange={event => set('expiresDate', event.target.value)} /></label></div></fieldset>

            <fieldset><legend>Services and fees</legend><div className={styles.serviceEditor}>{data.services.map(row => <div className={styles.serviceRow} key={row.id}><input value={row.component} onChange={event => updateService(row.id, { component: event.target.value })} placeholder="Service / exam component" /><input value={row.price} onChange={event => updateService(row.id, { price: event.target.value })} placeholder="$0.00" /><button type="button" onClick={() => removeService(row.id)} aria-label={`Remove ${row.component || 'service'}`}>×</button></div>)}</div><div className={styles.addService}><input value={newService} onChange={event => setNewService(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addService(); } }} placeholder="Add another service" /><button type="button" onClick={addService}>Add</button></div></fieldset>

            <fieldset><legend>Notes or special conditions</legend><textarea value={data.notes} onChange={event => set('notes', event.target.value)} placeholder="Scope details, conditions, exclusions, or other instructions…" /></fieldset>

            <fieldset><legend>Provider pricing response</legend><div className={styles.twoCol}><label>Full legal name<input value={data.providerSignerName} onChange={event => { set('providerSignerName', event.target.value); if (data.providerSignatureType === 'typed') set('providerSignatureData', event.target.value); }} /></label><label>Title / role<input value={data.providerSignerTitle} onChange={event => set('providerSignerTitle', event.target.value)} /></label></div><div className={styles.signatureModes}><button type="button" className={data.providerSignatureType === 'typed' ? styles.activeSignature : ''} onClick={() => { set('providerSignatureType', 'typed'); set('providerSignatureData', data.providerSignerName); }}>Type signature</button><button type="button" className={data.providerSignatureType === 'drawn' ? styles.activeSignature : ''} onClick={() => { set('providerSignatureType', 'drawn'); set('providerSignatureData', ''); }}>Draw signature</button></div>{data.providerSignatureType === 'drawn' ? <SignaturePad value={data.providerSignatureData} onChange={value => set('providerSignatureData', value)} /> : <div className={styles.typedSignatureBox}>{data.providerSignerName || 'Your typed signature will appear here'}</div>}<label className={styles.consent}><input type="checkbox" checked={data.agreedElectronic} onChange={event => set('agreedElectronic', event.target.checked)} /><span>{ELECTRONIC_RECORD_CONSENT_TEXT}</span></label></fieldset>

            <div className={styles.actions}><button type="button" className={styles.secondary} onClick={clearDraft}>Clear draft</button><button type="button" className={styles.primary} disabled={busy} onClick={() => void completeAndDownload()}>{busy ? 'Generating PDF…' : 'Download exact PDF copy'}</button></div>
            <p className={styles.backendNote}>Use the submission handoff immediately below this workspace to send the exact Provider Fee Proposal into Occu-Med for Network Management review. If pricing is accepted, the final Provider Service Agreement is issued through the secure Occu-Med Forms invitation lifecycle.</p>
          </aside>

          <div className={styles.previewColumn}><div className={styles.previewLabel}><span>EXACT PDF PREVIEW</span><strong>{data.documentNumber}</strong></div><ProviderDocumentPreview data={data} previewRef={previewRef} /></div>
        </div>
      </div>}
    </section>
  );
}
