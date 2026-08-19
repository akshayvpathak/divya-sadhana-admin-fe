'use client';

import { ExternalLink, Info, Package } from 'lucide-react';
import { useOrderTrackingQuery } from '@/hooks/queries/useOrdersQuery';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import { formatStamp } from '@/lib/datetime';

type Props = {
  orderId: string;
  /** Drop the card chrome when rendered as a section of a larger card. */
  embedded?: boolean;
};

export default function OrderTrackingPreview({ orderId, embedded = false }: Props) {
  const { data, isLoading, error } = useOrderTrackingQuery(orderId);

  return (
    <div
      className={cn(
        !embedded && 'rounded-2xl border border-line bg-surface p-6 shadow-sm'
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-moon">
          <Package className="h-4 w-4" />
          Customer tracking preview
        </h3>
        {data ? <StatusBadge status={data.shipping_status} type="shipping_status" /> : null}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error ? (
        <p className="text-sm text-danger">
          {(error as Error).message || 'Could not load tracking preview'}
        </p>
      ) : !data ? (
        <p className="text-sm text-moon">No tracking payload</p>
      ) : (
        <div className="space-y-4">
          {/* The headline state the customer sees, given its own surface so it
              stops reading as a stray sentence above the timeline. */}
          <div className="rounded-xl border border-line bg-cream px-4 py-3">
            <p className="text-sm font-semibold text-ink">{data.shipping_status_label}</p>
            {data.estimated_delivery?.text ? (
              <p className="mt-0.5 text-xs text-moon">{data.estimated_delivery.text}</p>
            ) : null}
          </div>

          {data.courier ? (
            <>
              {/* Same hairline strip as the fulfillment milestones, so the two
                  stacked sections read as one system. */}
              <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
                <div className="bg-surface px-3.5 py-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-moon">
                    Courier
                  </dt>
                  <dd className="mt-1.5 text-sm font-medium text-ink">{data.courier.name}</dd>
                </div>
                <div className="bg-surface px-3.5 py-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-moon">
                    Tracking No.
                  </dt>
                  <dd className="mt-1.5 font-mono text-sm text-ink">
                    {data.tracking_number || '—'}
                  </dd>
                </div>
                <div className="col-span-2 bg-surface px-3.5 py-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-moon">
                    Mode
                  </dt>
                  <dd className="mt-1.5 text-sm text-charcoal">
                    {data.courier.tracking_mode === 'manual_entry'
                      ? 'Copy & paste on carrier site'
                      : 'Deep link'}
                  </dd>
                </div>
              </dl>

              {data.courier.instructions ? (
                <p className="rounded-xl border border-line/60 bg-cream px-3.5 py-2.5 text-xs text-charcoal">
                  {data.courier.instructions}
                </p>
              ) : null}

              {data.courier.tracking_page_url ? (
                <a
                  href={data.courier.tracking_page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-press hover:text-ink"
                >
                  Open carrier tracking page
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </>
          ) : (
            // Pre-dispatch is an expected state, not an error — an info note
            // rather than the grey orphan sentence it used to be.
            <div className="flex gap-2.5 rounded-xl border border-info/20 bg-info-tint px-3.5 py-2.5">
              <Info className="mt-px h-3.5 w-3.5 shrink-0 text-info-ink" aria-hidden />
              <p className="text-xs leading-relaxed text-info-ink">
                {data.message ||
                  'Tracking card is in pre-dispatch state until courier + tracking number + dispatched_at are set.'}
              </p>
            </div>
          )}

          {data.timeline?.length ? (
            // A real timeline: dot per milestone with a connecting rail, so
            // progress is legible at a glance. The dot is w-3 and the rail is
            // centred on 6px, so the two line up without fractional offsets.
            <ol className="border-t border-line/60 pt-4">
              {data.timeline.map((step, i) => {
                const isLast = i === data.timeline.length - 1;
                return (
                  <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
                    {!isLast && (
                      <span
                        aria-hidden
                        className="absolute left-1.5 top-5 h-full w-px -translate-x-1/2 bg-line"
                      />
                    )}
                    <span
                      aria-hidden
                      className={cn(
                        'relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full ring-2 ring-surface',
                        step.done ? 'bg-success' : 'bg-line'
                      )}
                    />
                    <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span
                        className={cn(
                          'text-sm',
                          step.done ? 'font-semibold text-ink' : 'text-moon'
                        )}
                      >
                        {step.label}
                      </span>
                      <span className="text-xs tabular-nums text-moon">
                        {step.done ? formatStamp(step.at) ?? 'Done' : 'Pending'}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      )}
    </div>
  );
}
