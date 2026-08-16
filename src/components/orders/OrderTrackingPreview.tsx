'use client';

import { ExternalLink, Package } from 'lucide-react';
import { useOrderTrackingQuery } from '@/hooks/queries/useOrdersQuery';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

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
          <p className="text-sm text-charcoal">
            <span className="font-semibold text-ink">{data.shipping_status_label}</span>
            {data.estimated_delivery?.text ? ` · ${data.estimated_delivery.text}` : ''}
          </p>

          {data.courier ? (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wide text-moon">
                  Courier
                </dt>
                <dd className="font-medium text-ink">{data.courier.name}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wide text-moon">
                  Tracking No.
                </dt>
                <dd className="font-mono text-ink">{data.tracking_number || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-moon">
                  Mode
                </dt>
                <dd className="text-charcoal">
                  {data.courier.tracking_mode === 'manual_entry'
                    ? 'Copy & paste on carrier site'
                    : 'Deep link'}
                </dd>
              </div>
              {data.courier.instructions ? (
                <div className="sm:col-span-2 rounded-xl border border-line/60 bg-cream px-3 py-2 text-xs text-charcoal">
                  {data.courier.instructions}
                </div>
              ) : null}
              {data.courier.tracking_page_url ? (
                <div className="sm:col-span-2">
                  <a
                    href={data.courier.tracking_page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-press hover:text-gold-press"
                  >
                    Open carrier tracking page
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="text-sm text-moon">
              {data.message ||
                'Tracking card is in pre-dispatch state until courier + tracking number + dispatched_at are set.'}
            </p>
          )}

          {data.timeline?.length ? (
            <ol className="space-y-2 border-t border-line/60 pt-4">
              {data.timeline.map((step) => (
                <li key={step.key} className="flex items-center justify-between text-sm">
                  <span className={step.done ? 'font-medium text-success-ink' : 'text-moon'}>
                    {step.label}
                  </span>
                  <span className="text-xs text-moon">
                    {step.done ? (step.at ? new Date(step.at).toLocaleString() : 'Done') : 'Pending'}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      )}
    </div>
  );
}
