'use client';

import { Inbox, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Shared empty state for both the desktop table and the mobile card list. */
export function ListEmptyState({
  message = 'No records found',
  hint = 'Nothing here yet.',
}: {
  message?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tint text-gold-deep">
        <Inbox className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">{message}</p>
        <p className="mt-0.5 text-xs text-moon">{hint}</p>
      </div>
    </div>
  );
}

/**
 * Shared failure state. A list that failed to load previously fell through to
 * "No records found", which reads as an empty dataset rather than an error.
 */
export function ListErrorState({
  error,
  onRetry,
  title = "Couldn't load this list",
}: {
  error?: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-tint text-danger">
        <RotateCw className="h-5 w-5" />
      </div>
      <div className="max-w-md">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-moon">
          {error instanceof Error ? error.message : 'Please try again.'}
        </p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="h-10 gap-1.5 border-line bg-surface px-4 text-sm font-semibold text-charcoal"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
