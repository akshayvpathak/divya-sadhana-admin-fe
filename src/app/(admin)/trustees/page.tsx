'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Filter, Users, MapPin, Link2 } from 'lucide-react';
import { ClearFiltersButton } from '@/components/common/ClearFiltersButton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useTrusteesListQuery } from '@/hooks/queries/useTrusteesQuery';
import { useAssignmentsListQuery, useStatesListQuery } from '@/hooks/queries/useTerritoryQuery';
import { useTrusteeTableColumns } from '@/hooks/tables/useTrusteeTableColumns';
import { Trustee } from '@/schemas/trustees.schema';
import { CoverageTerritory } from '@/components/trustees/CoverageTerritory';
import { RetentionReport } from '@/components/trustees/RetentionReport';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardBand } from '@/components/ui/card';
import { StatCard } from '@/components/common/StatCard';

type TrusteesTab = 'trustees' | 'coverage' | 'retention';

const TABS: { key: TrusteesTab; label: string; hint: string }[] = [
  { key: 'trustees', label: 'Trustees', hint: 'Members' },
  { key: 'coverage', label: 'Coverage', hint: 'Territory seats' },
  { key: 'retention', label: 'Retention', hint: 'Commission hold' },
];

export default function TrusteesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [sort, setSort] = useState('-created_at');
  const [tab, setTab] = useState<TrusteesTab>('trustees');

  const hasActiveFilters =
    search !== '' ||
    status !== 'all' ||
    stateFilter !== 'all';

  const clearAllFilters = () => {
    setSearch('');
    setStatus('all');
    setStateFilter('all');
    setPage(1);
  };

  // Deep-link support: /trustees?tab=coverage (used by the old /territory route).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam === 'coverage' || tabParam === 'retention') {
      setTab(tabParam);
    }
  }, []);

  const selectTab = (next: TrusteesTab) => {
    setTab(next);
    if (typeof window !== 'undefined') {
      const url =
        next === 'trustees' ? '/trustees' : `/trustees?tab=${next}`;
      window.history.replaceState(window.history.state, '', url);
    }
  };

  const isActiveParam = status === 'all' ? undefined : status === 'active' ? 'true' : 'false';

  // The backend filters trustees by assigned state via `?state_id={uuid}`, so the
  // dropdown value is the state UUID and pagination stays fully server-side.
  const PAGE_SIZE = 10;
  const stateIdParam = stateFilter === 'all' ? undefined : stateFilter;

  const { data, isLoading } = useTrusteesListQuery({
    page,
    page_size: PAGE_SIZE,
    search: debouncedSearch,
    is_active: isActiveParam,
    sort,
    state_id: stateIdParam,
  });

  // Resolve attributed states per trustee from active assignments (single fetch).
  const { data: assignmentsData } = useAssignmentsListQuery({ is_active: 'true', page_size: 200 });
  const { data: statesData } = useStatesListQuery({ is_active: 'true' });

  const territoryByMember = useMemo(() => {
    const map = new Map<string, string[]>();
    const rows = assignmentsData?.data?.results ?? [];
    for (const a of rows) {
      const state = a.state_name || '';
      if (!state) continue;
      const label =
        a.role === 'district_president' && a.district_name
          ? `${state} · ${a.district_name}`
          : state;
      const keys = [
        a.member,
        a.member_referral_code,
        a.trustee,
        a.trustee_referral_code,
      ].filter(Boolean) as string[];
      for (const key of keys) {
        const arr = map.get(key) ?? [];
        if (!arr.includes(label)) arr.push(label);
        map.set(key, arr);
      }
    }
    return map;
  }, [assignmentsData]);

  const getTerritory = useMemo(
    () => (row: Trustee): string[] => {
      if (Array.isArray(row.states) && row.states.length) {
        return row.states
          .map((s) => (typeof s === 'string' ? s : s?.state_name || s?.name))
          .filter(Boolean) as string[];
      }
      const byId = territoryByMember.get(row.id);
      if (byId?.length) return byId;
      const byCode = row.referral_code ? territoryByMember.get(row.referral_code) : undefined;
      if (byCode?.length) return byCode;
      if (row.state && row.district) return [`${row.state} · ${row.district}`];
      return row.state ? [row.state] : [];
    },
    [territoryByMember]
  );

  const columns = useTrusteeTableColumns({ getTerritory });

  const rows = data?.data?.results ?? [];
  const totalItems = data?.data?.count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const states = statesData?.data?.results ?? [];
  const activeAssignments = assignmentsData?.data?.results ?? [];
  const assignedMemberIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of activeAssignments) {
      if (a.member) ids.add(a.member);
      if (a.trustee) ids.add(a.trustee);
    }
    return ids;
  }, [activeAssignments]);
  const coveredStates = useMemo(() => {
    const names = new Set<string>();
    for (const a of activeAssignments) {
      if (a.state_name) names.add(a.state_name);
    }
    return names.size;
  }, [activeAssignments]);

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Network Members"
        description="Appoint trustees, state executives, and district presidents"
        actions={
          tab === 'trustees' && (
            <Link href="/trustees/create">
              <Button className="shadow-sm shadow-gold/20">
                <Plus className="h-4 w-4" /> Appoint member
              </Button>
            </Link>
          )
        }
      />

      {/* Tabs: members vs cross-member coverage (former Territory page) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl bg-cosmos p-1 ring-1 ring-line/80">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => selectTab(t.key)}
              className={cn(
                'rounded-lg px-3.5 py-2 text-sm font-semibold transition-all',
                tab === t.key
                  ? 'bg-surface text-gold-press shadow-sm ring-1 ring-line/80'
                  : 'text-moon hover:text-ink'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="hidden sm:inline text-xs text-moon ml-1">
          {TABS.find((t) => t.key === tab)?.hint}
        </span>
      </div>

      {tab === 'coverage' ? (
        <CoverageTerritory />
      ) : tab === 'retention' ? (
        <RetentionReport />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              label="Members"
              value={totalItems}
              loading={isLoading}
              icon={<Users className="h-4 w-4" />}
              tone="gold"
            />
            <StatCard
              label="With territory"
              value={assignedMemberIds.size}
              icon={<Link2 className="h-4 w-4" />}
              tone="success"
            />
            <StatCard
              label="States covered"
              value={
                <>
                  {coveredStates}
                  <span className="ml-1 text-sm font-normal text-moon">
                    / {states.length || '—'}
                  </span>
                </>
              }
              icon={<MapPin className="h-4 w-4" />}
              tone="info"
            />
          </div>

          <Card>
            <CardBand className="flex flex-col items-stretch justify-between gap-3 border-b border-line md:flex-row md:items-center">
              <div className="relative max-w-md flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-moon" />
                <Input
                  placeholder="Search by name, email, or code..."
                  className="pl-9 bg-surface w-full h-10"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full md:w-auto">
                <Filter className="h-4 w-4 text-moon shrink-0 hidden sm:block" />
                <Select
                  value={status}
                  onValueChange={(val) => {
                    setStatus(val || 'all');
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="bg-surface w-full sm:w-[140px] h-10">
                    <SelectValue placeholder="All Statuses">
                      {status === 'active'
                        ? 'Active'
                        : status === 'inactive'
                          ? 'Inactive'
                          : 'All Statuses'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={stateFilter}
                  onValueChange={(val) => {
                    setStateFilter(val || 'all');
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="bg-surface w-full sm:w-[200px] h-10">
                    <SelectValue placeholder="All States">
                      {stateFilter === 'all'
                        ? 'All States'
                        : states.find((s) => s.id === stateFilter)?.name ?? 'All States'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveFilters && <ClearFiltersButton onClear={clearAllFilters} />}
              </div>
            </CardBand>

            <DataTable
              columns={columns}
              data={rows}
              isLoading={isLoading}
              sort={sort}
              onSort={handleSort}
              emptyMessage="No trustees found"
            />

            {data?.data && (
              <DataTablePagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setPage}
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
