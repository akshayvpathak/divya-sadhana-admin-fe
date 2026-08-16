import React from 'react';
import { parseDate } from '@/lib/datetime';

/**
 * Stacked date over time for table cells — the Donations pattern, generalised.
 * Returns null when there is no date so the DataTable's N/A chip takes over.
 */
export function DateTimeCell({ value }: { value: string | number | Date | null | undefined }) {
  const d = parseDate(value);
  if (!d) return null;

  return (
    <span className="flex flex-col leading-tight">
      <span className="font-medium text-ink">{d.format('MMM D, YYYY')}</span>
      <span className="text-xs text-moon">{d.format('h:mm A')}</span>
    </span>
  );
}
