import { formsBackendFetch, formsProviderHeaders, proxyJsonResponse } from '@/lib/forms-backend';

type Context = { params: Promise<{ token: string }> };

export async function GET(request: Request, context: Context) {
  const { token } = await context.params;
  const response = await formsBackendFetch(`/api/provider-invitations/${encodeURIComponent(token)}`, {
    headers: formsProviderHeaders(request),
  });
  return proxyJsonResponse(response);
}
