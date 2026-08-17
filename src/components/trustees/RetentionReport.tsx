'use client';

import { useMemo, useState } from 'react';
import { Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCommissionRetentionEntriesQuery,
  useCommissionRetentionSummaryQuery,
  useDistrictsListQuery,
  useStatesListQuery,
} from '@/hooks/queries/useTerritoryQuery';
import { StatusBadge } from '@/components/ui/status-badge';
import { DateTimeCell } from '@/components/common/DateTimeCell';

function formatINR(value: unknown): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return String(value ?? '—');
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);
}

const REASON_LABEL: Record<string, string> = {
  seat_vacant: 'Seat vacant',
  territory_unresolved: 'Territory unresolved',
  territory_exempt: 'Territory exempt',
  self_purchase: 'Self purchase',
  zero_rate: 'Zero rate',
};

const KIND_LABEL: Record<string, string> = {
  trustee: 'Trustee',
  state_executive: 'State Executive',
  district_president: 'District President',
  referral: 'Referral',
  area: 'Area',
};

/**
 * v2 Retention tab — admin-retained commission pool from vacant/exempt layers.
 * Invariant: pool = paid_to_network + retained_by_admin.
 */
export function RetentionReport() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [stateId, setStateId] = useState('all');
  const [districtId, setDistrictId] = useState('all');
  const [sourceKind, setSourceKind] = useState('all');
  const [showEntries, setShowEntries] = useState(false);

  const { data: statesData } = useStatesListQuery({ is_active: 'true' });
  const states = statesData?.data?.results ?? [];
  const { data: districts = [] } = useDistrictsListQuery(stateId === 'all' ? '' : stateId);

  const filters = useMemo(
    () => ({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      state_id: stateId === 'all' ? undefined : stateId,
      district_id: districtId === 'all' ? undefined : districtId,
      source_kind: sourceKind === 'all' ? undefined : sourceKind,
    }),
    [dateFrom, dateTo, stateId, districtId, sourceKind]
  );

  const { data: summary, isLoading: summaryLoading, error: summaryError } =
    useCommissionRetentionSummaryQuery(filters);
  const { data: entriesData, isLoading: entriesLoading } = useCommissionRetentionEntriesQuery(
    filters,
    showEntries
  );

  const entries = entriesData?.data?.results ?? [];
  const byKind = summary?.by_kind ?? {};

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-charcoal">
          <Filter className="h-4 w-4 text-moon" />
          Filters
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label className="text-xs text-moon">From</Label>
            <Input
              type="date"
              className="bg-surface"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-moon">To</Label>
            <Input
              type="date"
              className="bg-surface"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-moon">State</Label>
            <Select
              value={stateId}
              onValueChange={(v) => {
                setStateId(v || 'all');
                setDistrictId('all');
              }}
            >
              <SelectTrigger className="bg-surface">
                <SelectValue>
                  {stateId === 'all'
                    ? 'All states'
                    : states.find((s) => s.id === stateId)?.name ?? 'State'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {states.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-moon">District</Label>
            <Select
              value={districtId}
              onValueChange={(v) => setDistrictId(v || 'all')}
              disabled={stateId === 'all'}
            >
              <SelectTrigger className="bg-surface">
                <SelectValue>
                  {districtId === 'all'
                    ? 'All districts'
                    : districts.find((d) => d.id === districtId)?.name ?? 'District'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All districts</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-moon">Source</Label>
            <Select value={sourceKind} onValueChange={(v) => setSourceKind(v || 'all')}>
              <SelectTrigger className="bg-surface">
                <SelectValue>
                  {sourceKind === 'all' ? 'All sources' : sourceKind}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="sadhana">Sadhana</SelectItem>
                <SelectItem value="ai_unlock">AI unlock</SelectItem>
                <SelectItem value="donation">Donation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {summaryLoading ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-moon">
          Loading retention summary…
        </div>
      ) : summaryError ? (
        <div className="rounded-xl border border-danger/25 bg-danger-tint p-6 text-sm text-danger-ink">
          {summaryError instanceof Error ? summaryError.message : 'Failed to load retention'}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Pool" value={formatINR(summary?.pool_amount)} />
            <Stat label="Paid to network" value={formatINR(summary?.paid_to_network_amount)} tone="green" />
            <Stat label="Retained by Admin" value={formatINR(summary?.retained_by_admin_amount)} tone="amber" />
            <Stat
              label="Retained % of pool"
              value={
                summary?.retained_percent_of_pool != null
                  ? `${Number(summary.retained_percent_of_pool).toFixed(2)}%`
                  : '—'
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-ink">By layer</h3>
              <ul className="space-y-2">
                {Object.keys(byKind).length === 0 ? (
                  <li className="text-sm text-moon">No retained amounts in range.</li>
                ) : (
                  Object.entries(byKind).map(([kind, amount]) => (
                    <li key={kind} className="flex items-center justify-between text-sm">
                      <span className="text-charcoal">{KIND_LABEL[kind] ?? kind}</span>
                      <span className="font-medium tabular-nums text-ink">
                        {formatINR(amount)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-ink">Retained by reason</h3>
              <ul className="space-y-2">
                {(summary?.retained_by_reason ?? []).length === 0 ? (
                  <li className="text-sm text-moon">No retention reasons in range.</li>
                ) : (
                  (summary?.retained_by_reason ?? []).map((row) => (
                    <li key={row.reason} className="flex items-center justify-between text-sm">
                      <span className="text-charcoal">
                        {REASON_LABEL[row.reason] ?? row.reason}
                        {row.entries != null ? (
                          <span className="ml-2 text-xs text-moon">{row.entries} entries</span>
                        ) : null}
                      </span>
                      <span className="font-medium tabular-nums text-ink">
                        {formatINR(row.amount)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {(summary?.top_gaps ?? []).length > 0 && (
            <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-ink">Top gaps to appoint</h3>
              <ul className="divide-y divide-line/60">
                {(summary?.top_gaps ?? []).map((gap, i) => (
                  <li
                    key={`${gap.state_id}-${gap.district_id}-${i}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                  >
                    <span className="text-charcoal">
                      {gap.state_name || '—'}
                      {gap.district_name ? ` · ${gap.district_name}` : ''}
                    </span>
                    <span className="font-medium tabular-nums text-warning-ink">
                      {formatINR(gap.retained_amount)}
                      {gap.entries != null ? (
                        <span className="ml-2 text-xs font-normal text-moon">
                          {gap.entries} entries
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="rounded-xl border border-line bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="text-sm font-semibold text-ink">Entry drilldown</h3>
          <button
            type="button"
            onClick={() => setShowEntries((v) => !v)}
            className="text-sm font-semibold text-gold-press hover:text-gold-press"
          >
            {showEntries ? 'Hide entries' : 'Load entries'}
          </button>
        </div>
        {!showEntries ? (
          <p className="px-4 py-6 text-sm text-moon">
            Load the entry table when you need line-level beneficiary / retention_reason detail.
          </p>
        ) : entriesLoading ? (
          <p className="px-4 py-6 text-sm text-moon">Loading entries…</p>
        ) : entries.length === 0 ? (
          <p className="px-4 py-6 text-sm text-moon">No retention entries for these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-cream text-left text-xs uppercase tracking-wide text-moon">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Territory</th>
                  <th className="px-3 py-2">Kind</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Beneficiary</th>
                  <th className="px-3 py-2">Reason</th>
                  {/* Centred to match every other status-badge column in the app. */}
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => (
                  <tr key={row.id} className="border-t border-line/60">
                    <td className="px-3 py-2 whitespace-nowrap text-charcoal">
                      {row.created_at ? <DateTimeCell value={row.created_at} /> : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-ink">
                        {row.source_reference || row.sale_id || '—'}
                      </div>
                      <div className="text-xs text-moon">{row.source_kind || ''}</div>
                    </td>
                    <td className="px-3 py-2 text-charcoal">
                      {[row.state_name, row.district_name].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-3 py-2">
                      {KIND_LABEL[row.kind ?? ''] ?? row.kind ?? '—'}
                    </td>
                    <td className="px-3 py-2 tabular-nums font-medium">
                      {formatINR(row.amount)}
                      <div className="text-xs font-normal text-moon">
                        {row.percent != null ? `${row.percent}%` : ''}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{row.beneficiary_name || row.beneficiary || '—'}</div>
                    </td>
                    <td className="px-3 py-2 text-charcoal">
                      {row.retention_reason
                        ? REASON_LABEL[row.retention_reason] ?? row.retention_reason
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.status ? <StatusBadge status={row.status} type="commission_status" /> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'green' | 'amber';
}) {
  const toneClass =
    tone === 'green'
      ? 'border-success/25 bg-success-tint'
      : tone === 'amber'
        ? 'border-warning/25 bg-warning-tint'
        : 'border-line bg-surface';
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-moon">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{value}</p>
    </div>
  );
}
