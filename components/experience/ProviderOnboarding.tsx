'use client';

import { useState } from 'react';
import PricingAgreementBuilder from './PricingAgreementBuilder';
import styles from './ProviderExperience.module.css';

const SPECIALTIES = {
  occupational: {
    label: 'Occupational Medicine',
    intro: 'The broadest fit for recurring exam referrals and multi-component occupational health services.',
    services: ['Physical examinations', 'Audiometry', 'Spirometry / PFT', 'EKG', 'Respirator fit testing', 'Drug & alcohol testing', 'Vaccinations'],
    sends: ['Authorization and requested services', 'Exam packet / forms', 'Examinee demographics', 'Scheduling coordination'],
    returns: ['Completed exam documentation', 'Test results / tracings when applicable', 'Requested supporting records', 'Invoice under the agreed fee schedule'],
  },
  cardiology: {
    label: 'Cardiology',
    intro: 'Focused specialty referrals for cardiovascular testing, interpretation, and follow-up evaluation.',
    services: ['Resting 12-lead EKG', 'Treadmill stress testing', 'Cardiology consultation', 'Follow-up evaluation'],
    sends: ['Specific requested test or consultation', 'Relevant authorization', 'Available occupational context', 'Scheduling coordination'],
    returns: ['Final report / interpretation', 'Tracing or test output when applicable', 'Requested clinical documentation', 'Invoice under the agreed fee schedule'],
  },
  dental: {
    label: 'Dental',
    intro: 'Dental-readiness referrals with clear requested imaging and examination components.',
    services: ['Comprehensive dental evaluation', 'Bitewing radiographs', 'Panoramic imaging', 'Full-mouth series when requested', 'Dental readiness documentation'],
    sends: ['Authorized dental scope', 'Required dental forms', 'Examinee demographics', 'Scheduling coordination'],
    returns: ['Completed dental evaluation', 'Requested imaging / findings', 'Required dental documentation', 'Invoice under the agreed fee schedule'],
  },
  laboratory: {
    label: 'Laboratory',
    intro: 'Collection and testing support for employment and deployment medical requirements.',
    services: ['Routine bloodwork', 'Urinalysis', 'QuantiFERON-TB', 'Specimen collection', 'Specialty laboratory panels'],
    sends: ['Requested tests / panel', 'Collection instructions when applicable', 'Examinee demographics', 'Billing authorization'],
    returns: ['Final laboratory results', 'Collection documentation if required', 'Reference / accession information when applicable', 'Invoice under the agreed fee schedule'],
  },
  pharmacy: {
    label: 'Pharmacy / Vaccination',
    intro: 'Vaccination referrals for routine occupational needs, travel, and deployment readiness.',
    services: ['Routine immunizations', 'Travel vaccines', 'Deployment vaccines', 'Vaccine administration records'],
    sends: ['Requested vaccine(s)', 'Authorization', 'Examinee demographics', 'Destination / program context when relevant'],
    returns: ['Administration record', 'Lot / manufacturer documentation when required', 'Updated vaccine record', 'Invoice under the agreed fee schedule'],
  },
  imaging: {
    label: 'Imaging / Diagnostics',
    intro: 'Direct diagnostic referrals for requested imaging and testing that support the larger evaluation.',
    services: ['Chest X-ray', 'Diagnostic radiography', 'Ultrasound when requested', 'Other authorized diagnostic studies'],
    sends: ['Requested study', 'Order / authorization', 'Available clinical context', 'Scheduling coordination'],
    returns: ['Final report', 'Images or access instructions when requested', 'Supporting documentation', 'Invoice under the agreed fee schedule'],
  },
} as const;

type SpecialtyKey = keyof typeof SPECIALTIES;

export default function ProviderOnboarding() {
  const [specialty, setSpecialty] = useState<SpecialtyKey>('occupational');
  const [selectedServices, setSelectedServices] = useState<string[]>([...SPECIALTIES.occupational.services]);

  const chooseSpecialty = (next: SpecialtyKey) => {
    setSpecialty(next);
    setSelectedServices([...SPECIALTIES[next].services]);
  };

  const toggleService = (service: string) => {
    setSelectedServices(previous => previous.includes(service)
      ? previous.filter(item => item !== service)
      : [...previous, service]);
  };

  const activeSpecialty = SPECIALTIES[specialty];

  return (
    <main className={styles.root}>
      <section id="provider-details" className={styles.providerStatic} data-reveal data-visible="true">
        <div className={styles.providerIntro}>
          <span>PROVIDER INFORMATION</span>
          <h2>Show us what your facility does.</h2>
          <p>The content below changes with the provider. The goal is to answer the questions that matter to that specialty before asking for pricing.</p>
        </div>

        <div className={styles.specialtyNav}>
          {(Object.keys(SPECIALTIES) as SpecialtyKey[]).map(key => (
            <button key={key} type="button" onClick={() => chooseSpecialty(key)} className={key === specialty ? styles.specialtyActive : ''}>
              <span>{SPECIALTIES[key].label}</span>
            </button>
          ))}
        </div>

        <div className={styles.providerPanel}>
          <div className={styles.providerPanelLead}>
            <span>YOUR CAPABILITIES</span>
            <h3>{activeSpecialty.label}</h3>
            <p>{activeSpecialty.intro}</p>
          </div>
          <div className={styles.capabilityCloud}>
            {activeSpecialty.services.map(service => (
              <button key={service} type="button" onClick={() => toggleService(service)} className={selectedServices.includes(service) ? styles.capabilitySelected : ''}>
                <i>{selectedServices.includes(service) ? '✓' : '+'}</i>{service}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.exchangeGrid}>
          <article>
            <span>WHAT OCCU-MED SENDS</span>
            <h3>A clear authorization.</h3>
            <ul>{activeSpecialty.sends.map(item => <li key={item}>{item}</li>)}</ul>
          </article>
          <article>
            <span>WHAT COMES BACK</span>
            <h3>Exactly what the case needs.</h3>
            <ul>{activeSpecialty.returns.map(item => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>

        <PricingAgreementBuilder services={selectedServices} specialty={activeSpecialty.label} />
      </section>
    </main>
  );
}
