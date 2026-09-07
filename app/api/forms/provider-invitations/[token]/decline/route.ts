import { formsBackendFetch, formsProviderHeaders, proxyJsonResponse } from '@/lib/forms-backend';

type Context = { params: Promise<{ token: string }> };

export async function POST(request: Request, context: Context) {
  const { token } = await context.params;
  const body = await request.text();
  const response = await formsBackendFetch(`/api/provider-invitations/${encodeURIComponent(token)}/decline`, {
    method: 'POST',
    body,
    headers: formsProviderHeaders(request),
  });
  return proxyJsonResponse(response);
}
