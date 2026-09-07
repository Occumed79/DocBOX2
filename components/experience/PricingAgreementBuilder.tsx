'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './PricingAgreementBuilder.module.css';

type Props = {
  services: string[];
  specialty: string;
};

type RateMap = Record<string, string>;
type LocationRates = Record<string, RateMap>;

const DEFAULT_LOCATION = 'Primary facility';

function normalizeRates(services: string[], previous: RateMap): RateMap {
  return Object.fromEntries(services.map(service => [service, previous[service] ?? '']));
}

export default function PricingAgreementBuilder({ services, specialty }: Props) {
  const [open, setOpen] = useState(false);
  const [facilityName, setFacilityName] = useState('');
  const [sameRates, setSameRates] = useState(true);
  const [locations, setLocations] = useState<string[]>([DEFAULT_LOCATION]);
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

  const requiredRateCount = sameRates ? services.length : services.length * locations.length;
  const ready = Boolean(facilityName.trim()) && services.length > 0 && completedRateCount === requiredRateCount;

  const addLocation = () => {
    const clean = newLocation.trim();
    if (!clean || locations.some(item => item.toLowerCase() === clean.toLowerCase())) return;
    setLocations(previous => [...previous, clean]);
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

  return (
    <div className={styles.shell}>
      <div className={styles.preview}>
        <div>
          <span>PRICING AGREEMENT</span>
          <h3>Your selected services become the fee schedule.</h3>
          <p>{services.length} service{services.length === 1 ? '' : 's'} selected for {specialty}. Add facility details and rates when you&apos;re ready.</p>
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
            <h3>Set the commercial terms without leaving the provider flow.</h3>
            <p>This is a working front-end agreement builder. Submission and PDF generation come after the review step is finalized.</p>
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

          <div className={styles.locations}>
            <div className={styles.locationHead}>
              <div>
                <span>LOCATIONS</span>
                <h4>{locations.length} facility location{locations.length === 1 ? '' : 's'}</h4>
              </div>
              <div className={styles.addLocation}>
                <input value={newLocation} onChange={event => setNewLocation(event.target.value)} placeholder="Add city / location" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addLocation(); } }} />
                <button type="button" onClick={addLocation}>Add</button>
              </div>
            </div>
            <div className={styles.locationPills}>
              {locations.map(location => (
                <span key={location}>{location}<button type="button" onClick={() => removeLocation(location)} disabled={locations.length === 1} aria-label={`Remove ${location}`}>×</button></span>
              ))}
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

          <div className={styles.progressRow}>
            <div>
              <span>{completedRateCount} / {requiredRateCount} rates entered</span>
              <div className={styles.progress}><i style={{ width: `${requiredRateCount ? (completedRateCount / requiredRateCount) * 100 : 0}%` }} /></div>
            </div>
            <button type="button" disabled={!ready} onClick={() => setReviewing(true)}>Review agreement →</button>
          </div>

          {reviewing && (
            <div className={styles.review}>
              <div className={styles.reviewHead}><span>REVIEW</span><button type="button" onClick={() => setReviewing(false)}>Close ×</button></div>
              <h4>{facilityName || 'Facility'}</h4>
              <p>{specialty} · {locations.length} location{locations.length === 1 ? '' : 's'} · {sameRates ? 'shared fee schedule' : 'location-specific fee schedules'}</p>
              <div className={styles.reviewTerms}><span>NET 30</span><span>Self-pay</span><span>Referral-based</span></div>
              <small>Submission, signature capture, and generated agreement PDF are intentionally not activated yet.</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
