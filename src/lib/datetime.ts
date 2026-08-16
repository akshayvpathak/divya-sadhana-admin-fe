// Every formatter returns `null` for missing data, never `'-'` or `'—'` —
// those are non-blank strings, so they slip past `isBlankCell` and the N/A
// chip never fires.

import dayjs from 'dayjs';

type DateInput = string | number | Date | null | undefined;

function parse(value: DateInput) {
  if (value === null || value === undefined || value === '') return null;
  const d = dayjs(value);
  return d.isValid() ? d : null;
}

/** "Mar 4, 2026" */
export const formatDate = (v: DateInput) => parse(v)?.format('MMM D, YYYY') ?? null;

/** "Mar 4, 2026, 6:42 PM" */
export const formatDateTime = (v: DateInput) =>
  parse(v)?.format('MMM D, YYYY, h:mm A') ?? null;

/** "Mar 4, 2026 · 6:42:07 PM" — audit timelines only. */
export const formatStamp = (v: DateInput) =>
  parse(v)?.format('MMM D, YYYY · h:mm:ss A') ?? null;

/** "6:42 PM" */
export const formatTime = (v: DateInput) => parse(v)?.format('h:mm A') ?? null;

/** For `<input type="date">`, which needs '' rather than null. */
export const toDateInput = (v: DateInput) => parse(v)?.format('YYYY-MM-DD') ?? '';

/** For `<input type="datetime-local">`. */
export const toDateTimeInput = (v: DateInput) =>
  parse(v)?.format('YYYY-MM-DDTHH:mm') ?? '';

export { parse as parseDate };
