import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export type StatTone = 'gold' | 'royal' | 'success' | 'warning' | 'danger' | 'info' | 'plum';

/** Tinted icon tile + label + value. Tinted, not solid — saturated blocks
 * fight a cream page. */
const TONES: Record<StatTone, string> = {
  gold: 'bg-tint text-gold-deep',
  royal: 'bg-royal-tint text-royal',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger',
  info: 'bg-info-tint text-info',
  plum: 'bg-plum-tint text-plum',
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: StatTone;
  loading?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'gold',
  loading = false,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-surface px-3.5 py-3 shadow-card sm:px-4 sm:py-3.5',
        className
      )}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        {icon && (
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10',
              TONES[tone]
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-moon sm:text-[11px]">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-16" />
          ) : (
            <p className="truncate text-lg font-semibold tabular-nums text-ink sm:text-xl">
              {value}
            </p>
          )}
          {hint && <p className="mt-0.5 text-xs text-moon">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
