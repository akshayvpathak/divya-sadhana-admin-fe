/**
 * Operator-facing view of AI reading failures.
 *
 * Deliberately separate from the storefront's user copy: support does not need
 * "retake in daylight", it needs to know within a second whether this was the
 * user's photo or our infrastructure.
 *
 * Readings are now screened by a pre-check before generation, so `failed` has
 * become a common, information-rich state rather than an alarm.
 */

export type FailureClass =
  | 'precheck_subject'
  | 'precheck_quality'
  | 'policy'
  | 'provider'
  | 'parsing';

export interface FailureMeta {
  label: string;
  /** One line an operator can read out to a user. */
  meaning: string;
  klass: FailureClass;
}

export const FAILURE_CLASS_META: Record<
  FailureClass,
  { label: string; blame: string; badgeClass: string }
> = {
  precheck_subject: {
    label: 'Pre-check · wrong subject',
    blame: 'User fixable',
    badgeClass: 'bg-warning-tint text-warning-ink border-warning/25',
  },
  precheck_quality: {
    label: 'Pre-check · image quality',
    blame: 'User fixable',
    badgeClass: 'bg-warning-tint text-warning-ink border-warning/25',
  },
  policy: {
    label: 'Policy refusal',
    blame: 'Refused by design',
    badgeClass: 'bg-cosmos text-charcoal border-line',
  },
  provider: {
    label: 'Provider / infrastructure',
    blame: 'Our problem',
    badgeClass: 'bg-danger-tint text-danger-ink border-danger/25',
  },
  parsing: {
    label: 'Output parsing',
    blame: 'Our problem',
    badgeClass: 'bg-danger-tint text-danger-ink border-danger/25',
  },
};

const MAP: Record<string, FailureMeta> = {
  wrong_subject_palm: {
    label: 'No palm detected',
    meaning: 'The photo did not contain a palm.',
    klass: 'precheck_subject',
  },
  wrong_subject_face: {
    label: 'No face detected',
    meaning: 'The photo did not contain a face.',
    klass: 'precheck_subject',
  },
  back_of_hand: {
    label: 'Back of hand',
    meaning: 'A hand, but the wrong side — no lines visible.',
    klass: 'precheck_subject',
  },
  multiple_subjects: {
    label: 'Multiple subjects',
    meaning: 'More than one person or hand in frame.',
    klass: 'precheck_subject',
  },
  poor_lighting: {
    label: 'Too dark',
    meaning: 'Lighting was insufficient to read detail.',
    klass: 'precheck_quality',
  },
  blurry: {
    label: 'Blurry',
    meaning: 'Camera shake or focus miss.',
    klass: 'precheck_quality',
  },
  too_far: {
    label: 'Too far away',
    meaning: 'The subject did not fill enough of the frame.',
    klass: 'precheck_quality',
  },
  obstructed: {
    label: 'Obstructed',
    meaning: 'Something covered part of the subject.',
    klass: 'precheck_quality',
  },
  minor_subject: {
    label: 'Minor in photograph',
    meaning:
      'The subject appeared to be a child. Refused by design — the storefront offers no retry for this.',
    klass: 'policy',
  },
  provider_failure: {
    label: 'Provider failure',
    meaning: 'The model provider errored or timed out.',
    klass: 'provider',
  },
  empty_response: {
    label: 'Empty response',
    meaning: 'The provider returned nothing usable.',
    klass: 'provider',
  },
  rate_limited: {
    label: 'Rate limited',
    meaning: 'We were throttled by the provider.',
    klass: 'provider',
  },
  unparseable_output: {
    label: 'Unparseable output',
    meaning: 'The model returned text we could not parse into a report.',
    klass: 'parsing',
  },
  schema_mismatch: {
    label: 'Schema mismatch',
    meaning: 'The model returned valid JSON in the wrong shape.',
    klass: 'parsing',
  },
};

/**
 * Never throws and never narrows: an unrecognised code from a future backend
 * release must still render, not blank the page.
 */
export function describeFailure(code?: string | null): FailureMeta {
  if (code && MAP[code]) return MAP[code];
  return {
    label: code || 'Unknown failure',
    meaning: 'No mapped explanation — check the raw reason below.',
    klass: 'provider',
  };
}

/** Options for the list filter, grouped so pre-check codes read together. */
export const failureCodeOptions = [
  { value: 'all', label: 'Any failure' },
  ...Object.entries(MAP).map(([value, meta]) => ({ value, label: meta.label })),
];

/** How long the attempt ran — a 2s pre-check reject looks nothing like a 15s timeout. */
export function durationLabel(
  startedAt?: string | null,
  completedAt?: string | null,
): string | null {
  if (!startedAt || !completedAt) return null;
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}
