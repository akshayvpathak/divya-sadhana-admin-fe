'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Breadcrumbs } from './Breadcrumbs';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Present => detail variant: renders the back button. */
  backHref?: string;
  /** Right-hand CTA slot. */
  actions?: React.ReactNode;
  /**
   * Status badges / meta chips under the title — the ai-readings pattern:
   * request no. · kind · price · date.
   */
  meta?: React.ReactNode;
  /** Fed to Breadcrumbs so detail pages show the record, not a UUID. */
  identifier?: string | null;
  currentLabel?: string;
  loading?: boolean;
  /** Set false where a trail is noise (dashboard). */
  showBreadcrumbs?: boolean;
  className?: string;
}

/**
 * List variant by default; passing `backHref` gives the detail variant.
 * Titles step `text-2xl sm:text-3xl` — Inter's x-height runs large, and a flat
 * `text-3xl` reads heavy on narrow viewports.
 */
export function PageHeader({
  title,
  description,
  backHref,
  actions,
  meta,
  identifier,
  currentLabel,
  loading,
  showBreadcrumbs = true,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {showBreadcrumbs && (
        <Breadcrumbs
          identifier={identifier}
          currentLabel={currentLabel}
          loading={loading}
        />
      )}

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-3">
          {backHref && (
            <Link href={backHref} className="mt-0.5 shrink-0">
              <Button
                variant="outline"
                size="icon"
                aria-label="Back"
                className="border-line bg-surface text-charcoal hover:border-gold/40 hover:bg-tint hover:text-gold-press"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {title}
            </h1>
            {description && <p className="mt-1 text-sm text-moon">{description}</p>}
            {meta && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-moon sm:text-sm">
                {meta}
              </div>
            )}
          </div>
        </div>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** A meta chip for the `meta` slot — record numbers, SKUs, prices. */
export function MetaChip({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'gold' | 'mono';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'rounded-md border px-2 py-0.5 text-xs font-semibold',
        tone === 'gold' && 'border-gold/25 bg-tint text-gold-press',
        tone === 'mono' && 'border-line bg-cosmos font-mono text-charcoal',
        tone === 'neutral' && 'border-line bg-cosmos text-charcoal',
        className
      )}
    >
      {children}
    </span>
  );
}

/** The separator between meta items. */
export function MetaDot() {
  return (
    <span aria-hidden className="text-line">
      •
    </span>
  );
}
