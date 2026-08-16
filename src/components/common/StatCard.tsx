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
        'rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-card',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              TONES[tone]
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-moon">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-16" />
          ) : (
            <p className="text-xl font-semibold tabular-nums text-ink">{value}</p>
          )}
          {hint && <p className="mt-0.5 text-xs text-moon">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
