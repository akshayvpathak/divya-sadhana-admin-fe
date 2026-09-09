'use client';

import { useMemo, useState } from 'react';
import { Landmark, Users } from 'lucide-react';
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
import { StatCard } from '@/components/common/StatCard';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { formatINR } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { RETENTION_ENTRIES_PAGE_SIZE } from '@/services/territory.service';
import type { RetentionSummary } from '@/schemas/territory.schema';

/** Last-resort labels if a row arrives without reason_label. */
const REASON_LABEL: Record<string, string> = {
  seat_vacant: 'No one appointed',
  holder_inactive: 'Appointed member is inactive',
  territory_exempt: 'Not shared with members',
  territory_unresolved: 'Place not identified',
  no_referral_link: 'No referral link used',
  referrer_inactive: 'Referral link owner is inactive',
  self_purchase: 'Bought by the seat holder',
  zero_rate: 'Rate set to 0%',
  unspecified: 'Reason not recorded',
  paid_to_member: 'Paid to member',
};

const REASON_FILTER_OPTIONS = [
  { value: 'all', label: 'All reasons' },
  ...Object.entries(REASON_LABEL).map(([value, label]) => ({ value, label })),
];

const REASONS_BY_BUCKET: Record<string, string[]> = {
  vacant: ['seat_vacant', 'holder_inactive'],
  exempt: ['territory_exempt'],
  place_missing: ['territory_unresolved'],
  other: ['no_referral_link', 'referrer_inactive', 'self_purchase', 'zero_rate', 'unspecified'],
};

const FALLBACK_BUCKETS: {
  key: string;
  label: string;
  action: string;
  amountKey: keyof RetentionSummary;
}[] = [
  {
    key: 'vacant',
    label: 'Seat empty',
    action: 'Appoint someone for these places.',
    amountKey: 'kept_because_vacant_amount',
  },
  {
    key: 'exempt',
    label: 'Not shared with members',
    action: 'This sale type does not pay the network.',
    amountKey: 'kept_because_exempt_amount',
  },
  {
    key: 'place_missing',
    label: 'Place not identified',
    action: 'A pincode-data fix, not a hiring one.',
    amountKey: 'kept_because_place_missing_amount',
  },
  {
    key: 'other',
    label: 'Other',
    action: 'Self-purchase, a 0% rate, or no referral link.',
    amountKey: 'kept_other_amount',
  },
];

const ROLE_LABEL: Record<string, string> = {
  trustee: 'Trustee',
  state_executive: 'State Executive',
  district_president: 'District President',
  referral: 'Referral',
  area: 'Area',
};

const SALE_TYPE_LABEL: Record<string, string> = {
  order: 'Shop order',
  consultation: 'Consultation',
  sadhana: 'Sadhana',
  ai_unlock: 'AI reading',
  donation: 'Donation',
};

function humanLabel(map: Record<string, string>, value: string | null | undefined): string {
  if (!value) return '—';
  return map[value] ?? value.replace(/_/g, ' ');
}

function reasonLabel(
  reason: string | null | undefined,
  label: string | null | undefined
): string {
  if (label) return label;
  return humanLabel(REASON_LABEL, reason);
}

function saleTypeLabel(value: string | null | undefined): string {
  return humanLabel(SALE_TYPE_LABEL, value);
}

function whoShouldHaveGotIt(name: string | null | undefined): string {
  if (!name || name === 'Admin / Organisation') return 'Kept by admin';
  return name;
}

function printPlace(label: string | null | undefined): string {
  return label?.trim() || 'Place not identified';
}

function reasonsForBucket(
  key: string,
  byReason: RetentionSummary['retained_by_reason']
): string {
  const fromSummary = (byReason ?? [])
    .filter((row) => row.bucket === key && row.reason)
    .map((row) => row.reason);
  const reasons = fromSummary.length ? fromSummary : (REASONS_BY_BUCKET[key] ?? []);
  return reasons.join(',');
}

