'use client';

import { useState } from 'react';
import { downloadPdf, providerDocumentPdf } from './documentCapture';
import styles from './OpenProviderSubmission.module.css';

const DRAFT_KEY = 'occumed-forms-provider-agreement-v1';

type Props = {
  specialty: string;
};

type DraftData = {
  documentType?: string;
  documentNumber?: string;
  providerName?: string;
  providerContactName?: string;
  providerEmail?: string;
  providerPhone?: string;
  address?: { street1?: string; street2?: string; city?: string; state?: string; zip?: string };
  billingTerms?: string;
  services?: Array<{ id?: string; component?: string; price?: string; source?: 'occu-med' | 'provider' }>;
  notes?: string;
  providerSignerName?: string;
  providerSignerTitle?: string;
  providerSignatureType?: string;
  providerSignatureData?: string;
  providerSignedDate?: string;
  agreedElectronic?: boolean;
  electronicConsentText?: string;
};

function wait(milliseconds: number) {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunk, bytes.length)));
  }
  return btoa(binary);
}

function filename(data: DraftData) {
  const provider = String(data.providerName || 'provider').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return `provider-fee-proposal-${provider || 'provider'}.pdf`;
}

function validate(data: DraftData) {
  if (data.documentType !== 'fee-proposal') return 'Public onboarding submits a Provider Fee Proposal first. Switch the workspace back to Fee Proposal; a secure Provider Service Agreement is issued after Occu-Med review.';
  if (!String(data.providerName || '').trim()) return 'Complete the provider or facility name before submitting.';
  if (!String(data.providerContactName || '').trim()) return 'Complete the provider contact name before submitting.';
  if (!/^\S+@\S+\.\S+$/.test(String(data.providerEmail || '').trim())) return 'Enter a valid provider email before submitting.';
  const address = data.address || {};
  if (![address.street1, address.city, address.state, address.zip].every(value => String(value || '').trim())) return 'Complete the provider address before submitting.';
  const services = Array.isArray(data.services) ? data.services.filter(row => String(row.component || '').trim()) : [];
  if (!services.length) return 'Add at least one service before submitting.';
  if (services.some(row => !String(row.price || '').trim())) return 'Enter a fee for every listed service before submitting.';
  if (!String(data.providerSignerName || '').trim() || !String(data.providerSignerTitle || '').trim()) return 'Complete provider acceptance before submitting.';
  if (!data.agreedElectronic) return 'Electronic-record consent is required before submission.';
  return '';
}

export default function OpenProviderSubmission({ specialty }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [website, setWebsite] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      // The Forms editor autosaves after 300 ms and may stamp the signing date
      // in a follow-up render. Wait through both cycles so the submitted JSON
      // and the visible PDF represent the same provider response.
      await wait(720);
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) throw new Error('Open the agreement workspace and complete the pricing proposal before submitting.');

      const data = JSON.parse(raw) as DraftData;
      const validationError = validate(data);
      if (validationError) throw new Error(validationError);

      const preview = document.querySelector<HTMLElement>('[aria-label="Provider Fee Proposal PDF preview"]');
      if (!preview) throw new Error('The Fee Proposal preview is not ready. Open the agreement workspace before submitting.');

      const bytes = await providerDocumentPdf(preview);
      const response = await fetch('/api/provider-onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialty,
          data,
          pdfBase64: bytesToBase64(bytes),
          website,
        }),
      });
      const result = await response.json() as { ok?: boolean; reference?: string; error?: string; nextStep?: string };
      if (!response.ok || !result.ok || !result.reference) throw new Error(result.error || 'Occu-Med could not receive the pricing proposal.');

      setReference(result.reference);
      downloadPdf(bytes, filename(data));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Could not submit the pricing proposal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.shell} aria-label="Submit provider pricing proposal">
      <div className={styles.honeypot} aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></label>
      </div>
      <div className={styles.kicker}>FINAL ONBOARDING HANDOFF</div>
      <div className={styles.layout}>
        <div>
          <h3>{reference ? 'Your pricing response is with Occu-Med.' : 'Send the pricing response into Occu-Med.'}</h3>
          <p>
            {reference
              ? 'A copy of the exact submitted PDF was downloaded for your records. Occu-Med can now review the pricing response from the internal Provider Onboarding Submissions folder.'
              : 'This sends the exact Fee Proposal PDF and its provider/service details into the existing DocBOX vault for Network Management review. It does not bypass the secure Forms agreement process.'}
          </p>
        </div>
        <div className={styles.action}>
          {reference ? (
            <div className={styles.receipt}><span>SUBMISSION REFERENCE</span><strong>{reference}</strong><small>Next: Occu-Med review → secure Service Agreement invitation when approved.</small></div>
          ) : (
            <button type="button" onClick={() => void submit()} disabled={busy}>{busy ? 'Submitting exact PDF…' : 'Submit pricing proposal →'}</button>
          )}
        </div>
      </div>
      {error && <div className={styles.error} role="alert">{error}</div>}
      <p className={styles.security}>A public pricing response is a review submission. Binding Provider Service Agreement execution remains on the authenticated Occu-Med Forms invitation lifecycle.</p>
    </section>
  );
}
