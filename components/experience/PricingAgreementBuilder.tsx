'use client';

import FormsProviderAgreement from '@/components/forms/FormsProviderAgreement';

type Props = {
  services: string[];
  specialty: string;
};

/**
 * Compatibility wrapper retained so the cinematic/provider experience does not
 * need to know that the agreement implementation now comes from Occu-Med Forms.
 */
export default function PricingAgreementBuilder({ services, specialty }: Props) {
  return <FormsProviderAgreement services={services} specialty={specialty} />;
}
