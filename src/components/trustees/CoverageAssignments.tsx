'use client';

import { useMemo, useState } from 'react';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import {
  useAssignmentsListQuery,
  useAssignmentsInfiniteQuery,
  useStatesListQuery,
} from '@/hooks/queries/useTerritoryQuery';
import { useTrusteesListQuery } from '@/hooks/queries/useTrusteesQuery';
import { useAssignmentTableColumns } from '@/hooks/tables/useAssignmentTableColumns';
import { trusteeDisplayName } from '@/hooks/tables/useTrusteeTableColumns';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { Card } from '@/components/ui/card';

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

  const queryFilters = useMemo(
    () => ({
      trustee: trusteeFilter === 'all' ? undefined : trusteeFilter,
      state: stateFilter === 'all' ? undefined : stateFilter,
      is_active:
        statusFilter === 'all' ? undefined : statusFilter === 'active' ? 'true' : 'false',
    }),
    [trusteeFilter, stateFilter, statusFilter]
  );

  const isCompact = useIsCompact();
  const { data, isLoading } = useAssignmentsListQuery(
    { ...queryFilters, page },
    { enabled: isCompact === false }
  );
  const mobile = useAssignmentsInfiniteQuery(queryFilters, { enabled: isCompact === true });

  const states = statesData?.data?.results ?? [];
  const trustees = trusteesData?.data?.results ?? [];
  const rows = data?.data?.results ?? [];
  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;

  const columns = useAssignmentTableColumns({ readOnly: true });

  const hasActiveFilters =
    trusteeFilter !== 'all' || stateFilter !== 'all' || statusFilter !== 'all';

  const clearAllFilters = () => {
    setTrusteeFilter('all');
    setStateFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'trustee',
      label: 'Member',
      value: trusteeFilter,
      options: [
        { value: 'all', label: 'All Trustees' },
        ...trustees.map((t) => ({ value: t.id, label: trusteeDisplayName(t) })),
      ],
      placeholder: 'All Trustees',
      widthClass: 'w-[180px]',
      onChange: (val) => {
        setTrusteeFilter(val);
        setPage(1);
      },
    },
    {
      key: 'state',
      label: 'State',
      value: stateFilter,
      options: [
        { value: 'all', label: 'All States' },
        ...states.map((s) => ({ value: s.id, label: s.name })),
      ],
      placeholder: 'All States',
      widthClass: 'w-[160px]',
      onChange: (val) => {
        setStateFilter(val);
        setPage(1);
      },
    },
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
      placeholder: 'All Statuses',
      widthClass: 'w-[140px]',
      onChange: (val) => {
        setStatusFilter(val);
        setPage(1);
      },
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-moon">
        Area-trustee assignments — who owns which state (territory layer). Manage
        assignments from a trustee&apos;s detail page.
      </p>

      <Card>
        <ListToolbar
          filters={toolbarFilters}
          onClear={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <ResponsiveDataView
          columns={columns}
          data={rows}
          isLoading={isLoading}
          mobile={mobile}
          emptyMessage="No assignments found"
          pagination={
            data?.data ? (
              <DataTablePagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={data.data.count ?? rows.length}
                onPageChange={setPage}
              />
            ) : null
          }
        />
      </Card>
    </div>
  );
}
