'use client';

import { useMemo, useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
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
import { PromoteTrusteeModal } from '@/components/forms/PromoteTrusteeModal';

export default function TrusteesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [sort, setSort] = useState('-created_at');
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);

  const isActiveParam = status === 'all' ? undefined : status === 'active' ? 'true' : 'false';

  const { data, isLoading } = useTrusteesListQuery({
    page,
    search: debouncedSearch,
    is_active: isActiveParam,
    sort,
  });

  // Resolve attributed states per trustee from active assignments (single fetch).
  const { data: assignmentsData } = useAssignmentsListQuery({ is_active: 'true', page_size: 200 });
  const { data: statesData } = useStatesListQuery({ is_active: 'true' });

  const statesByTrustee = useMemo(() => {
    const map = new Map<string, string[]>();
    const rows = assignmentsData?.data?.results ?? [];
    for (const a of rows) {
      if (!a.state_name) continue;
      const keys = [a.trustee, a.trustee_referral_code].filter(Boolean) as string[];
      for (const key of keys) {
        const arr = map.get(key) ?? [];
        if (!arr.includes(a.state_name)) arr.push(a.state_name);
        map.set(key, arr);
      }
    }
    return map;
  }, [assignmentsData]);

  const getStates = useMemo(
    () => (row: Trustee): string[] => {
      if (Array.isArray(row.states) && row.states.length) {
        return row.states
          .map((s) => (typeof s === 'string' ? s : s?.state_name || s?.name))
          .filter(Boolean) as string[];
      }
      const byId = statesByTrustee.get(row.id);
      if (byId?.length) return byId;
      const byCode = row.referral_code ? statesByTrustee.get(row.referral_code) : undefined;
      if (byCode?.length) return byCode;
      return row.state ? [row.state] : [];
    },
    [statesByTrustee]
  );

  const columns = useTrusteeTableColumns({ getStates });

  const allRows = data?.data?.results ?? [];
  const rows = useMemo(() => {
    if (stateFilter === 'all') return allRows;
    return allRows.filter((r) => getStates(r).includes(stateFilter));
  }, [allRows, stateFilter, getStates]);

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const states = statesData?.data?.results ?? [];

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trustees</h1>
          <p className="text-slate-500 mt-1">Promote users and monitor commission earnings</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsPromoteOpen(true)}>
          <Plus className="h-4 w-4" /> Promote Trustee
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search email / name / code..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-white w-[130px]">
                <SelectValue placeholder="All Statuses">
                  {status === 'active' ? 'Active' : status === 'inactive' ? 'Inactive' : 'All Statuses'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stateFilter} onValueChange={(val) => setStateFilter(val || 'all')}>
              <SelectTrigger className="bg-white w-[140px]">
                <SelectValue placeholder="All States">
                  {stateFilter === 'all' ? 'All States' : stateFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(val) => {
                setSort(val || '-created_at');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-white w-[130px]">
                <SelectValue placeholder="Sort">
                  {sort === 'created_at' ? 'Oldest' : 'Newest'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_at">Newest</SelectItem>
                <SelectItem value="created_at">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
            totalItems={data.data.count ?? rows.length}
            onPageChange={setPage}
          />
        )}
      </div>

      <PromoteTrusteeModal open={isPromoteOpen} onOpenChange={setIsPromoteOpen} />
    </div>
  );
}
