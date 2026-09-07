'use client';

import { useEffect, useMemo, useRef, useState, type MutableRefObject, type PointerEvent } from 'react';
import { downloadPdf, providerDocumentPdf } from './documentCapture';
import styles from './FormsProviderAgreement.module.css';
import inviteStyles from './FormsProviderInvitation.module.css';

type ProviderDocumentType = 'fee-proposal' | 'service-agreement';
type ProviderInvitationStatus = 'draft' | 'sent' | 'viewed' | 'returned' | 'completed' | 'declined' | 'expired' | 'cancelled';
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
  providerSignatureType: 'typed' | 'drawn';
  providerSignatureData: string;
  providerSignedDate: string;
  agreedElectronic: boolean;
  electronicConsentText: string;
  attachments?: string[];
};
type Invitation = {
  documentType: ProviderDocumentType;
  status: ProviderInvitationStatus;
  data: ProviderDocumentData;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  approvedAt?: string;
  electronicRecordConsentText?: string;
};

type Props = { token: string };

const ELECTRONIC_RECORD_CONSENT_TEXT = 'I agree to use electronic records and electronic signatures for this document and understand that my electronic signature has the same legal effect as a handwritten signature.';
const SERVICE_AGREEMENT_SECTIONS = [
  { title: 'Scheduling Process', body: "An Occu-Med team member will coordinate each appointment with the provider's preferred point of contact. Before the patient arrives, Occu-Med will send an authorization containing the patient's demographic information, client and invoicing information, and the services authorized for that visit." },
  { title: 'Reporting Process', body: 'After the authorized services are completed, results and associated paperwork should be sent promptly to harvesting@occu-med.com. Results should be reported as they become available unless Occu-Med provides different instructions for a specific referral.' },
  { title: 'Billing Terms', body: 'Occu-Med will pay undisputed, itemized invoices according to the billing terms shown in this agreement. The payment period begins when Occu-Med receives an invoice that accurately reflects the authorized services performed at the agreed rates. Invoices should be sent to Finance@occu-med.com.' },
] as const;

let rowCounter = 0;
function newProviderRow(component = ''): ProviderServiceRow {
  rowCounter += 1;
  return { id: `provider-service-${Date.now()}-${rowCounter}`, component, price: '', source: 'provider' };
}
function documentTitle(type: ProviderDocumentType) { return type === 'fee-proposal' ? 'Provider Fee Proposal' : 'Provider Service Agreement'; }
function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
  return btoa(binary);
}
function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function validate(data: ProviderDocumentData) {
  const errors: string[] = [];
  if (!data.providerName.trim()) errors.push('Provider or facility name is required.');
  if (!data.providerSignerName.trim()) errors.push('Provider signer name is required.');
  if (!data.providerSignerTitle.trim()) errors.push('Provider signer title is required.');
  if (data.providerSignatureType === 'drawn' && !data.providerSignatureData.startsWith('data:image/png;base64,')) errors.push('Draw your signature before completing the document.');
  if (!data.agreedElectronic) errors.push('Electronic signature consent is required.');
  if (!data.services.some(row => row.component.trim())) errors.push('At least one service is required.');
  return errors;
}

function OccuMedSignature() {
  return <div className={styles.occuSignature} aria-label="Occu-Med verified electronic signature"><svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" strokeLinecap="round"><path d="M32 6C18 6 8 17 8 31c0 10 4 19 11 25"/><path d="M32 11c-11 0-19 9-19 20 0 9 3 16 9 22"/><path d="M32 16c-8 0-14 7-14 15 0 8 3 15 8 21"/><path d="M32 6c14 0 24 11 24 25 0 10-4 19-11 25"/><path d="M32 11c11 0 19 9 19 20 0 9-3 16-9 22"/><path d="M32 16c8 0 14 7 14 15 0 8-3 15-8 21"/></g><text x="32" y="36" textAnchor="middle">OM</text></svg><div><strong>OCCU-MED</strong><span>Verified electronic signature</span></div></div>;
}

