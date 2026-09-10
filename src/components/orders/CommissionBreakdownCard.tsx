'use client';

import { StatusBadge } from '@/components/ui/status-badge';
import { formatINR, formatPercent } from '@/lib/currency';
import {
  breakdownRoleLabel,
  retentionReasonLabel,
  sortBreakdownSlices,
} from '@/lib/commission-breakdown';
import type { CommissionBreakdown } from '@/schemas/orders.schema';

/**
 * The confirmed commission split for one order, straight from the ledger.
 *
 * Four layers are written on every sale whether or not the seats are filled, so
 * the slices always sum to the pool: a share nobody received is a retained row
 * carrying its reason, never a silent gap. A retained row therefore has no
 * beneficiary at all — `beneficiary_id` and `beneficiary_name` are both null by
 * database constraint, so retained money can never look as though it credited
 * someone. Branch on `is_retained`; never infer it from a missing name.
 *
 * `pool_percent` is summed from this order's own captured rates — 12.5% when the
 * referral link belongs to a Trustee or State Executive, 14% when a District
 * President owns it — so it is rendered, never assumed.
 */
export default function CommissionBreakdownCard({
  breakdown,
}: {
  breakdown: CommissionBreakdown;
}) {
  const slices = sortBreakdownSlices(breakdown.slices ?? []);
  const commissionable = breakdown.commissionable !== false;

  // Same shape arrives for orders paid before commission was enabled, returned
  // orders, and anything with no sale row.
  if (!commissionable || slices.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-cream px-3 py-2.5 text-xs text-charcoal">
        No commission was calculated for this order. That applies to orders paid before commission
        was switched on, returned orders, and purchases that do not pay the network.
      </p>
    );
  }

  const retainedCount = slices.filter((s) => s.is_retained || s.is_fallback_to_admin).length;

  return (
    <div className="space-y-3">
      {/* Money first — these three figures are what a non-technical reader needs. */}
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-moon">
            Commission is charged on
          </p>
          <p className="mt-0.5 tabular-nums text-base font-bold text-ink">
            {formatINR(breakdown.base_amount)}
          </p>
          <p className="text-[11px] text-moon">Order value less discount</p>
        </div>
        <div className="rounded-xl border border-line bg-surface px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-moon">Paid to members</p>
          <p className="mt-0.5 tabular-nums text-base font-bold text-ink">
            {formatINR(breakdown.totals?.paid_to_network)}
          </p>
          <p className="text-[11px] text-moon">Earned by the people listed below</p>
        </div>
        <div className="rounded-xl border border-gold/30 bg-tint/40 px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gold-deep">
            Kept by the trust
          </p>
          <p className="mt-0.5 tabular-nums text-base font-bold text-ink">
            {formatINR(breakdown.totals?.retained_by_admin)}
          </p>
          <p className="text-[11px] text-moon">
            {retainedCount > 0
              ? `${retainedCount} share${retainedCount === 1 ? '' : 's'} nobody could receive`
              : 'Nothing retained'}
          </p>
        </div>
      </div>

      <p className="text-xs text-moon">
        The commission pool on this order is{' '}
        <span className="font-semibold text-charcoal">{formatPercent(breakdown.pool_percent)}</span>{' '}
        of {formatINR(breakdown.base_amount)}, divided between the four roles below. Where a role has
        nobody appointed, that share stays with the trust.
      </p>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="bg-cream text-[10px] font-bold uppercase tracking-wide text-moon">
            <tr>
              <th className="px-3 py-2.5">Role</th>
              <th className="px-3 py-2.5">Who receives it</th>
              <th className="px-3 py-2.5 text-right">Share</th>
              <th className="px-3 py-2.5 text-right">Amount</th>
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {slices.map((slice, i) => {
              const kind = slice.kind ?? slice.role ?? '';
              const retained = slice.is_retained === true || slice.is_fallback_to_admin === true;
              const reason = retentionReasonLabel(slice.retention_reason);
              return (
                <tr
                  key={`${kind}-${i}`}
                  className={`border-t border-line/70 ${retained ? 'bg-cream/40' : ''}`}
                >
                  <td className="px-3 py-2.5 font-semibold text-ink">{breakdownRoleLabel(kind)}</td>
                  <td className="px-3 py-2.5">
                    <span className={retained ? 'font-medium text-charcoal' : 'font-medium text-ink'}>
                      {retained ? 'Kept by the trust' : slice.beneficiary_name?.trim() || 'Member on file'}
                    </span>
                    {reason ? (
                      <span className="mt-0.5 block text-[11px] text-moon">{reason}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-ink">
                    {formatPercent(slice.percent)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-ink">
                    {formatINR(slice.amount)}
                  </td>
                  <td className="px-3 py-2.5">
                    {slice.status ? (
                      <StatusBadge status={slice.status} type="commission_status" />
                    ) : (
                      <span className="text-moon">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
