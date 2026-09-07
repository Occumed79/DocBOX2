'use client';

import { useSearchParams } from 'next/navigation';
import FormsProviderAgreement from './FormsProviderAgreement';
import FormsProviderInvitation from './FormsProviderInvitation';

type Props = {
  services: string[];
  specialty: string;
};

export default function FormsAgreementRouter({ services, specialty }: Props) {
  const searchParams = useSearchParams();
  const token = searchParams.get('provider_token')?.trim() || '';

  if (token) return <FormsProviderInvitation token={token} />;
  return <FormsProviderAgreement services={services} specialty={specialty} />;
}
