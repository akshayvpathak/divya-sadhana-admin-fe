'use client';

import { PieChart } from 'lucide-react';
import { SectionHeading } from '@/components/common/DetailCard';
import CommissionBreakdownCard from '@/components/orders/CommissionBreakdownCard';
import OrderAttribution from '@/components/orders/OrderAttribution';
import type { Order } from '@/schemas/orders.schema';

/**
 * The network side of one order: who earns on it and how much.
 *
 * `commission_breakdown` is the confirmed split from the ledger and is the only
 * money shown here. It is present on every order for a superuser — including a
 * zeroed shape when there is nothing to split — and null for everyone else,
 * because the same endpoint serves a customer their own order and must not
 * reveal which members profited from their purchase.
 *
 * Nothing on this screen derives amounts any more. An earlier version worked the
 * pool out from `area_commission_percent_snapshot`, which is 15.00 on older
 * orders; the pool has been 12.5% or 14% since 2026-09-04, so that arithmetic
 * overstated it. The ledger is the only source of these figures.
 *
 * Attribution is kept for the case where there is no split to show: it still
 * answers "who would have earned on this" from the members stamped at checkout.
 */
export default function OrderCommissionSection({ order }: { order: Order }) {
  const breakdown = order.commission_breakdown;
  const hasSplit = Boolean(
    breakdown && breakdown.commissionable !== false && (breakdown.slices?.length ?? 0) > 0,
  );

  return (
    <div className="space-y-3">
      <SectionHeading icon={<PieChart className="h-3.5 w-3.5" />}>
        Network &amp; commission
      </SectionHeading>

      {breakdown ? <CommissionBreakdownCard breakdown={breakdown} /> : null}

      {!hasSplit ? (
        <>
          <OrderAttribution order={order} />
          {!breakdown ? (
            <p className="rounded-lg border border-line bg-cream px-3 py-2 text-xs text-charcoal">
              The commission split is visible to administrators only.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
