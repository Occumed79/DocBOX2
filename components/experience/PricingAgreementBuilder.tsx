'use client';

import FormsAgreementRouter from '@/components/forms/FormsAgreementRouter';

type Props = {
  services: string[];
  specialty: string;
};

/**
 * Compatibility wrapper retained so the cinematic/provider experience does not
 * need to know whether the provider is self-onboarding or opening an
 * authoritative Occu-Med Forms invitation.
 */
export default function PricingAgreementBuilder({ services, specialty }: Props) {
  return <FormsAgreementRouter services={services} specialty={specialty} />;
}
