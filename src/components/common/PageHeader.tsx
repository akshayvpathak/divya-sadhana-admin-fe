'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { cn } from '@/lib/utils';
import { Breadcrumbs } from './Breadcrumbs';
import { pageHeaderAtom } from '@/store/page-header';

export interface PageHeaderProps {
  title: React.ReactNode;
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
 * Publishes `title` / `backHref` to the top bar (see pageHeaderAtom) and renders
 * what stays on the page: the breadcrumb trail, the record meta chips, and the
 * right-hand action buttons.
 *
 * The title deliberately does NOT render here — it lives in <Navbar>, which was
 * otherwise an empty strip. Pages keep declaring it through this component, so
 * nothing at the call site changed.
 *
 * There is no `description`: the "Manage platform payments" style subtitle was
 * removed everywhere. The breadcrumb trail already says where you are, so it was
 * pure filler — and it does not fit a 64px-tall bar.
 */
export function PageHeader({
  title,
  backHref,
  actions,
  meta,
  identifier,
  currentLabel,
  loading,
  showBreadcrumbs = true,
  className,
}: PageHeaderProps) {
  const setPageHeader = useSetAtom(pageHeaderAtom);

  useEffect(() => {
    setPageHeader({ title, backHref });
    // Clear on unmount so a route without a PageHeader never inherits the
    // previous page's title.
    return () => setPageHeader(null);
  }, [title, backHref, setPageHeader]);

  // Nothing left to render once title/description have moved out — skip the
  // wrapper entirely rather than leaving an empty spacer div in the flow.
  if (!showBreadcrumbs && !meta && !actions) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        {showBreadcrumbs ? (
          <Breadcrumbs
            identifier={identifier}
            currentLabel={currentLabel}
            loading={loading}
          />
        ) : (
          <span />
        )}

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {meta && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-moon sm:text-sm">
          {meta}
        </div>
      )}
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