function SignaturePad({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(Boolean(value));
  const context = () => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return null;
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#102344';
    return ctx;
  };
  useEffect(() => {
    const canvas = ref.current; const ctx = context();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!value) { setHasInk(false); return; }
    const image = new Image();
    image.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height); setHasInk(true); };
    image.src = value;
  }, [value]);
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * (event.currentTarget.width / rect.width), y: (event.clientY - rect.top) * (event.currentTarget.height / rect.height) };
  };
  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const ctx = context(); if (!ctx) return;
    const p = point(event); ctx.beginPath(); ctx.moveTo(p.x, p.y); drawing.current = true;
  };
  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return;
    const ctx = context(); if (!ctx) return;
    const p = point(event); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasInk(true);
  };
  const finish = () => { if (!drawing.current) return; drawing.current = false; if (ref.current) onChange(ref.current.toDataURL('image/png')); };
  const clear = () => { if (disabled) return; const canvas = ref.current; const ctx = context(); if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); setHasInk(false); onChange(''); };
  return <div className={styles.signaturePad}><canvas ref={ref} width={720} height={220} aria-label="Draw your signature" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}/><span aria-hidden="true"/><button type="button" onClick={clear} disabled={!hasInk || disabled}>Clear</button></div>;
}

function Preview({ data, previewRef, status }: { data: ProviderDocumentData; previewRef: MutableRefObject<HTMLDivElement | null>; status: string }) {
  const rows = data.services.filter(row => row.component.trim() || row.price.trim());
  const capacity = data.documentType === 'service-agreement' ? 7 : 14;
  const pages = useMemo(() => {
    if (rows.length <= capacity) return [rows];
    const output: ProviderServiceRow[][] = []; let remaining = [...rows];
    while (remaining.length > capacity) { const take = Math.min(18, remaining.length - capacity); output.push(remaining.slice(0, take)); remaining = remaining.slice(take); }
    output.push(remaining); return output;
  }, [rows, capacity]);
  const address = [data.address.street1, data.address.street2, [data.address.city, data.address.state, data.address.zip].filter(Boolean).join(', ')].filter(Boolean);
  return <div ref={node => { previewRef.current = node; }} className={styles.preview}>
    {pages.map((pageRows, index) => {
      const first = index === 0; const final = index === pages.length - 1;
      return <section className={styles.page} data-pdf-page key={`${index}-${pageRows[0]?.id || 'empty'}`}>
        <header className={styles.documentHeader}><div className={styles.logoMark}>OM</div><div><div className={styles.company}>Occu-Med, LTD</div><h2>{documentTitle(data.documentType)}</h2></div><div className={styles.documentNumber}><span>Document</span><strong>{data.documentNumber}</strong><em>{status}</em></div></header>
        {first && <><div className={styles.meta}><div><span>Prepared for</span><strong>{data.providerName || 'Provider / Facility'}</strong><p>{data.providerContactName || 'Provider contact'}</p>{address.map(line => <p key={line}>{line}</p>)}<p>{[data.providerPhone, data.providerEmail].filter(Boolean).join(' · ')}</p></div><dl><div><dt>Issued</dt><dd>{formatDate(data.issuedDate)}</dd></div><div><dt>Valid through</dt><dd>{formatDate(data.expiresDate)}</dd></div><div><dt>Billing terms</dt><dd>{data.billingTerms}</dd></div><div><dt>Prepared by</dt><dd>{data.preparedBy}{data.preparedByTitle ? `, ${data.preparedByTitle}` : ''}</dd></div></dl></div><div className={styles.intro}>{data.documentType === 'fee-proposal' ? 'Occu-Med proposes the following fees for the occupational health services listed below. The provider may review the proposal, remove services that are not available, and add services it would like Occu-Med to consider.' : 'This agreement records the services, fees, and operating terms accepted by Occu-Med and the provider. Only services authorized by Occu-Med for a specific referral may be performed and invoiced.'}</div>{data.documentType === 'service-agreement' && <div className={styles.terms}>{SERVICE_AGREEMENT_SECTIONS.map((section, sectionIndex) => <div key={section.title}><span>{sectionIndex + 1}</span><strong>{section.title}</strong><p>{section.body}</p></div>)}</div>}</>}
        <div className={styles.sectionHeading}><span>{first ? 'Services and agreed fees' : 'Services and agreed fees — continued'}</span><span>{index + 1} / {pages.length}</span></div>
        <table className={styles.servicesTable}><thead><tr><th>Service / Exam Component</th><th>Fee</th><th>Added by</th></tr></thead><tbody>{pageRows.map(row => <tr key={row.id}><td>{row.component || '—'}</td><td>{row.price || '—'}</td><td>{row.source === 'provider' ? 'Provider' : 'Occu-Med'}</td></tr>)}</tbody></table>
        {final && data.notes && <div className={styles.notes}><strong>Notes</strong><p>{data.notes}</p></div>}
        {final && <div className={styles.signatures}><div><span>For Occu-Med</span><OccuMedSignature/><strong>{data.preparedBy}</strong><p>{data.preparedByTitle}</p><p>{formatDate(data.issuedDate)}</p></div><div><span>Provider acceptance</span>{data.providerSignatureType === 'drawn' && data.providerSignatureData ? <img className={styles.drawnSignature} src={data.providerSignatureData} alt={`Signature of ${data.providerSignerName}`}/> : <strong className={data.providerSignerName ? styles.typedSignature : ''}>{data.providerSignerName || 'Pending provider signature'}</strong>}{data.providerSignatureType === 'drawn' && data.providerSignerName && <p>{data.providerSignerName}</p>}<p>{data.providerSignerTitle || 'Title'}</p><p>{formatDate(data.providerSignedDate)}</p></div></div>}
        <footer><span>Occu-Med · Provider Network Management</span><span>{data.documentNumber}</span></footer>
      </section>;
    })}
  </div>;
}

