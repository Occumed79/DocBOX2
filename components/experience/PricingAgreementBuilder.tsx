'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './PricingAgreementBuilder.module.css';

type Props = {
  services: string[];
  specialty: string;
};

type RateMap = Record<string, string>;
type LocationRates = Record<string, RateMap>;
type LocationDetail = {
  address: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

const DEFAULT_LOCATION = 'Primary facility';
const EMPTY_LOCATION: LocationDetail = { address: '', city: '', region: '', postalCode: '', country: 'United States' };

function normalizeRates(services: string[], previous: RateMap): RateMap {
  return Object.fromEntries(services.map(service => [service, previous[service] ?? '']));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character] ?? character));
}

function displayRate(value: string) {
  const number = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(number) && value.trim() ? `$${number.toFixed(2)}` : value.trim() || '—';
}

export default function PricingAgreementBuilder({ services, specialty }: Props) {
  const [open, setOpen] = useState(false);
  const [facilityName, setFacilityName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [sameRates, setSameRates] = useState(true);
  const [locations, setLocations] = useState<string[]>([DEFAULT_LOCATION]);
  const [locationDetails, setLocationDetails] = useState<Record<string, LocationDetail>>({ [DEFAULT_LOCATION]: { ...EMPTY_LOCATION } });
  const [newLocation, setNewLocation] = useState('');
  const [sharedRates, setSharedRates] = useState<RateMap>({});
  const [locationRates, setLocationRates] = useState<LocationRates>({});
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    setSharedRates(previous => normalizeRates(services, previous));
    setLocationRates(previous => {
      const next: LocationRates = {};
      locations.forEach(location => {
        next[location] = normalizeRates(services, previous[location] ?? {});
      });
      return next;
    });
  }, [services, locations]);

  const completedRateCount = useMemo(() => {
    if (sameRates) return services.filter(service => sharedRates[service]?.trim()).length;
    return locations.reduce((count, location) => count + services.filter(service => locationRates[location]?.[service]?.trim()).length, 0);
  }, [sameRates, services, sharedRates, locations, locationRates]);

  const completedLocationCount = useMemo(() => locations.filter(location => {
    const detail = locationDetails[location];
    return Boolean(detail?.address.trim() && detail?.city.trim() && detail?.country.trim());
  }).length, [locations, locationDetails]);

  const requiredRateCount = sameRates ? services.length : services.length * locations.length;
  const identityComplete = Boolean(facilityName.trim() && contactName.trim() && contactEmail.trim());
  const locationsComplete = completedLocationCount === locations.length;
  const ratesComplete = services.length > 0 && completedRateCount === requiredRateCount;
  const ready = identityComplete && locationsComplete && ratesComplete;

  const addLocation = () => {
    const clean = newLocation.trim();
    if (!clean || locations.some(item => item.toLowerCase() === clean.toLowerCase())) return;
    setLocations(previous => [...previous, clean]);
    setLocationDetails(previous => ({ ...previous, [clean]: { ...EMPTY_LOCATION } }));
    setNewLocation('');
  };

  const removeLocation = (location: string) => {
    if (locations.length === 1) return;
    setLocations(previous => previous.filter(item => item !== location));
    setLocationRates(previous => {
      const next = { ...previous };
      delete next[location];
      return next;
    });
    setLocationDetails(previous => {
      const next = { ...previous };
      delete next[location];
      return next;
    });
  };

  const updateLocationDetail = (location: string, field: keyof LocationDetail, value: string) => {
    setLocationDetails(previous => ({
      ...previous,
      [location]: { ...(previous[location] ?? EMPTY_LOCATION), [field]: value },
    }));
  };

  const updateSharedRate = (service: string, value: string) => {
    setSharedRates(previous => ({ ...previous, [service]: value }));
  };

  const updateLocationRate = (location: string, service: string, value: string) => {
    setLocationRates(previous => ({
      ...previous,
      [location]: { ...(previous[location] ?? {}), [service]: value },
    }));
  };

  const printAgreement = () => {
    const popup = window.open('', '_blank', 'width=980,height=900');
    if (!popup) return;

    const locationBlocks = locations.map(location => {
      const detail = locationDetails[location] ?? EMPTY_LOCATION;
      const rateRows = services.map(service => {
        const rate = sameRates ? sharedRates[service] : locationRates[location]?.[service];
        return `<tr><td>${escapeHtml(service)}</td><td>${escapeHtml(displayRate(rate ?? ''))}</td></tr>`;
      }).join('');
      return `
        <section class="location">
          <div class="location-head"><strong>${escapeHtml(location)}</strong><span>${escapeHtml([detail.address, detail.city, detail.region, detail.postalCode, detail.country].filter(Boolean).join(', '))}</span></div>
          <table><thead><tr><th>Authorized service</th><th>Self-pay rate</th></tr></thead><tbody>${rateRows}</tbody></table>
        </section>`;
    }).join('');

    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Occu-Med Provider Fee Schedule</title><style>
      *{box-sizing:border-box}body{margin:0;background:#fff;color:#14242e;font-family:Arial,sans-serif}main{max-width:860px;margin:0 auto;padding:52px 46px 70px}.top{display:flex;justify-content:space-between;gap:30px;padding-bottom:28px;border-bottom:2px solid #17384a}.brand{font-size:13px;font-weight:900;letter-spacing:.18em;color:#17384a}.doc{font-size:10px;letter-spacing:.16em;color:#72808a;text-align:right}.hero{padding:36px 0 28px}.hero h1{margin:0;font:500 44px/1 Georgia,serif;letter-spacing:-.035em}.hero p{margin:12px 0 0;color:#64727b;line-height:1.55}.meta{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid #d8e0e4;border-bottom:1px solid #d8e0e4}.meta div{padding:16px 18px 16px 0}.meta div:nth-child(even){padding-left:22px;border-left:1px solid #d8e0e4}.meta span,.location-head span{display:block;margin-top:5px;color:#6c7880;font-size:11px;line-height:1.5}.meta small{display:block;color:#63839a;font-size:8px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.terms{display:grid;grid-template-columns:repeat(3,1fr);margin:28px 0;border-top:1px solid #d8e0e4;border-bottom:1px solid #d8e0e4}.terms div{padding:16px 18px 16px 0}.terms div+div{padding-left:18px;border-left:1px solid #d8e0e4}.terms small{display:block;color:#63839a;font-size:8px;font-weight:900;letter-spacing:.14em}.terms strong{display:block;margin-top:7px;font:500 20px Georgia,serif}.location{margin-top:30px;break-inside:avoid}.location-head{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:10px}.location-head strong{font:500 25px Georgia,serif}.location-head span{max-width:55%;text-align:right}table{width:100%;border-collapse:collapse}th,td{padding:12px 5px;border-bottom:1px solid #e1e7ea;text-align:left;font-size:12px}th{color:#69767e;font-size:8px;letter-spacing:.14em;text-transform:uppercase}th:last-child,td:last-child{text-align:right}.foot{margin-top:38px;padding-top:18px;border-top:2px solid #17384a;color:#68757d;font-size:10px;line-height:1.6}.foot strong{color:#17384a}@media print{main{padding:24px 26px}.hero h1{font-size:36px}}
    </style></head><body><main>
      <div class="top"><div class="brand">OCCU-MED</div><div class="doc">PROVIDER PARTNERSHIP / FEE SCHEDULE</div></div>
      <div class="hero"><h1>${escapeHtml(facilityName || 'Provider Facility')}</h1><p>${escapeHtml(specialty)} · ${locations.length} location${locations.length === 1 ? '' : 's'} · ${sameRates ? 'shared fee schedule' : 'location-specific fee schedules'}</p></div>
      <div class="meta">
        <div><small>Primary contact</small><strong>${escapeHtml(contactName || '—')}</strong><span>${escapeHtml(contactEmail || '—')}${contactPhone ? ` · ${escapeHtml(contactPhone)}` : ''}</span></div>
        <div><small>Billing contact</small><strong>${escapeHtml(billingEmail || contactEmail || '—')}</strong><span>Post-service invoicing</span></div>
      </div>
      <div class="terms"><div><small>PAYMENT</small><strong>NET 30</strong></div><div><small>WORKFLOW</small><strong>Referral-based</strong></div><div><small>PRICING</small><strong>Self-pay</strong></div></div>
      ${locationBlocks}
      <div class="foot"><strong>Review copy.</strong> This document reflects the provider-entered facility information and proposed fee schedule. Final submission, acceptance, and signature workflow remain subject to the completed Occu-Med provider agreement process.</div>
    </main></body></html>`);
    popup.document.close();
    popup.focus();
    window.setTimeout(() => popup.print(), 250);
  };

  return (
    <div className={styles.shell}>
      <div className={styles.preview}>
        <div>
          <span>PRICING AGREEMENT</span>
          <h3>Your selected services become the fee schedule.</h3>
          <p>{services.length} service{services.length === 1 ? '' : 's'} selected for {specialty}. Add facility, contact, location, and rate details when you&apos;re ready.</p>
        </div>
        <div className={styles.servicePills}>
          {services.length ? services.map(service => <span key={service}>{service}</span>) : <em>Select at least one service above.</em>}
        </div>
        <button type="button" disabled={!services.length} onClick={() => setOpen(value => !value)}>
          {open ? 'Close agreement builder ↑' : 'Build pricing agreement →'}
        </button>
      </div>

      {open && (
        <div className={styles.builder}>
          <div className={styles.builderHead}>
            <span>FEE SCHEDULE BUILDER</span>
            <h3>Turn capability into an executable provider profile.</h3>
            <p>Facility identity, contacts, physical locations, and self-pay rates now stay together in one reviewable agreement workspace.</p>
          </div>

          <div className={styles.identityRow}>
            <label>
              <span>Facility / practice name</span>
              <input value={facilityName} onChange={event => setFacilityName(event.target.value)} placeholder="Practice or facility name" />
            </label>
            <div className={styles.rateMode}>
              <span>Multi-location pricing</span>
              <button type="button" className={sameRates ? styles.modeActive : ''} onClick={() => setSameRates(true)}>Same rates</button>
              <button type="button" className={!sameRates ? styles.modeActive : ''} onClick={() => setSameRates(false)}>Location-specific</button>
            </div>
          </div>

          <div className={styles.contactGrid}>
            <label><span>Primary contact</span><input value={contactName} onChange={event => setContactName(event.target.value)} placeholder="Contact name" /></label>
            <label><span>Contact email</span><input type="email" value={contactEmail} onChange={event => setContactEmail(event.target.value)} placeholder="name@facility.com" /></label>
            <label><span>Contact phone</span><input type="tel" value={contactPhone} onChange={event => setContactPhone(event.target.value)} placeholder="Phone number" /></label>
            <label><span>Billing email</span><input type="email" value={billingEmail} onChange={event => setBillingEmail(event.target.value)} placeholder="Optional if same as contact" /></label>
          </div>

          <div className={styles.locations}>
            <div className={styles.locationHead}>
              <div>
                <span>LOCATIONS</span>
                <h4>{locations.length} facility location{locations.length === 1 ? '' : 's'}</h4>
              </div>
              <div className={styles.addLocation}>
                <input value={newLocation} onChange={event => setNewLocation(event.target.value)} placeholder="Add city / location label" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addLocation(); } }} />
                <button type="button" onClick={addLocation}>Add</button>
              </div>
            </div>

            <div className={styles.locationEditors}>
              {locations.map(location => {
                const detail = locationDetails[location] ?? EMPTY_LOCATION;
                const complete = Boolean(detail.address.trim() && detail.city.trim() && detail.country.trim());
                return (
                  <article key={location} className={styles.locationEditor}>
                    <div className={styles.locationEditorHead}>
                      <div><span>{complete ? 'ADDRESS COMPLETE' : 'ADDRESS NEEDED'}</span><strong>{location}</strong></div>
                      <button type="button" onClick={() => removeLocation(location)} disabled={locations.length === 1}>Remove</button>
                    </div>
                    <div className={styles.addressGrid}>
                      <label className={styles.addressWide}><span>Street address</span><input value={detail.address} onChange={event => updateLocationDetail(location, 'address', event.target.value)} placeholder="Street address" /></label>
                      <label><span>City</span><input value={detail.city} onChange={event => updateLocationDetail(location, 'city', event.target.value)} placeholder="City" /></label>
                      <label><span>State / region</span><input value={detail.region} onChange={event => updateLocationDetail(location, 'region', event.target.value)} placeholder="State / region" /></label>
                      <label><span>Postal code</span><input value={detail.postalCode} onChange={event => updateLocationDetail(location, 'postalCode', event.target.value)} placeholder="Postal code" /></label>
                      <label><span>Country</span><input value={detail.country} onChange={event => updateLocationDetail(location, 'country', event.target.value)} placeholder="Country" /></label>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {sameRates ? (
            <div className={styles.rateTable}>
              <div className={styles.tableHead}><span>Service</span><span>Self-pay rate</span></div>
              {services.map(service => (
                <label key={service}>
                  <strong>{service}</strong>
                  <span className={styles.money}><i>$</i><input inputMode="decimal" value={sharedRates[service] ?? ''} onChange={event => updateSharedRate(service, event.target.value)} placeholder="0.00" /></span>
                </label>
              ))}
            </div>
          ) : (
            <div className={styles.locationTables}>
              {locations.map(location => (
                <div key={location} className={styles.locationTable}>
                  <div className={styles.locationTitle}><span>LOCATION</span><h4>{location}</h4></div>
                  {services.map(service => (
                    <label key={service}>
                      <strong>{service}</strong>
                      <span className={styles.money}><i>$</i><input inputMode="decimal" value={locationRates[location]?.[service] ?? ''} onChange={event => updateLocationRate(location, service, event.target.value)} placeholder="0.00" /></span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className={styles.terms}>
            <article><span>PAYMENT</span><strong>NET 30</strong><p>Post-service invoicing under the agreed fee schedule.</p></article>
            <article><span>WORKFLOW</span><strong>Referral-based</strong><p>Occu-Med authorizes requested services and coordinates the case.</p></article>
            <article><span>PRICING</span><strong>Self-pay</strong><p>Rates entered here are direct provider rates for authorized services.</p></article>
          </div>

          <div className={styles.readiness}>
            <span className={identityComplete ? styles.readyItem : ''}>01 Facility &amp; contact</span>
            <span className={locationsComplete ? styles.readyItem : ''}>02 Location addresses {completedLocationCount}/{locations.length}</span>
            <span className={ratesComplete ? styles.readyItem : ''}>03 Rates {completedRateCount}/{requiredRateCount}</span>
          </div>

          <div className={styles.progressRow}>
            <div>
              <span>{ready ? 'Agreement is ready for review' : 'Complete the highlighted agreement components'}</span>
              <div className={styles.progress}><i style={{ width: `${([identityComplete, locationsComplete, ratesComplete].filter(Boolean).length / 3) * 100}%` }} /></div>
            </div>
            <button type="button" disabled={!ready} onClick={() => setReviewing(true)}>Review agreement →</button>
          </div>

          {reviewing && (
            <div className={styles.review}>
              <div className={styles.reviewHead}><span>AGREEMENT REVIEW</span><button type="button" onClick={() => setReviewing(false)}>Close ×</button></div>
              <h4>{facilityName || 'Facility'}</h4>
              <p>{specialty} · {locations.length} location{locations.length === 1 ? '' : 's'} · {sameRates ? 'shared fee schedule' : 'location-specific fee schedules'}</p>

              <div className={styles.reviewIdentity}>
                <div><span>PRIMARY CONTACT</span><strong>{contactName}</strong><small>{contactEmail}{contactPhone ? ` · ${contactPhone}` : ''}</small></div>
                <div><span>BILLING</span><strong>{billingEmail || contactEmail}</strong><small>NET 30 post-service invoicing</small></div>
              </div>

              <div className={styles.reviewLocations}>
                {locations.map(location => {
                  const detail = locationDetails[location] ?? EMPTY_LOCATION;
                  return (
                    <article key={location}>
                      <div className={styles.reviewLocationHead}>
                        <div><span>LOCATION</span><strong>{location}</strong><small>{[detail.address, detail.city, detail.region, detail.postalCode, detail.country].filter(Boolean).join(', ')}</small></div>
                      </div>
                      <div className={styles.reviewRateRows}>
                        {services.map(service => (
                          <div key={service}><span>{service}</span><strong>{displayRate((sameRates ? sharedRates[service] : locationRates[location]?.[service]) ?? '')}</strong></div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className={styles.reviewTerms}><span>NET 30</span><span>Self-pay</span><span>Referral-based</span></div>
              <div className={styles.reviewActions}>
                <small>This is a review copy. Final electronic submission and signature acceptance are still intentionally disabled.</small>
                <button type="button" onClick={printAgreement}>Print / Save review PDF</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
