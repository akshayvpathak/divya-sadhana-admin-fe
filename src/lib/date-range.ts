// Calendar-day ranges for list filters. Both bounds are inclusive and carry no
// time component — "Last 7 days" means today and the six days before it.

import dayjs from 'dayjs';

/** The wire/`<input type="date">` format both ends of this module speak. */
const ISO_DAY = 'YYYY-MM-DD';

export type DateRangePreset = 'all' | '7' | '15' | '30' | 'custom';

/** Inclusive `YYYY-MM-DD` bounds. Absent keys mean "unbounded on that side". */
export interface DateRange {
  start_date?: string;
  end_date?: string;
}

export const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '15', label: 'Last 15 days' },
  { value: '30', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
];

/** The last `days` days ending today, today included. */
export function presetRange(days: number): Required<DateRange> {
  const end = dayjs();
  return {
    start_date: end.subtract(days - 1, 'day').format(ISO_DAY),
    end_date: end.format(ISO_DAY),
  };
}

/** Today as `YYYY-MM-DD`, for capping date inputs. */
export const today = () => dayjs().format(ISO_DAY);

/**
 * Resolve the control state into the range to send.
 *
 * A custom range only counts once *both* ends are filled and ordered: the
 * orders CSV export returns zero rows for a one-sided range, so a half-filled
 * range would quietly disagree with the list it is supposed to mirror.
 */
export function resolveDateRange(
  preset: DateRangePreset,
  customStart: string,
  customEnd: string
): DateRange {
  if (preset === 'all') return {};
  if (preset === 'custom') {
    if (!customStart || !customEnd || customStart > customEnd) return {};
    return { start_date: customStart, end_date: customEnd };
  }
  return presetRange(Number(preset));
}
