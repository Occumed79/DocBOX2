import { createHash, randomBytes } from 'node:crypto';
import { query } from '@/db/client';
import { uploadToStorage } from '@/lib/storage';

export const runtime = 'nodejs';

const FOLDER_NAME = 'Provider Onboarding Submissions';
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 8;

type ServiceRow = {
  id?: string;
  component?: string;
  price?: string;
  source?: 'occu-med' | 'provider';
};

type SubmissionData = {
  documentType?: string;
  documentNumber?: string;
  providerName?: string;
  providerContactName?: string;
  providerEmail?: string;
  providerPhone?: string;
  address?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  billingTerms?: string;
  services?: ServiceRow[];
  notes?: string;
  providerSignerName?: string;
  providerSignerTitle?: string;
  providerSignatureType?: string;
  providerSignatureData?: string;
  providerSignedDate?: string;
  agreedElectronic?: boolean;
  electronicConsentText?: string;
};

type SubmissionBody = {
  specialty?: string;
  data?: SubmissionData;
  pdfBase64?: string;
  website?: string;
};

type RateEntry = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __providerSubmissionRates: Map<string, RateEntry> | undefined;
}

function rateStore() {
  if (!globalThis.__providerSubmissionRates) globalThis.__providerSubmissionRates = new Map();
  return globalThis.__providerSubmissionRates;
}

function clientKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const raw = forwarded || request.headers.get('x-real-ip') || 'unknown';
  return createHash('sha256').update(raw).digest('hex').slice(0, 24);
}

function allowed(request: Request) {
  const now = Date.now();
  const key = clientKey(request);
  const store = rateStore();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (current.count >= RATE_LIMIT) return false;
  current.count += 1;
  store.set(key, current);
  return true;
}

