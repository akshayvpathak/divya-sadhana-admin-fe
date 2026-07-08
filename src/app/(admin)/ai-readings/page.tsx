'use client';

import { useState } from 'react';
import { useAiReadingsListQuery } from '@/hooks/queries/useAiReadingsQuery';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useAiReadingsTableColumns } from '@/hooks/tables/useAiReadingsTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { FilterManager, useFilterManager } from '@/components/common/FilterManager';
import { aiReadingStatusOptions } from '@/components/ui/badges/badge-status';

export default function AiReadingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('-created_at');

  const { filters, handleFilterChange } = useFilterManager({
    status: 'all',
    serviceKind: 'all',
  }, () => setPage(1));

  const { data, isLoading } = useAiReadingsListQuery(
    page,
    debouncedSearch,
    filters.status,
    filters.serviceKind,
    sort
  );

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useAiReadingsTableColumns();

  const filterConfigs = [
    {
      key: 'serviceKind',
      placeholder: 'All Services',
      options: [
        { value: 'all', label: 'All Services' },
        { value: 'face_reading', label: 'Face Reading' },
        { value: 'palm_reading', label: 'Palm Reading' },
      ],
      widthClass: 'w-[160px]',
    },
    {
      key: 'status',
      placeholder: 'All Status',
      options: aiReadingStatusOptions,
      widthClass: 'w-[140px]',
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI Readings</h1>
          <p className="text-slate-500 mt-1">Monitor all users' AI Face & Palm readings and unlock status</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-sm flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search AI Reports..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <FilterManager
            configs={filterConfigs}
            values={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        <DataTable
          columns={columns}
          data={data?.data?.results || []}
          isLoading={isLoading}
          sort={sort}
          onSort={handleSort}
          emptyMessage="No AI readings found"
        />

        {data?.data && (
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={data.data.count}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
