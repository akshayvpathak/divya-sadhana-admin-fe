'use client';

import { PieChart } from 'lucide-react';
import { SectionHeading } from '@/components/common/DetailCard';
import CommissionBreakdownCard from '@/components/orders/CommissionBreakdownCard';
import OrderAttribution from '@/components/orders/OrderAttribution';
import { formatINR, formatPercent } from '@/lib/currency';
import { commissionBase, poolAmount, poolPercent } from '@/lib/order-commission';
import type { Order } from '@/schemas/orders.schema';

/**
 * The network side of one order: who earns on it and how much.
 *
 * Two sources, and the better one is not available yet:
 *
 * - `commission_breakdown` is the confirmed split, straight from the commission
 *   ledger. When present it is the whole story and is shown alone.
 * - Until then the order still carries attribution and the rates captured at
 *   checkout, so the pool is worked out from those. Those figures are marked
 *   estimated, because they are derived here rather than read from the ledger.
 */
export default function OrderCommissionSection({ order }: { order: Order }) {
  const breakdown = order.commission_breakdown;
  const base = commissionBase(order);
  const pct = poolPercent(order);
  const pool = poolAmount(order);
  const isPaid = order.payment_status === 'paid' || order.status === 'paid';

  return (
    <div className="space-y-3">
      <SectionHeading icon={<PieChart className="h-3.5 w-3.5" />}>
        Network &amp; commission
      </SectionHeading>

      {breakdown ? (
        <CommissionBreakdownCard breakdown={breakdown} />
      ) : (
        <>
          {/* Money first — this is the line the client reads. */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface px-3.5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-moon">
                Commission is charged on
              </p>
              <p className="mt-0.5 tabular-nums text-base font-bold text-ink">{formatINR(base)}</p>
              <p className="text-[11px] text-moon">
                Order value {formatINR(order.subtotal_amount)} less discount{' '}
                {formatINR(order.discount_amount)}. Shipping and tax are not included.
              </p>
            </div>
            <div className="rounded-xl border border-gold/30 bg-tint/40 px-3.5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gold-deep">
                Total commission pool
              </p>
              <p className="mt-0.5 tabular-nums text-base font-bold text-ink">
                {pool > 0 ? formatINR(pool) : '—'}
              </p>
              <p className="text-[11px] text-moon">
                {pct > 0
                  ? `${formatPercent(pct)} of the amount above, shared between everyone below.`
                  : 'No commission rate was captured on this order.'}
              </p>
            </div>
          </div>

          <OrderAttribution order={order} base={base} />

          <p className="rounded-lg border border-line bg-cream px-3 py-2 text-xs text-charcoal">
            {isPaid
              ? 'These amounts are calculated from each member’s current rate. The confirmed figures are held in the commission ledger and will replace them here once the backend returns the split on the order.'
              : 'The commission is confirmed once payment is captured. Until then these amounts are indicative.'}
          </p>
        </>
      )}
    </div>
  );
}
