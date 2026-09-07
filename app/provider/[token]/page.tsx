import FormsProviderInvitation from '@/components/forms/FormsProviderInvitation';

type Props = { params: Promise<{ token: string }> };

export default async function ProviderInvitationEntry({ params }: Props) {
  const { token } = await params;
  return <FormsProviderInvitation token={token} />;
}
