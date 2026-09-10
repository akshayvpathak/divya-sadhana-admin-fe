'use client';

import { StatusBadge } from '@/components/ui/status-badge';
import { formatINR, formatPercent } from '@/lib/currency';
import {
  breakdownRoleLabel,
  retentionReasonLabel,
  sortBreakdownSlices,
} from '@/lib/commission-breakdown';
import type { CommissionBreakdown } from '@/schemas/orders.schema';

export default function CommissionBreakdownCard({
  breakdown,
}: {
  breakdown: CommissionBreakdown | null | undefined;
}) {
  // The caller renders the heading and the attribution rows, so an absent
  // breakdown is not this component's story to tell.
  if (!breakdown) return null;

  const slices = sortBreakdownSlices(breakdown.slices ?? []);
  const commissionable = breakdown.commissionable !== false;

  return (
    <div className="space-y-3">
      <p className="text-sm text-moon">
        Percent and amount for each role on this order. If a seat is empty, that share stays with
        Admin.
      </p>
      {!commissionable ? (
        <p className="rounded-lg border border-line bg-cream px-3 py-2 text-xs text-charcoal">
          This purchase type does not pay the network. Rows below show the usual rates at ₹0.00.
        </p>
      ) : null}
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-moon">
        {breakdown.base_amount != null && breakdown.base_amount !== '' ? (
          <div>
            Commission base{' '}
            <span className="font-semibold text-ink">{formatINR(breakdown.base_amount)}</span>
          </div>
        ) : null}
        {breakdown.pool_percent != null && breakdown.pool_percent !== '' ? (
          <div>
            Pool <span className="font-semibold text-ink">{formatPercent(breakdown.pool_percent)}</span>
          </div>
        ) : null}
      </dl>

      {slices.length === 0 ? (
        <p className="text-sm text-moon">No commission slices were returned for this order.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-cream text-[10px] font-bold uppercase tracking-wide text-moon">
              <tr>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Beneficiary</th>
                <th className="px-3 py-2.5 text-right">Percent</th>
                <th className="px-3 py-2.5 text-right">Amount</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {slices.map((slice, i) => {
                const kind = slice.kind ?? slice.role ?? '';
                const fallback =
                  slice.is_retained === true || slice.is_fallback_to_admin === true;
                const reason = retentionReasonLabel(slice.retention_reason);
                return (
                  <tr key={`${kind}-${i}`} className="border-t border-line/70">
                    <td className="px-3 py-2.5 font-semibold text-ink">
                      {breakdownRoleLabel(kind)}
                    </td>
                    <td className="px-3 py-2.5 text-charcoal">
                      <span>{slice.beneficiary_name?.trim() || '—'}</span>
                      {fallback ? (
                        <span className="mt-0.5 block text-[11px] text-moon">
                          Fallback to Admin{reason ? ` · ${reason}` : ''}
                        </span>
                      ) : reason ? (
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
      )}

      {breakdown.totals ? (
        <dl className="grid gap-2 sm:grid-cols-2">
          <div className="flex justify-between rounded-lg border border-line bg-surface px-3 py-2 text-sm">
            <dt className="text-moon">Paid to network</dt>
            <dd className="font-semibold text-ink">
              {formatINR(breakdown.totals.paid_to_network)}
            </dd>
          </div>
          <div className="flex justify-between rounded-lg border border-line bg-surface px-3 py-2 text-sm">
            <dt className="text-moon">Kept by Admin</dt>
            <dd className="font-semibold text-ink">
              {formatINR(breakdown.totals.retained_by_admin)}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
