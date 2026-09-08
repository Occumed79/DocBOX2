'use client';

import { useSearchParams } from 'next/navigation';
import FormsProviderAgreement from './FormsProviderAgreement';
import FormsProviderInvitation from './FormsProviderInvitation';
import OpenProviderSubmission from './OpenProviderSubmission';
import styles from './FormsIntegrationPolish.module.css';

type Props = {
  services: string[];
  specialty: string;
};

export default function FormsAgreementRouter({ services, specialty }: Props) {
  const searchParams = useSearchParams();
  const token = searchParams.get('provider_token')?.trim() || '';

  if (token) return <FormsProviderInvitation token={token} />;
  return (
    <div className={styles.integration}>
      <FormsProviderAgreement services={services} specialty={specialty} />
      <OpenProviderSubmission specialty={specialty} />
    </div>
  );
}
