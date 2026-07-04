'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Lock, Plus, Pencil, Wallet, TrendingUp, Trash2, ShoppingBag, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EditTrusteeModal } from '@/components/forms/EditTrusteeModal';
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
  useDeleteTrusteeMutation,
} from '@/hooks/queries/useTrusteesQuery';
import { useAssignmentsListQuery } from '@/hooks/queries/useTerritoryQuery';
import { useCommissionLedgerColumns } from '@/hooks/tables/useCommissionLedgerColumns';
import { AssignStateModal } from '@/components/forms/AssignStateModal';
import { Assignment } from '@/schemas/territory.schema';
import { formatINR, formatPercent } from '@/lib/currency';

function StatCard({
  label,
  value,
  icon,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'amber' | 'green' | 'rose' | 'indigo';
}) {
  const tones: Record<string, string> = {
    default: 'bg-white border-slate-200',
    amber: 'bg-amber-50 border-amber-200',
    green: 'bg-green-50 border-green-200',
    rose: 'bg-rose-50 border-rose-200',
    indigo: 'bg-indigo-50 border-indigo-200',
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function TrusteeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [statusFilter, setStatusFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');
  const [ledgerPage, setLedgerPage] = useState(1);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { mutate: deleteTrustee, isPending: isDeleting } = useDeleteTrusteeMutation();

  const { data: dashboard, isLoading: dashboardLoading } = useTrusteeDashboardQuery(id);
  const { data: assignmentsData } = useAssignmentsListQuery({ trustee: id, page_size: 100 });
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
    [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() ||
    meta.email ||
    'Trustee';
  const code = meta.referral_code ?? d.referral_code;
  const isActive = meta.is_active;
  const commissionPercent = String(meta.commission_percent ?? d.commission_percent ?? '');

  const handleDelete = () => {
    deleteTrustee(id, { onSuccess: () => router.push('/trustees') });
  };

  const assignments = useMemo(() => assignmentsData?.data?.results ?? [], [assignmentsData]);

  const ledgerColumns = useCommissionLedgerColumns();
  const ledgerRows = commissionsData?.data?.results ?? [];
  const ledgerTotalPages = commissionsData?.data?.count
    ? Math.ceil(commissionsData.data.count / 10)
    : 1;

  const openAssign = () => {
    setEditingAssignment(null);
    setIsAssignOpen(true);
  };
  const openEdit = (a: Assignment) => {
    setEditingAssignment(a);
    setIsAssignOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/trustees">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          {dashboardLoading ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 truncate">{name}</h1>
              {code && (
                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {code}
                </span>
              )}
              {isActive !== undefined && <StatusBadge status={isActive} type="active" />}
            </div>
          )}
          {meta.email && <p className="text-slate-500 text-sm mt-0.5 truncate">{meta.email}</p>}
        </div>
        {!dashboardLoading && (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        )}
      </div>

      {/* Wallet */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Wallet</h2>
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
              tone="green"
              hint="Withdrawable"
            />
            <StatCard
              label="Pending"
              value={formatINR(wallet.pending_balance)}
              icon={<Lock className="h-3.5 w-3.5" />}
              tone="amber"
              hint="Locked until maturity"
            />
            <StatCard
              label="Held"
              value={formatINR(wallet.held_amount)}
              tone="default"
              hint="Reserved for withdrawals"
            />
          </div>
        )}
      </div>

      {/* Commissions (lifetime) */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
          Commissions (lifetime)
        </h2>
        {dashboardLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Area"
              value={formatINR(byKind.area)}
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              tone="indigo"
            />
            <StatCard label="Referral" value={formatINR(byKind.referral)} tone="indigo" />
            <StatCard label="Reversed (returns)" value={formatINR(commissions.reversed_lifetime)} tone="rose" />
          </div>
        )}
      </div>

      {/* Referral / sales impact */}
      {!dashboardLoading && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Impact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Orders referred"
              value={String(totals.orders ?? 0)}
              icon={<ShoppingBag className="h-3.5 w-3.5" />}
              hint={`${formatINR(totals.orders_revenue)} revenue`}
              tone="green"
            />
            <StatCard
              label="Donations referred"
              value={String(totals.donations ?? 0)}
              icon={<Heart className="h-3.5 w-3.5" />}
              hint={`${formatINR(totals.donations_amount)} raised`}
              tone="rose"
            />
            <StatCard
              label="Referred users"
              value={String(totals.referred_users ?? 0)}
              icon={<Users className="h-3.5 w-3.5" />}
              tone="indigo"
            />
          </div>
        </div>
      )}

      {/* Territory */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">Territory</h2>
          <Button size="sm" variant="outline" onClick={openAssign}>
            <Plus className="h-4 w-4" /> Assign state
          </Button>
        </div>
        {assignments.length === 0 ? (
          <p className="text-sm text-amber-600">
            No states assigned — this trustee earns no area (15%) commission yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5"
              >
                <span className="text-sm font-medium text-slate-800">{a.state_name || '—'}</span>
                <span className="text-xs text-slate-500">
                  {a.area_commission_percent ? formatPercent(a.area_commission_percent) : 'default'}
                </span>
                {!a.is_active && <StatusBadge status={a.is_active} type="active" />}
                <button
                  type="button"
                  onClick={() => openEdit(a)}
                  className="text-slate-400 hover:text-indigo-600"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commission ledger */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">Commission Ledger</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val || 'all');
                setLedgerPage(1);
              }}
            >
              <SelectTrigger className="bg-white w-[140px]">
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
              <SelectTrigger className="bg-white w-[120px]">
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

      <AssignStateModal
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        trusteeId={id}
        trusteeLabel={name}
        assignment={editingAssignment}
      />

      <EditTrusteeModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        trusteeId={id}
        initial={{ commissionPercent, notes: String(meta.notes ?? d.notes ?? ''), isActive: !!isActive }}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Remove trustee?"
        description={`This removes ${name}'s trustee role and wallet access. This cannot be undone.`}
        confirmText={isDeleting ? 'Removing...' : 'Remove'}
        cancelText="Cancel"
        variant="destructive"
        disabled={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
