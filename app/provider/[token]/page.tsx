import { redirect } from 'next/navigation';

type Props = { params: Promise<{ token: string }> };

export default async function ProviderInvitationEntry({ params }: Props) {
  const { token } = await params;
  redirect(`/experience?provider_token=${encodeURIComponent(token)}#provider-details`);
}