export default function FormsProviderInvitation({ token }: Props) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [data, setData] = useState<ProviderDocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [newService, setNewService] = useState('');
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch(`/api/forms/provider-invitations/${encodeURIComponent(token)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('This invitation is invalid, expired, or no longer available.');
        const result = await response.json() as Invitation;
        if (!active) return;
        setInvitation(result);
        setData({ ...result.data, electronicConsentText: result.electronicRecordConsentText || result.data.electronicConsentText || ELECTRONIC_RECORD_CONSENT_TEXT, providerSignatureType: result.data.providerSignatureType || 'typed', providerSignatureData: result.data.providerSignatureData || '' });
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load this invitation.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [token]);

  if (loading) return <section className={inviteStyles.state}><span>OCCU-MED FORMS</span><h2>Loading provider document…</h2></section>;
  if (!invitation || !data) return <section className={inviteStyles.state}><span>OCCU-MED FORMS</span><h2>Invitation unavailable</h2><p>{error}</p></section>;

  const awaitingApproval = invitation.status === 'returned';
  const locked = ['returned', 'completed', 'declined', 'expired', 'cancelled'].includes(invitation.status);
  const set = <K extends keyof ProviderDocumentData>(key: K, value: ProviderDocumentData[K]) => setData(current => current ? { ...current, [key]: value } : current);
  const setAddress = (key: keyof AddressData, value: string) => setData(current => current ? { ...current, address: { ...current.address, [key]: value } } : current);
  const updateService = (id: string, patch: Partial<ProviderServiceRow>) => setData(current => current ? { ...current, services: current.services.map(row => row.id === id ? { ...row, ...patch } : row) } : current);
  const removeService = (id: string) => setData(current => current ? { ...current, services: current.services.filter(row => row.id !== id) } : current);
  const addService = () => { const value = newService.trim(); if (!value) return; setData(current => current ? { ...current, services: [...current.services, newProviderRow(value)] } : current); setNewService(''); };

  const downloadAuthoritative = async (kind: 'document' | 'certificate') => {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/forms/provider-invitations/${encodeURIComponent(token)}/${kind}`);
      if (!response.ok) throw new Error(`Could not download the ${kind}.`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      downloadPdf(bytes, `${data.documentNumber}-${kind}.pdf`);
    } catch (downloadError) { setError(downloadError instanceof Error ? downloadError.message : 'Download failed.'); }
    finally { setBusy(false); }
  };

  const complete = async () => {
    const finalData: ProviderDocumentData = { ...data, providerSignatureData: data.providerSignatureType === 'typed' ? data.providerSignerName : data.providerSignatureData, providerSignedDate: data.providerSignedDate || new Date().toISOString().slice(0, 10), electronicConsentText: ELECTRONIC_RECORD_CONSENT_TEXT };
    const errors = validate(finalData);
    if (errors.length) { setError(errors[0]); return; }
    setData(finalData); setBusy(true); setError('');
    try {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if (!previewRef.current) throw new Error('The document preview is not ready.');
      const pdfBytes = await providerDocumentPdf(previewRef.current);
      const response = await fetch(`/api/forms/provider-invitations/${encodeURIComponent(token)}/finalize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: finalData, signedPdfBase64: bytesToBase64(pdfBytes) }) });
      const result = await response.json() as { status?: ProviderInvitationStatus; requiresReview?: boolean; completedAt?: string; pdfBase64?: string; certificateBase64?: string; error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not return the completed document.');
      setInvitation(current => current ? { ...current, status: result.status || 'completed', completedAt: result.completedAt } : current);
      if (result.pdfBase64) downloadPdf(base64ToBytes(result.pdfBase64), `${finalData.documentNumber}-${result.requiresReview ? 'returned' : 'completed'}.pdf`);
      if (result.certificateBase64) window.setTimeout(() => downloadPdf(base64ToBytes(result.certificateBase64!), `${finalData.documentNumber}-certificate.pdf`), 350);
    } catch (completeError) { setError(completeError instanceof Error ? completeError.message : 'Could not complete the document.'); }
    finally { setBusy(false); }
  };

  const decline = async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/forms/provider-invitations/${encodeURIComponent(token)}/decline`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: declineReason }) });
      const result = await response.json() as { status?: ProviderInvitationStatus; error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not record the decline.');
      setInvitation(current => current ? { ...current, status: 'declined' } : current);
    } catch (declineError) { setError(declineError instanceof Error ? declineError.message : 'Could not record the decline.'); }
    finally { setBusy(false); }
  };

  const previewStatus = awaitingApproval ? 'Pending Occu-Med Approval' : invitation.status === 'completed' ? 'Completed' : invitation.status === 'declined' ? 'Declined' : 'Provider Review';

  return <section className={`${styles.shell} ${inviteStyles.authoritative}`} aria-label="Secure Occu-Med Forms provider invitation">
    <div className={styles.launch}><div><span>SECURE OCCU-MED FORMS INVITATION</span><h3>{documentTitle(data.documentType)}</h3><p>{locked ? previewStatus : 'Review the services, complete your information, sign, and return the document to Occu-Med.'}</p></div>{locked && invitation.status !== 'declined' && <div className={inviteStyles.downloads}><button type="button" disabled={busy} onClick={() => void downloadAuthoritative('document')}>Download document</button><button type="button" disabled={busy} onClick={() => void downloadAuthoritative('certificate')}>Certificate</button></div>}</div>
    <div className={styles.workspace}><div className={styles.layout}><aside className={styles.editor}>
      <div className={styles.editorIntro}><span>YOUR RESPONSE</span><h4>{locked ? previewStatus : 'Complete and return'}</h4><p>{awaitingApproval ? 'Your service or fee changes were returned to Occu-Med and are awaiting approval.' : invitation.status === 'completed' ? 'This agreement is complete and locked.' : invitation.status === 'declined' ? 'This invitation has been declined.' : 'You are editing only the document Occu-Med invited you to review.'}</p></div>
      {error && <div className={styles.error} role="alert">{error}</div>}
      <fieldset disabled={locked}><legend>Provider information</legend><label>Provider / Facility Name<input value={data.providerName} onChange={event => set('providerName', event.target.value)}/></label><div className={styles.twoCol}><label>Contact Name<input value={data.providerContactName} onChange={event => set('providerContactName', event.target.value)}/></label><label>Telephone<input value={data.providerPhone} onChange={event => set('providerPhone', event.target.value)}/></label></div><label>Email<input type="email" value={data.providerEmail} onChange={event => set('providerEmail', event.target.value)}/></label></fieldset>
      <fieldset disabled={locked}><legend>Provider address</legend><label>Street address<input value={data.address.street1} onChange={event => setAddress('street1', event.target.value)}/></label><label>Suite / Building<input value={data.address.street2} onChange={event => setAddress('street2', event.target.value)}/></label><div className={styles.addressGrid}><label>City<input value={data.address.city} onChange={event => setAddress('city', event.target.value)}/></label><label>State / Region<input value={data.address.state} onChange={event => setAddress('state', event.target.value)}/></label><label>ZIP / Postal<input value={data.address.zip} onChange={event => setAddress('zip', event.target.value)}/></label></div></fieldset>
      <fieldset disabled={locked}><legend>Services and fees</legend><div className={styles.serviceEditor}>{data.services.map(row => <div className={styles.serviceRow} key={row.id}><input value={row.component} onChange={event => updateService(row.id,{component:event.target.value})}/><input value={row.price} onChange={event => updateService(row.id,{price:event.target.value})} placeholder="$0.00"/><button type="button" onClick={() => removeService(row.id)} aria-label={`Remove ${row.component}`}>×</button></div>)}</div>{!locked && <div className={styles.addService}><input value={newService} onChange={event => setNewService(event.target.value)} placeholder="Add another service"/><button type="button" onClick={addService}>Add</button></div>}</fieldset>
      <fieldset disabled={locked}><legend>Provider acceptance</legend><div className={styles.twoCol}><label>Full legal name<input value={data.providerSignerName} onChange={event => { set('providerSignerName',event.target.value); if(data.providerSignatureType==='typed') set('providerSignatureData',event.target.value); }}/></label><label>Title / role<input value={data.providerSignerTitle} onChange={event => set('providerSignerTitle',event.target.value)}/></label></div><div className={styles.signatureModes}><button type="button" className={data.providerSignatureType==='typed'?styles.activeSignature:''} onClick={() => {set('providerSignatureType','typed');set('providerSignatureData',data.providerSignerName);}}>Type signature</button><button type="button" className={data.providerSignatureType==='drawn'?styles.activeSignature:''} onClick={() => {set('providerSignatureType','drawn');set('providerSignatureData','');}}>Draw signature</button></div>{data.providerSignatureType==='drawn'?<SignaturePad value={data.providerSignatureData} disabled={locked} onChange={value => set('providerSignatureData',value)}/>:<div className={styles.typedSignatureBox}>{data.providerSignerName||'Your typed signature will appear here'}</div>}<label className={styles.consent}><input type="checkbox" checked={data.agreedElectronic} onChange={event => set('agreedElectronic',event.target.checked)}/><span>{data.electronicConsentText || ELECTRONIC_RECORD_CONSENT_TEXT}</span></label></fieldset>
      {!locked && <><div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => setShowDecline(value => !value)}>Decline document</button><button type="button" className={styles.primary} disabled={busy} onClick={() => void complete()}>{busy?'Returning…':'Accept & Return to Occu-Med'}</button></div>{showDecline && <div className={inviteStyles.decline}><label>Reason (optional)<textarea value={declineReason} maxLength={1000} onChange={event => setDeclineReason(event.target.value)} placeholder="Tell Occu-Med why you are declining…"/></label><button type="button" disabled={busy} onClick={() => void decline()}>Confirm decline</button></div>}</>}
    </aside><div className={styles.previewColumn}><div className={styles.previewLabel}><span>AUTHORITATIVE DOCUMENT PREVIEW</span><strong>{data.documentNumber}</strong></div><Preview data={data} previewRef={previewRef} status={previewStatus}/></div></div></div>
  </section>;
}
