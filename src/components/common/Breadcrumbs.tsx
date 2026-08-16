'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isIdSegment, labelForSegment } from '@/lib/nav';
import { Skeleton } from '@/components/ui/skeleton';

export interface BreadcrumbsProps {
  /**
   * Human name for the record this page is about — order number, payment ref,
   * product name. Substituted for the first id-looking segment so the trail
   * reads "Orders / #DS-10231 / Edit" instead of "Orders / 8f2c… / Edit".
   */
  identifier?: string | null;
  /** Replaces the last crumb's label outright (e.g. "Edit"). */
  currentLabel?: string;
  /** Shows a shimmer in the identifier slot while the record loads. */
  loading?: boolean;
  className?: string;
}

/** Every path segment stays in the trail so each crumb is navigable; the page
 * supplies a human name for the record id. */
export function Breadcrumbs({
  identifier,
  currentLabel,
  loading,
  className,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  // Only the first id segment gets the record's name; any later one (an
  // /orders/[id]/items/[id] style path) keeps a short hash. Resolved up front
  // rather than with a flag mutated inside the map, which would be a render-
  // phase mutation.
  const firstIdIndex = segments.findIndex(isIdSegment);

  const crumbs = segments.map((segment, i) => {
    // Built from the unfiltered path, so every link actually resolves.
    const href = '/' + segments.slice(0, i + 1).join('/');
    const isId = isIdSegment(segment);
    let label: string;

    if (isId) {
      if (i === firstIdIndex && (identifier || loading)) {
        label = identifier ?? '';
      } else {
        label = `#${segment.slice(0, 8)}`;
      }
    } else {
      label = labelForSegment(segment);
    }

    return { href, label, pending: isId && !identifier && !!loading };
  });

  const last = crumbs.length - 1;
  if (currentLabel) crumbs[last].label = currentLabel;

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs">
        <li className="flex items-center">
          <Link
            href="/dashboard"
            aria-label="Dashboard"
            className="flex items-center rounded-md p-1 text-moon transition-colors hover:bg-tint hover:text-gold-press"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {crumbs.map((crumb, i) => {
          const isLast = i === last;
          return (
            <li key={crumb.href} className="flex min-w-0 items-center">
              <ChevronRight className="mx-0.5 h-3.5 w-3.5 shrink-0 text-line" aria-hidden />
              {crumb.pending ? (
                <Skeleton className="h-3.5 w-24 rounded-full" />
              ) : isLast ? (
                <span aria-current="page" className="truncate font-semibold text-ink">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate rounded-md px-1 py-0.5 text-moon transition-colors hover:bg-tint hover:text-gold-press"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
