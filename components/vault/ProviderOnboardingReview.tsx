'use client';

import { useMemo, useState } from 'react';
import { type VaultFile } from './file-model';
import styles from './ProviderOnboardingReview.module.css';

type ServiceRow = { component?: string; price?: string; source?: string };
type SubmissionNote = {
  reference?: string;
  status?: string;
  specialty?: string;
  documentNumber?: string;
  providerName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: { street1?: string; street2?: string; city?: string; state?: string; zip?: string };
  billingTerms?: string;
  services?: ServiceRow[];
  notes?: string;
  providerSignerName?: string;
  providerSignerTitle?: string;
  providerSignedDate?: string;
  submittedAt?: string;
  nextStep?: string;
};

type ReviewStatus = 'submitted' | 'in-review' | 'ready-for-forms' | 'declined';

const STATUS_LABELS: Record<ReviewStatus, string> = {
  submitted: 'Submitted',
  'in-review': 'In review',
  'ready-for-forms': 'Ready for Forms',
  declined: 'Declined',
};

function parseSubmission(notes: string): SubmissionNote | null {
  try {
    const parsed = JSON.parse(notes) as SubmissionNote;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeStatus(value?: string): ReviewStatus {
  return value === 'in-review' || value === 'ready-for-forms' || value === 'declined' ? value : 'submitted';
}

function addressLine(address?: SubmissionNote['address']) {
  if (!address) return '—';
  return [address.street1, address.street2, address.city, address.state, address.zip].filter(Boolean).join(', ') || '—';
}

export default function ProviderOnboardingReview({ file, onUpdate, onError }: {
  file: VaultFile;
  onUpdate: (file: VaultFile) => void;
  onError: (message: string) => void;
}) {
  const submission = useMemo(() => parseSubmission(file.notes || ''), [file.notes]);
  const [pending, setPending] = useState(false);

  if (!file.tags?.includes('provider-onboarding') || !submission) return null;

  const status = normalizeStatus(submission.status);
  const services = Array.isArray(submission.services) ? submission.services.filter(row => row.component) : [];

  const updateStatus = async (nextStatus: ReviewStatus) => {
    if (pending || nextStatus === status) return;
    setPending(true);
    try {
      const nextNote: SubmissionNote = {
        ...submission,
        status: nextStatus,
        nextStep: nextStatus === 'ready-for-forms'
          ? 'Pricing reviewed; create a secure Provider Service Agreement invitation in Occu-Med Forms.'
          : nextStatus === 'declined'
            ? 'Pricing response declined / not proceeding.'
            : nextStatus === 'in-review'
              ? 'Network Management pricing review in progress.'
              : submission.nextStep,
      };
      const retainedTags = (file.tags || []).filter(tag => !tag.startsWith('status-'));
      const tags = [...retainedTags, `status-${nextStatus}`];
      const response = await fetch('/api/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: file.id, notes: JSON.stringify(nextNote), tags }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || 'Could not update the provider review status.');
      }
      const updated = await response.json() as VaultFile;
      onUpdate({ ...file, notes: updated.notes, tags: updated.tags });
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not update the provider review status.');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className={styles.panel} aria-label="Provider onboarding review">
      <div className={styles.header}>
        <div>
          <span>PROVIDER ONBOARDING</span>
          <h3>{submission.providerName || file.name}</h3>
          <p>{submission.reference || 'Pricing submission'} · {submission.specialty || 'Provider'}</p>
        </div>
        <strong data-status={status}>{STATUS_LABELS[status]}</strong>
      </div>

      <div className={styles.meta}>
        <div><span>Contact</span><strong>{submission.contactName || '—'}</strong><p>{submission.email || '—'}</p><p>{submission.phone || '—'}</p></div>
        <div><span>Location</span><strong>{addressLine(submission.address)}</strong></div>
        <div><span>Terms</span><strong>{submission.billingTerms || '—'}</strong><p>{submission.documentNumber || 'Fee Proposal'}</p></div>
      </div>

      <div className={styles.services}>
        <div className={styles.sectionTitle}><span>Submitted services & fees</span><strong>{services.length}</strong></div>
        {services.length ? services.map((service, index) => (
          <div className={styles.service} key={`${service.component}-${index}`}>
            <span>{service.component}</span>
            <strong>{service.price || '—'}</strong>
            <small>{service.source === 'provider' ? 'Provider added' : 'Occu-Med requested'}</small>
          </div>
        )) : <p className={styles.empty}>No service rows were stored.</p>}
      </div>

      {submission.notes ? <div className={styles.notes}><span>Provider notes</span><p>{submission.notes}</p></div> : null}

      <div className={styles.actions}>
        <a href={file.storage_url} target="_blank" rel="noreferrer">Open submitted PDF ↗</a>
        <button type="button" onClick={() => void updateStatus('in-review')} disabled={pending || status === 'in-review'}>Mark in review</button>
        <button type="button" onClick={() => void updateStatus('ready-for-forms')} disabled={pending || status === 'ready-for-forms'}>Ready for Forms</button>
        <button type="button" className={styles.decline} onClick={() => void updateStatus('declined')} disabled={pending || status === 'declined'}>Decline</button>
      </div>

      {status === 'ready-for-forms' ? (
        <div className={styles.nextStep}><span>NEXT ACTION</span><strong>Create the secure Provider Service Agreement invitation in Occu-Med Forms.</strong><p>The pricing response stays in DocBOX as the review record; the binding agreement remains on the Forms audit/signing lifecycle.</p></div>
      ) : null}
    </section>
  );
}
