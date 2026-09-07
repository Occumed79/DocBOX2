'use client';

import type { VaultFile } from './file-model';
import styles from './ProviderOnboardingQueueBar.module.css';

export type ProviderQueueFilter = 'all' | 'submitted' | 'in-review' | 'ready-for-forms' | 'declined';

const FILTERS: Array<{ id: ProviderQueueFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'submitted', label: 'New' },
  { id: 'in-review', label: 'In review' },
  { id: 'ready-for-forms', label: 'Ready for Forms' },
  { id: 'declined', label: 'Declined' },
];

export function providerQueueStatus(file: VaultFile): Exclude<ProviderQueueFilter, 'all'> {
  const tag = (file.tags || []).find(value => value.startsWith('status-')) || 'status-submitted';
  const value = tag.slice('status-'.length);
  return value === 'in-review' || value === 'ready-for-forms' || value === 'declined' ? value : 'submitted';
}

export default function ProviderOnboardingQueueBar({ files, value, onChange }: {
  files: VaultFile[];
  value: ProviderQueueFilter;
  onChange: (value: ProviderQueueFilter) => void;
}) {
  const counts = FILTERS.reduce<Record<ProviderQueueFilter, number>>((result, filter) => {
    result[filter.id] = filter.id === 'all' ? files.length : files.filter(file => providerQueueStatus(file) === filter.id).length;
    return result;
  }, { all: 0, submitted: 0, 'in-review': 0, 'ready-for-forms': 0, declined: 0 });

  return (
    <section className={styles.bar} aria-label="Provider onboarding review queue">
      <div className={styles.copy}>
        <span>NETWORK MANAGEMENT</span>
        <strong>Provider onboarding review queue</strong>
        <p>Pricing responses land here first. Review the submitted PDF and fee schedule, then move approved responses to Ready for Forms before issuing the secure Service Agreement invitation.</p>
      </div>
      <div className={styles.filters}>
        {FILTERS.map(filter => (
          <button type="button" key={filter.id} className={value === filter.id ? styles.active : ''} onClick={() => onChange(filter.id)}>
            <span>{filter.label}</span><strong>{counts[filter.id]}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
