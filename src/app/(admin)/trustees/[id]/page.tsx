'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Lock, Wallet, TrendingUp, ShoppingBag, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import {
  useTrusteeDashboardQuery,
  useTrusteeCommissionsQuery,
} from '@/hooks/queries/useTrusteesQuery';
import { useAssignmentsListQuery } from '@/hooks/queries/useTerritoryQuery';
import { useCommissionLedgerColumns } from '@/hooks/tables/useCommissionLedgerColumns';
import { formatINR, formatPercent } from '@/lib/currency';
import { PageHeader, MetaChip } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';

export default function TrusteeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [statusFilter, setStatusFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');
  const [ledgerPage, setLedgerPage] = useState(1);

  const { data: dashboard, isLoading: dashboardLoading } = useTrusteeDashboardQuery(id);
  const { data: assignmentsData } = useAssignmentsListQuery({ member: id, page_size: 100 });
  const { data: commissionsData, isLoading: ledgerLoading } = useTrusteeCommissionsQuery(id, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    kind: kindFilter === 'all' ? undefined : kindFilter,
    page: ledgerPage,
  });

  // Defensive accessors — dashboard shape is not fully specced in the guides.
  const d = (dashboard ?? {}) as Record<string, any>;
  const meta = (d.trustee && typeof d.trustee === 'object' ? d.trustee : d) as Record<string, any>;
  const wallet = (d.wallet ?? {}) as Record<string, any>;
  const commissions = (d.commissions ?? {}) as Record<string, any>;
  const byKind = (commissions.by_kind ?? {}) as Record<string, any>;
  const totals = (d.totals ?? {}) as Record<string, any>;

  const name =
    meta.name ||
    meta.user_full_name ||
    [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() ||
    meta.email ||
    meta.user_email ||
    'Member';
  const code = meta.referral_code ?? d.referral_code;
  const isActive = meta.is_active;
  const attribution = (d.attribution ?? {}) as Record<string, any>;
  const role =
    (typeof meta.role === 'string' && meta.role) ||
    (typeof attribution.role === 'string' && attribution.role) ||
    (typeof d.role === 'string' && d.role) ||
    'trustee';
  const roleDisplay =
    meta.role_display ||
    attribution.role_display ||
    d.role_display ||
    role.replace(/_/g, ' ');
  // Prefer server filter (`member=`). Also drop any leaked rows that aren't this member.
  const assignments = useMemo(() => {
    const rows = assignmentsData?.data?.results ?? [];
    return rows.filter((a) => {
      const holder = a.member || a.trustee || '';
      const codeMatch = a.member_referral_code || a.trustee_referral_code || '';
      if (!holder && !codeMatch) return true; // already filtered by API
      return holder === id || (!!code && codeMatch === code);
    });
  }, [assignmentsData, id, code]);

  const ledgerColumns = useCommissionLedgerColumns();
  const ledgerRows = commissionsData?.data?.results ?? [];
  const ledgerTotalPages = commissionsData?.data?.count
    ? Math.ceil(commissionsData.data.count / 10)
    : 1;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        backHref="/trustees"
        title={dashboardLoading ? <Skeleton className="h-8 w-64" /> : name}
        identifier={name}
        loading={dashboardLoading}
        meta={
          !dashboardLoading && (
            <>
              <MetaChip tone="gold">{roleDisplay}</MetaChip>
              {code && <MetaChip tone="mono">{code}</MetaChip>}
              {isActive !== undefined && <StatusBadge status={isActive} type="active" />}
            </>
          )
        }
      />

      {/* Wallet */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-moon mb-2">Wallet</h2>
        {dashboardLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Available"
              value={formatINR(wallet.available_balance ?? wallet.balance)}
              icon={<Wallet className="h-3.5 w-3.5" />}
              tone="success"
              hint="Withdrawable"
            />
            <StatCard
              label="Pending"
              value={formatINR(wallet.pending_balance)}
              icon={<Lock className="h-3.5 w-3.5" />}
              tone="warning"
              hint="Locked until maturity"
            />
            <StatCard
              label="Held"
              value={formatINR(wallet.held_amount)}
              tone="gold"
              hint="Reserved for withdrawals"
            />
          </div>
        )}
      </div>

      {/* Commissions (lifetime) */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-moon mb-2">
          Commissions (lifetime)
        </h2>
        {dashboardLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.keys(byKind).length === 0 ? (
              <>
                <StatCard label="Area" value={formatINR(0)} tone="royal" />
                <StatCard label="Referral" value={formatINR(0)} tone="royal" />
              </>
            ) : (
              Object.entries(byKind).map(([kind, amount]) => (
                <StatCard
                  key={kind}
                  label={String(kind).replace(/_/g, ' ')}
                  value={formatINR(amount)}
                  icon={kind === 'referral' ? undefined : <TrendingUp className="h-3.5 w-3.5" />}
                  tone="royal"
                />
              ))
            )}
            <StatCard label="Reversed (returns)" value={formatINR(commissions.reversed_lifetime)} tone="danger" />
          </div>
        )}
      </div>

      {/* Referral / sales impact */}
      {!dashboardLoading && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-moon mb-2">Impact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Orders referred"
              value={String(totals.orders ?? 0)}
              icon={<ShoppingBag className="h-3.5 w-3.5" />}
              hint={`${formatINR(totals.orders_revenue)} revenue`}
              tone="success"
            />
            <StatCard
              label="Donations referred"
              value={String(totals.donations ?? 0)}
              icon={<Heart className="h-3.5 w-3.5" />}
              hint={`${formatINR(totals.donations_amount)} raised`}
              tone="danger"
            />
            <StatCard
              label="Referred users"
              value={String(totals.referred_users ?? 0)}
              icon={<Users className="h-3.5 w-3.5" />}
              tone="royal"
            />
          </div>
        </div>
      )}

      {/* Territory */}
      <div className="bg-surface rounded-xl shadow-sm border border-line p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Territory</h2>
            <p className="mt-0.5 text-xs text-moon">
              {role === 'district_president'
                ? 'District President seat (state + district).'
                : role === 'state_executive'
                  ? 'State Executive seat (one state).'
                  : 'Trustee seats (up to 3 states).'}
            </p>
          </div>
        </div>
        {assignments.length === 0 ? (
          <p className="text-sm text-warning">
            No territory assigned — vacant layers are retained by Admin.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignments.map((a) => {
              const seatRole = a.role_display || a.role || roleDisplay;
              const override = a.commission_percent_override ?? a.area_commission_percent;
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-lg border border-line bg-cream px-3 py-1.5"
                >
                  <span className="text-sm font-medium text-ink">
                    {a.state_name || '—'}
                    {a.district_name ? ` · ${a.district_name}` : ''}
                  </span>
                  <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-charcoal">
                    {String(seatRole).replace(/_/g, ' ')}
                  </span>
                  {override != null && override !== '' ? (
                    <span className="text-xs text-moon">{formatPercent(override)}</span>
                  ) : null}
                  {!a.is_active && <StatusBadge status={a.is_active} type="active" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Commission ledger */}
      <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden flex flex-col">
        <div className="p-4 border-b border-line bg-cream flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-ink">Commission Ledger</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val || 'all');
                setLedgerPage(1);
              }}
            >
              <SelectTrigger className="bg-surface w-[140px]">
                <SelectValue placeholder="All Statuses">
                  {statusFilter === 'all' ? 'All Statuses' : statusFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="reversed">Reversed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={kindFilter}
              onValueChange={(val) => {
                setKindFilter(val || 'all');
                setLedgerPage(1);
              }}
            >
              <SelectTrigger className="bg-surface w-[120px]">
                <SelectValue placeholder="All Kinds">
                  {kindFilter === 'all' ? 'All Kinds' : kindFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Kinds</SelectItem>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable
          columns={ledgerColumns}
          data={ledgerRows}
          isLoading={ledgerLoading}
          emptyMessage="No commission entries"
        />

        {commissionsData?.data && (
          <DataTablePagination
            currentPage={ledgerPage}
            totalPages={ledgerTotalPages}
            totalItems={commissionsData.data.count ?? ledgerRows.length}
            onPageChange={setLedgerPage}
          />
        )}
      </div>

    </div>
  );
}
