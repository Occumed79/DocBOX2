const DEFAULT_FORMS_API = 'https://occu-med-forms.onrender.com';

export function formsBackendUrl(path: string) {
  const base = (process.env.OCCUMED_FORMS_API_URL || DEFAULT_FORMS_API).replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function formsBackendFetch(path: string, init?: RequestInit) {
  return fetch(formsBackendUrl(path), {
    ...init,
    cache: 'no-store',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
  });
}

export async function proxyJsonResponse(response: Response) {
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export async function proxyBinaryResponse(response: Response) {
  const bytes = await response.arrayBuffer();
  const headers = new Headers({
    'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  const disposition = response.headers.get('content-disposition');
  if (disposition) headers.set('Content-Disposition', disposition);
  return new Response(bytes, { status: response.status, headers });
}