/**
 * Money that stayed with admin because a seat was empty or the sale could not
 * be paid out to a member. Copy is for a non-technical operator.
 */
export function RetentionReport({ onOpenCoverage }: { onOpenCoverage?: () => void }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [stateId, setStateId] = useState('all');
  const [districtId, setDistrictId] = useState('all');
  const [sourceKind, setSourceKind] = useState('all');
  const [retentionReason, setRetentionReason] = useState('all');
  const [showSales, setShowSales] = useState(false);
  const [page, setPage] = useState(1);

  const { data: statesData } = useStatesListQuery({ is_active: 'true' });
  const states = statesData?.data?.results ?? [];
  const { data: districts = [] } = useDistrictsListQuery(stateId === 'all' ? '' : stateId);

  const summaryFilters = useMemo(
    () => ({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      state_id: stateId === 'all' ? undefined : stateId,
      district_id: districtId === 'all' ? undefined : districtId,
      source_kind: sourceKind === 'all' ? undefined : sourceKind,
    }),
    [dateFrom, dateTo, stateId, districtId, sourceKind]
  );

  const entriesFilters = useMemo(
    () => ({
      ...summaryFilters,
      page,
      page_size: RETENTION_ENTRIES_PAGE_SIZE,
      retention_reason: retentionReason === 'all' ? undefined : retentionReason,
    }),
    [summaryFilters, page, retentionReason]
  );

  const { data: summary, isLoading: summaryLoading, error: summaryError } =
    useCommissionRetentionSummaryQuery(summaryFilters);
  const { data: entriesData, isLoading: entriesLoading, error: entriesError } =
    useCommissionRetentionEntriesQuery(entriesFilters, showSales);

  const entries = entriesData?.data?.results ?? [];
  const entryCount = entriesData?.data?.count ?? entries.length;
  const totalPages =
    entriesData?.data?.total_pages ??
    Math.max(1, Math.ceil(entryCount / RETENTION_ENTRIES_PAGE_SIZE));
  const byRole = summary?.by_kind ?? {};
  const reasons = summary?.retained_by_reason ?? [];
  const gaps = summary?.top_gaps ?? [];
  const unmapped = summary?.unmapped;

  const buckets = useMemo(() => {
    const fromApi = summary?.retention_buckets ?? [];
    if (fromApi.length) {
      return fromApi.map((b) => ({
        key: b.key,
        label: b.label,
        action: b.action ?? '',
        amount: b.amount,
        entries: b.entries,
      }));
    }
    if (!summary) return [];
    return FALLBACK_BUCKETS.map((b) => ({
      key: b.key,
      label: b.label,
      action: b.action,
      amount: summary[b.amountKey] as string | number | null | undefined,
      entries: undefined as number | undefined,
    }));
  }, [summary]);

  const resetPage = () => setPage(1);

  const applyReasonFilter = (next: string) => {
    setRetentionReason(next);
    setPage(1);
    if (next !== 'all') setShowSales(true);
  };

  const unmappedReasons = unmapped?.by_reason ?? [];
  const unmappedByKind = unmapped?.by_source_kind ?? {};
  const hasUnmapped =
    unmapped != null &&
    (Number(unmapped.retained_amount) > 0 ||
      (unmapped.entries ?? 0) > 0 ||
      unmappedReasons.length > 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-cream px-4 py-3.5 sm:px-5">
        <p className="text-sm text-charcoal">
          Commission either goes to a member, or stays with the admin. It stays with the admin when
          a seat is empty, the sale type does not pay the network, the place could not be identified,
          or for other reasons such as a self-purchase.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <p className="mb-3 text-sm font-semibold text-charcoal">Narrow the list</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label className="text-xs text-moon">From</Label>
            <Input
              type="date"
              className="bg-surface"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                resetPage();
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-moon">To</Label>
            <Input
              type="date"
              className="bg-surface"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                resetPage();
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-moon">State</Label>
            <Select
              value={stateId}
              onValueChange={(v) => {
                setStateId(v || 'all');
                setDistrictId('all');
                resetPage();
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
              onValueChange={(v) => {
                setDistrictId(v || 'all');
                resetPage();
              }}
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
            <Label className="text-xs text-moon">Sale type</Label>
            <Select
              value={sourceKind}
              onValueChange={(v) => {
                setSourceKind(v || 'all');
                resetPage();
              }}
            >
              <SelectTrigger className="bg-surface">
                <SelectValue>
                  {sourceKind === 'all' ? 'All sales' : saleTypeLabel(sourceKind)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sales</SelectItem>
                {Object.entries(SALE_TYPE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {summaryLoading ? (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-moon sm:p-8">
          Loading amounts…
        </div>
      ) : summaryError ? (
        <div className="rounded-2xl border border-danger/25 bg-danger-tint p-4 text-sm text-danger-ink sm:p-6">
          {summaryError instanceof Error ? summaryError.message : 'Could not load these amounts'}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label="Paid to members"
              value={formatINR(summary?.paid_to_network_amount)}
              hint="Commission that went to people"
              icon={<Users className="h-4 w-4" />}
              tone="success"
            />
            <StatCard
              label="Kept by admin"
              value={formatINR(summary?.retained_by_admin_amount)}
              hint={
                summary?.retained_percent_of_pool != null
                  ? `${Number(summary.retained_percent_of_pool).toFixed(0)}% of all commission`
                  : 'Commission that stayed with the trust'
              }
              icon={<Landmark className="h-4 w-4" />}
              tone="warning"
            />
          </div>

          {buckets.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {buckets.map((bucket) => {
                const reasonValue = reasonsForBucket(bucket.key, reasons);
                const selected = retentionReason === reasonValue && reasonValue !== '';
                return (
                  <button
                    key={bucket.key}
                    type="button"
                    onClick={() => applyReasonFilter(selected || !reasonValue ? 'all' : reasonValue)}
                    className={cn(
                      'rounded-2xl border bg-surface px-3.5 py-3 text-left shadow-card transition-colors sm:px-4 sm:py-3.5',
                      selected
                        ? 'border-gold ring-1 ring-gold/40'
                        : 'border-line hover:border-gold/40'
                    )}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-moon sm:text-[11px]">
                      {bucket.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-ink sm:text-xl">
                      {formatINR(bucket.amount)}
                    </p>
                    {bucket.entries != null ? (
                      <p className="mt-0.5 text-xs text-moon">
                        {bucket.entries} {bucket.entries === 1 ? 'sale' : 'sales'}
                      </p>
                    ) : null}
                    {bucket.action ? (
                      <p className="mt-1.5 text-xs text-charcoal">{bucket.action}</p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold text-ink">Which role was empty</h3>
              <p className="mb-3 text-xs text-moon">Share that could not be paid to that role.</p>
              <ul className="space-y-2">
                {Object.keys(byRole).length === 0 ? (
                  <li className="text-sm text-moon">Nothing kept for any role in this period.</li>
                ) : (
                  Object.entries(byRole).map(([kind, amount]) => (
                    <li key={kind} className="flex items-center justify-between text-sm">
                      <span className="text-charcoal">{humanLabel(ROLE_LABEL, kind)}</span>
                      <span className="font-medium tabular-nums text-ink">{formatINR(amount)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold text-ink">Why it stayed with admin</h3>
              <p className="mb-3 text-xs text-moon">Empty seats are only one of the reasons.</p>
              <ul className="space-y-2">
                {reasons.length === 0 ? (
                  <li className="text-sm text-moon">No amounts kept in this period.</li>
                ) : (
                  reasons.map((row) => (
                    <li key={row.reason} className="flex items-center justify-between text-sm">
                      <span className="text-charcoal">
                        {reasonLabel(row.reason, row.reason_label)}
                        {row.entries != null ? (
                          <span className="ml-2 text-xs text-moon">
                            {row.entries} {row.entries === 1 ? 'sale' : 'sales'}
                          </span>
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

          <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-ink">Appoint someone here first</h3>
                <p className="mt-0.5 text-xs text-moon">
                  Named places holding money because a seat is empty.
                </p>
              </div>
              {onOpenCoverage ? (
                <button
                  type="button"
                  onClick={onOpenCoverage}
                  className="text-sm font-semibold text-gold-press hover:underline"
                >
                  See empty seats
                </button>
              ) : null}
            </div>
            {gaps.length === 0 ? (
              <p className="text-sm text-moon">No empty-seat amounts for this period.</p>
            ) : (
              <ul className="divide-y divide-line/60">
                {gaps.map((gap, i) => (
                  <li
                    key={`${gap.state_id}-${gap.district_id}-${i}`}
                    className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm"
                  >
                    <div>
                      <p className="text-charcoal">{printPlace(gap.place_label)}</p>
                      {(gap.vacant_seats ?? []).length > 0 ? (
                        <ul className="mt-1 space-y-0.5 text-xs text-moon">
                          {(gap.vacant_seats ?? []).map((seat, si) => (
                            <li key={`${seat.kind}-${si}`}>
                              {seat.kind_label || humanLabel(ROLE_LABEL, seat.kind)}
                              {' · '}
                              {formatINR(seat.retained_amount)}
                              {seat.entries != null
                                ? ` · ${seat.entries} ${seat.entries === 1 ? 'sale' : 'sales'}`
                                : ''}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <span className="font-medium tabular-nums text-warning-ink">
                      {formatINR(gap.retained_amount)}
                      {gap.entries != null ? (
                        <span className="ml-2 text-xs font-normal text-moon">
                          {gap.entries} {gap.entries === 1 ? 'sale' : 'sales'}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {hasUnmapped ? (
            <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-ink">No place on the sale</h3>
              <p className="mt-0.5 text-xs text-moon">
                Appointing someone does not recover this money. AI readings collect no address, so
                there is nobody to appoint.
              </p>
              <p className="mt-3 text-lg font-semibold tabular-nums text-ink">
                {formatINR(unmapped.retained_amount)}
                <span className="ml-2 text-xs font-normal text-moon">
                  {unmapped.entries ?? 0} {(unmapped.entries ?? 0) === 1 ? 'sale' : 'sales'}
                  {unmapped.sales != null ? ` · ${unmapped.sales} distinct` : ''}
                </span>
              </p>
              {unmappedReasons.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {unmappedReasons.map((row) => (
                    <li key={row.reason} className="flex items-center justify-between text-sm">
                      <span className="text-charcoal">
                        {reasonLabel(row.reason, row.reason_label)}
                        {row.entries != null ? (
                          <span className="ml-2 text-xs text-moon">
                            {row.entries} {row.entries === 1 ? 'sale' : 'sales'}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-medium tabular-nums text-ink">
                        {formatINR(row.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {Object.keys(unmappedByKind).length > 0 ? (
                <ul className="mt-3 space-y-2 border-t border-line/60 pt-3">
                  {Object.entries(unmappedByKind).map(([kind, amount]) => (
                    <li key={kind} className="flex items-center justify-between text-sm">
                      <span className="text-charcoal">{saleTypeLabel(kind)}</span>
                      <span className="font-medium tabular-nums text-ink">{formatINR(amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">Each sale</h3>
            <p className="text-xs text-moon">Open this only if you need the sale-by-sale list.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {showSales ? (
              <Select
                value={retentionReason}
                onValueChange={(v) => applyReasonFilter(v || 'all')}
              >
                <SelectTrigger className="h-9 w-[220px] bg-surface text-sm">
                  <SelectValue>
                    {REASON_FILTER_OPTIONS.find((o) => o.value === retentionReason)?.label ??
                      (retentionReason === 'all' ? 'All reasons' : 'This group')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {REASON_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                  {retentionReason !== 'all' &&
                  !REASON_FILTER_OPTIONS.some((o) => o.value === retentionReason) ? (
                    <SelectItem value={retentionReason}>This group</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            ) : null}
            <button
              type="button"
              onClick={() => setShowSales((v) => !v)}
              className="text-sm font-semibold text-gold-press hover:underline"
            >
              {showSales ? 'Hide list' : 'Show list'}
            </button>
          </div>
        </div>
        {!showSales ? (
          <p className="px-4 py-6 text-sm text-moon">
            The numbers above are enough for most days. Open the list when you want to see a
            specific sale.
          </p>
        ) : entriesLoading ? (
          <p className="px-4 py-6 text-sm text-moon">Loading sales…</p>
        ) : entriesError ? (
          <p className="px-4 py-6 text-sm text-danger">
            {entriesError instanceof Error ? entriesError.message : 'Could not load sales'}
          </p>
        ) : entries.length === 0 ? (
          <p className="px-4 py-6 text-sm text-moon">No sales match these dates and place.</p>
        ) : (
          <>
            <ul className="grid gap-3 p-4 md:grid-cols-2 lg:hidden">
              {entries.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-line bg-surface p-3.5 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-ink">
                        {row.source_reference || '—'}
                      </p>
                      <p className="mt-0.5 text-xs text-moon">
                        {[
                          saleTypeLabel(row.source_kind),
                          row.kind_label || humanLabel(ROLE_LABEL, row.kind),
                        ]
                          .filter((v) => v && v !== '—')
                          .join(' · ') || '—'}
                      </p>
                    </div>
                    {row.status ? (
                      <StatusBadge status={row.status} type="commission_status" />
                    ) : null}
                  </div>

                  <dl className="mt-3 flex flex-col gap-2 border-t border-line/70 pt-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-moon">
                        Amount
                      </dt>
                      <dd className="text-right font-medium tabular-nums text-ink">
                        {formatINR(row.amount)}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-moon">
                        Place
                      </dt>
                      <dd className="text-right text-charcoal">
                        {printPlace(row.place_label)}
                        {row.place_source_label ? (
                          <span className="mt-0.5 block text-xs text-moon">
                            {row.place_source_label}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-moon">
                        Who should have got it
                      </dt>
                      <dd className="text-right text-charcoal">
                        {whoShouldHaveGotIt(row.beneficiary_name)}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-moon">
                        Why
                      </dt>
                      <dd className="text-right text-charcoal">
                        {reasonLabel(row.retention_reason, row.reason_label)}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-moon">
                        Date
                      </dt>
                      <dd className="text-right text-charcoal">
                        {row.created_at ? <DateTimeCell value={row.created_at} /> : '—'}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            <div className="custom-scrollbar hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="bg-cream text-left text-xs uppercase tracking-wide text-moon">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Sale</th>
                    <th className="px-3 py-2">Place</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Who should have got it</th>
                    <th className="px-3 py-2">Why</th>
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
                        <div className="font-medium text-ink">{row.source_reference || '—'}</div>
                        <div className="text-xs text-moon">{saleTypeLabel(row.source_kind)}</div>
                      </td>
                      <td className="px-3 py-2 text-charcoal">
                        {printPlace(row.place_label)}
                        {row.place_source_label ? (
                          <div className="text-xs text-moon">{row.place_source_label}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        {row.kind_label || humanLabel(ROLE_LABEL, row.kind)}
                      </td>
                      <td className="px-3 py-2 tabular-nums font-medium">{formatINR(row.amount)}</td>
                      <td className="px-3 py-2">{whoShouldHaveGotIt(row.beneficiary_name)}</td>
                      <td className="px-3 py-2 text-charcoal">
                        {reasonLabel(row.retention_reason, row.reason_label)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.status ? (
                          <StatusBadge status={row.status} type="commission_status" />
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DataTablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={entryCount}
              pageSize={RETENTION_ENTRIES_PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