function text(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

function safeTag(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}

function reference() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `OM-PR-${date}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

async function onboardingFolderId() {
  const existing = await query<{ id: string }>(
    'SELECT id FROM sv_folders WHERE parent_id IS NULL AND name = $1 ORDER BY created_at ASC LIMIT 1',
    [FOLDER_NAME],
  );
  if (existing[0]?.id) return existing[0].id;

  const created = await query<{ id: string }>(
    'INSERT INTO sv_folders (name, color) VALUES ($1, $2) RETURNING id',
    [FOLDER_NAME, '#2563eb'],
  );
  if (!created[0]?.id) throw new Error('Could not create the provider onboarding folder.');
  return created[0].id;
}

export async function POST(request: Request) {
  if (!allowed(request)) {
    return Response.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
  }

  let body: SubmissionBody;
  try {
    body = await request.json() as SubmissionBody;
  } catch {
    return Response.json({ error: 'Invalid submission payload.' }, { status: 400 });
  }

  // Quiet bot trap. Real users never see or fill this field.
  if (text(body.website, 200)) return Response.json({ ok: true, reference: 'received' });

  const data = body.data || {};
  const specialty = text(body.specialty, 120) || 'Provider';
  const providerName = text(data.providerName, 200);
  const contactName = text(data.providerContactName, 160);
  const email = text(data.providerEmail, 240).toLowerCase();
  const phone = text(data.providerPhone, 80);
  const documentNumber = text(data.documentNumber, 100);
  const billingTerms = text(data.billingTerms, 80);
  const notes = text(data.notes, 5000);
  const address = data.address || {};
  const street1 = text(address.street1, 240);
  const street2 = text(address.street2, 160);
  const city = text(address.city, 120);
  const state = text(address.state, 120);
  const zip = text(address.zip, 40);

  if (data.documentType !== 'fee-proposal') {
    return Response.json({ error: 'Public onboarding accepts pricing proposals only. Service Agreements are issued through a secure Occu-Med invitation.' }, { status: 400 });
  }
  if (!providerName || !contactName || !validEmail(email)) {
    return Response.json({ error: 'Provider name, contact name, and a valid email are required.' }, { status: 400 });
  }
  if (!street1 || !city || !state || !zip) {
    return Response.json({ error: 'A complete provider address is required.' }, { status: 400 });
  }

  const services = Array.isArray(data.services)
    ? data.services.slice(0, 100).map(row => ({
        component: text(row.component, 300),
        price: text(row.price, 80),
        source: row.source === 'provider' ? 'provider' as const : 'occu-med' as const,
      })).filter(row => row.component)
    : [];

  if (!services.length || services.some(row => !row.price)) {
    return Response.json({ error: 'At least one service is required and every listed service must include a fee.' }, { status: 400 });
  }
  if (!text(data.providerSignerName, 160) || !text(data.providerSignerTitle, 160) || !data.agreedElectronic) {
    return Response.json({ error: 'Provider acceptance and electronic-record consent are required before submission.' }, { status: 400 });
  }

  const encoded = text(body.pdfBase64, 20_000_000).replace(/^data:application\/pdf;base64,/, '');
  if (!encoded || !/^[A-Za-z0-9+/=\r\n]+$/.test(encoded)) {
    return Response.json({ error: 'The exact PDF preview is missing or invalid.' }, { status: 400 });
  }

  let pdf: Buffer;
  try {
    pdf = Buffer.from(encoded, 'base64');
  } catch {
    return Response.json({ error: 'The PDF could not be decoded.' }, { status: 400 });
  }
  if (!pdf.length || pdf.length > MAX_PDF_BYTES || !pdf.subarray(0, 4).equals(Buffer.from('%PDF'))) {
    return Response.json({ error: 'The generated PDF is invalid or too large.' }, { status: 400 });
  }

  const submissionReference = reference();
  const originalName = `${submissionReference}-${providerName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80) || 'provider'}.pdf`;
  const storage = await uploadToStorage(pdf, originalName, 'application/pdf');
  const folderId = await onboardingFolderId();

  const sanitized = {
    reference: submissionReference,
    status: 'submitted',
    specialty,
    documentNumber,
    providerName,
    contactName,
    email,
    phone,
    address: { street1, street2, city, state, zip },
    billingTerms,
    services,
    notes,
    providerSignerName: text(data.providerSignerName, 160),
    providerSignerTitle: text(data.providerSignerTitle, 160),
    providerSignatureType: text(data.providerSignatureType, 40),
    providerSignedDate: text(data.providerSignedDate, 40),
    electronicConsentText: text(data.electronicConsentText, 1000),
    submittedAt: new Date().toISOString(),
    nextStep: 'Occu-Med review; secure Provider Service Agreement invitation if approved.',
  };

  const extractedText = [
    `Provider onboarding pricing submission ${submissionReference}`,
    `Provider: ${providerName}`,
    `Specialty: ${specialty}`,
    `Contact: ${contactName} <${email}> ${phone}`,
    `Address: ${[street1, street2, city, state, zip].filter(Boolean).join(', ')}`,
    `Billing terms: ${billingTerms}`,
    ...services.map(row => `${row.component}: ${row.price}`),
    notes ? `Notes: ${notes}` : '',
  ].filter(Boolean).join('\n');

  const specialtyTag = safeTag(specialty);
  const tags = ['provider-onboarding', 'pricing-proposal', 'status-submitted', ...(specialtyTag ? [`specialty-${specialtyTag}`] : [])];

  const rows = await query<{ id: string }>(
    `INSERT INTO sv_files
      (folder_id, name, original_name, file_type, mime_type, size_bytes, storage_url, storage_key, extracted_text, notes, tags)
     VALUES ($1, $2, $3, 'pdf', 'application/pdf', $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      folderId,
      `${providerName} — Pricing Proposal — ${submissionReference}`,
      originalName,
      pdf.length,
      storage.url,
      storage.key,
      extractedText,
      JSON.stringify(sanitized),
      tags,
    ],
  );

  return Response.json({
    ok: true,
    reference: submissionReference,
    fileId: rows[0]?.id || null,
    nextStep: 'Occu-Med will review the pricing response before issuing any final Provider Service Agreement.',
  });
}
