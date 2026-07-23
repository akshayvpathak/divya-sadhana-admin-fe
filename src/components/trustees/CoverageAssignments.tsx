'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
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
  useAssignmentsListQuery,
  useStatesListQuery,
} from '@/hooks/queries/useTerritoryQuery';
import { useTrusteesListQuery } from '@/hooks/queries/useTrusteesQuery';
import { useAssignmentTableColumns } from '@/hooks/tables/useAssignmentTableColumns';
import { trusteeDisplayName } from '@/hooks/tables/useTrusteeTableColumns';

/**
 * Cross-trustee "who owns which state" coverage view (the former standalone
 * /territory page). Read-only overview — assign/edit states from a trustee's
 * detail page.
 */
export function CoverageAssignments() {
  const [page, setPage] = useState(1);
  const [trusteeFilter, setTrusteeFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: statesData } = useStatesListQuery({ is_active: 'true' });
  const { data: trusteesData } = useTrusteesListQuery({ page_size: 200 });

  const { data, isLoading } = useAssignmentsListQuery({
    page,
    trustee: trusteeFilter === 'all' ? undefined : trusteeFilter,
    state: stateFilter === 'all' ? undefined : stateFilter,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active' ? 'true' : 'false',
  });

  const states = statesData?.data?.results ?? [];
  const trustees = trusteesData?.data?.results ?? [];
  const rows = data?.data?.results ?? [];
  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;

  const columns = useAssignmentTableColumns({ readOnly: true });

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Area-trustee assignments — who owns which state (15% layer). Manage
        assignments from a trustee&apos;s detail page.
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <Select
            value={trusteeFilter}
            onValueChange={(val) => {
              setTrusteeFilter(val || 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="bg-white w-[180px]">
              <SelectValue placeholder="All Trustees">
                {trusteeFilter === 'all'
                  ? 'All Trustees'
                  : (() => {
                      const t = trustees.find((x) => x.id === trusteeFilter);
                      return t ? trusteeDisplayName(t) : 'Trustee';
                    })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trustees</SelectItem>
              {trustees.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {trusteeDisplayName(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={stateFilter}
            onValueChange={(val) => {
              setStateFilter(val || 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="bg-white w-[160px]">
              <SelectValue placeholder="All States">
                {stateFilter === 'all'
                  ? 'All States'
                  : states.find((s) => s.id === stateFilter)?.name || 'State'}
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

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val || 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="bg-white w-[140px]">
              <SelectValue placeholder="All Statuses">
                {statusFilter === 'active' ? 'Active' : statusFilter === 'inactive' ? 'Inactive' : 'All Statuses'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable columns={columns} data={rows} isLoading={isLoading} emptyMessage="No assignments found" />

        {data?.data && (
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={data.data.count ?? rows.length}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
