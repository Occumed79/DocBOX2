import { formsBackendFetch, proxyJsonResponse } from '@/lib/forms-backend';

type Context = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: Context) {
  const { token } = await context.params;
  const response = await formsBackendFetch(`/api/provider-invitations/${encodeURIComponent(token)}`);
  return proxyJsonResponse(response);
}
