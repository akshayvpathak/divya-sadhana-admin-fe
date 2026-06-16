'use client';

import { useState } from 'react';
import { useAiReadingsListQuery } from '@/hooks/queries/useAiReadingsQuery';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { useAiReadingsTableColumns } from '@/hooks/tables/useAiReadingsTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/common/DataTablePagination';

export default function AiReadingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState('all');
  const [serviceKind, setServiceKind] = useState('all');
  const [sort, setSort] = useState('-created_at');

  const { data, isLoading } = useAiReadingsListQuery(
    page,
    debouncedSearch,
    status,
    serviceKind,
    sort
  );

  const handleSort = (field: string) => {
    setSort(field);
    setPage(1);
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;
  const columns = useAiReadingsTableColumns();

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
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search request number or user email..."
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
            
            {/* Service Kind Filter */}
            <Select 
              value={serviceKind} 
              onValueChange={(val) => {
                setServiceKind(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-white w-[160px]">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="face_reading">Face Reading</SelectItem>
                <SelectItem value="palm_reading">Palm Reading</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select 
              value={status} 
              onValueChange={(val) => {
                setStatus(val || 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-white w-[140px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
