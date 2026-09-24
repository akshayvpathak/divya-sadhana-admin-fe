import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
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
  /** Turns the whole card into a link to the list this number came from. */
  href?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'gold',
  loading = false,
  className,
  href,
}: StatCardProps) {
  const body = (
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
      <div className={cn('min-w-0 flex-1', href && 'pr-4')}>
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
      {href && (
        // Out of flow: in a five-across grid the label needs every pixel, and
        // an inline arrow wraps "Total Categories" onto a second line.
        <ArrowUpRight
          aria-hidden="true"
          className="absolute right-2.5 top-2.5 h-4 w-4 text-line transition-colors group-hover:text-gold-deep"
        />
      )}
    </div>
  );

  const shell =
    'relative rounded-2xl border border-line bg-surface px-3.5 py-3 shadow-card sm:px-4 sm:py-3.5';

  if (!href) {
    return <div className={cn(shell, className)}>{body}</div>;
  }

  return (
    <Link
      href={href}
      aria-label={`${label} — open list`}
      className={cn(
        shell,
        'group block transition-shadow duration-200 hover:shadow-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
        className
      )}
    >
      {body}
    </Link>
  );
}
