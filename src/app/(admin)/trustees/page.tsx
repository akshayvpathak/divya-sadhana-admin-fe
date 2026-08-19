'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Users, MapPin, Link2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsCompact } from '@/hooks/useMediaQuery';
import {
  useTrusteesListQuery,
  useTrusteesInfiniteQuery,
} from '@/hooks/queries/useTrusteesQuery';
import { useAssignmentsListQuery, useStatesListQuery } from '@/hooks/queries/useTerritoryQuery';
import { useTrusteeTableColumns } from '@/hooks/tables/useTrusteeTableColumns';
import { Trustee } from '@/schemas/trustees.schema';
import { CoverageTerritory } from '@/components/trustees/CoverageTerritory';
import { RetentionReport } from '@/components/trustees/RetentionReport';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/common/StatCard';

type TrusteesTab = 'trustees' | 'coverage' | 'retention';

const TABS: { key: TrusteesTab; label: string; hint: string }[] = [
  { key: 'trustees', label: 'Trustees', hint: 'Members' },
  { key: 'coverage', label: 'Coverage', hint: 'Territory seats' },
  { key: 'retention', label: 'Retention', hint: 'Commission hold' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const PAGE_SIZE = 10;

export default function TrusteesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [sort, setSort] = useState('-created_at');
  const [tab, setTab] = useState<TrusteesTab>('trustees');

  const hasActiveFilters =
    search !== '' || status !== 'all' || stateFilter !== 'all';

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
      const url = next === 'trustees' ? '/trustees' : `/trustees?tab=${next}`;
      window.history.replaceState(window.history.state, '', url);
    }
  };

  const isActiveParam = status === 'all' ? undefined : status === 'active' ? 'true' : 'false';

  // The backend filters trustees by assigned state via `?state_id={uuid}`, so the
  // dropdown value is the state UUID and pagination stays fully server-side.
  const stateIdParam = stateFilter === 'all' ? undefined : stateFilter;

  const queryFilters = useMemo(
    () => ({
      page_size: PAGE_SIZE,
      search: debouncedSearch,
      is_active: isActiveParam,
      sort,
      state_id: stateIdParam,
    }),
    [debouncedSearch, isActiveParam, sort, stateIdParam]
  );

  // Only the visible tab fetches members.
  const isCompact = useIsCompact();
  const onTrusteesTab = tab === 'trustees';
  const { data, isLoading } = useTrusteesListQuery(
    { ...queryFilters, page },
    { enabled: onTrusteesTab && isCompact === false }
  );
  const mobile = useTrusteesInfiniteQuery(queryFilters, {
    enabled: onTrusteesTab && isCompact === true,
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
  const totalItems = data?.data?.count ?? mobile.totalCount ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const states = useMemo(() => statesData?.data?.results ?? [], [statesData]);
  const activeAssignments = useMemo(
    () => assignmentsData?.data?.results ?? [],
    [assignmentsData]
  );
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

  const stateOptions = useMemo(
    () => [
      { value: 'all', label: 'All States' },
      ...states.map((s) => ({ value: s.id, label: s.name })),
    ],
    [states]
  );

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'status',
      label: 'Status',
      value: status,
      options: STATUS_OPTIONS,
      placeholder: 'All Statuses',
      widthClass: 'w-[140px]',
      onChange: (val) => {
        setStatus(val);
        setPage(1);
      },
    },
    {
      key: 'state',
      label: 'State',
      value: stateFilter,
      options: stateOptions,
      placeholder: 'All States',
      widthClass: 'w-[200px]',
      onChange: (val) => {
        setStateFilter(val);
        setPage(1);
      },
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader
        title="Network Members"
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

      {/* Tabs: members vs cross-member coverage (former Territory page).
          The rail scrolls rather than wraps, so the three tabs stay on one line
          at 320px. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="custom-scrollbar -mx-1 max-w-full overflow-x-auto px-1 pb-0.5">
          <div className="inline-flex rounded-xl bg-cosmos p-1 ring-1 ring-line/80">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => selectTab(t.key)}
                aria-pressed={tab === t.key}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-all',
                  tab === t.key
                    ? 'bg-surface text-gold-press shadow-sm ring-1 ring-line/80'
                    : 'text-moon hover:text-ink'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <span className="ml-1 hidden text-xs text-moon sm:inline">
          {TABS.find((t) => t.key === tab)?.hint}
        </span>
      </div>

      {tab === 'coverage' ? (
        <CoverageTerritory />
      ) : tab === 'retention' ? (
        <RetentionReport />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard
              label="Members"
              value={totalItems}
              loading={isLoading && mobile.isLoading}
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
              className="col-span-2 lg:col-span-1"
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
            <ListToolbar
              search={{
                value: search,
                placeholder: 'Search by name, email, or code...',
                onChange: (val) => {
                  setSearch(val);
                  setPage(1);
                },
              }}
              filters={toolbarFilters}
              onClear={clearAllFilters}
              hasActiveFilters={hasActiveFilters}
              sortColumns={columns}
              sort={sort}
              onSort={handleSort}
            />

            <ResponsiveDataView
              columns={columns}
              data={rows}
              isLoading={isLoading}
              sort={sort}
              onSort={handleSort}
              mobile={mobile}
              emptyMessage="No trustees found"
              pagination={
                data?.data ? (
                  <DataTablePagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    onPageChange={setPage}
                  />
                ) : null
              }
            />
          </Card>
        </>
      )}
    </div>
  );
}
