import type { Metadata } from 'next';
import FormsProviderInvitation from '@/components/forms/FormsProviderInvitation';

export const metadata: Metadata = {
  title: 'Provider Document | Occu-Med',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

type Props = { params: Promise<{ token: string }> };

export default async function ProviderInvitationEntry({ params }: Props) {
  const { token } = await params;
  return <FormsProviderInvitation token={token} />;
}
