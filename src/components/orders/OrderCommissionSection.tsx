'use client';

import { PieChart } from 'lucide-react';
import { SectionHeading } from '@/components/common/DetailCard';
import CommissionBreakdownCard from '@/components/orders/CommissionBreakdownCard';
import OrderAttribution from '@/components/orders/OrderAttribution';
import type { Order } from '@/schemas/orders.schema';

/**
 * The network side of one order: who it is attributed to, and — once the
 * backend computes it — how the commission pool is split between them.
 *
 * Two data sources, deliberately kept apart:
 *
 * - Attribution (`area_trustee` and friends) is stamped on every order at
 *   checkout and is available now.
 * - `commission_breakdown` is computed only when the purchase type actually
 *   pays the network. Product orders do not yet, so it is usually absent; the
 *   card renders nothing rather than a table of ₹0.00 rows, and the note below
 *   explains why the split is not there.
 *
 * When the backend starts returning `commission_breakdown`, the full split —
 * every role, the person in it, their percent and rupees, and whether the slice
 * was retained by Admin — appears here with no further work.
 */
export default function OrderCommissionSection({ order }: { order: Order }) {
  const breakdown = order.commission_breakdown;
  const isPaid = order.payment_status === 'paid' || order.status === 'paid';

  return (
    <div className="space-y-3">
      <SectionHeading icon={<PieChart className="h-3.5 w-3.5" />}>
        Network &amp; commission
      </SectionHeading>

      <OrderAttribution order={order} />

      {breakdown ? (
        <CommissionBreakdownCard breakdown={breakdown} />
      ) : (
        <p className="rounded-lg border border-line bg-cream px-3 py-2 text-xs text-charcoal">
          {isPaid
            ? 'No commission split was recorded for this order. Product orders do not pay the network yet, so no shares were calculated.'
            : 'The commission split is calculated once payment is captured.'}
        </p>
      )}
    </div>
  );
}
