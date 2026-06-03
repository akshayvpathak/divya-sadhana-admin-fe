'use client';

import { useState } from 'react';
import { useDonationsListQuery } from '@/hooks/queries/useDonationsQuery';
import { Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import dayjs from 'dayjs';

export default function DonationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-paid_at');
  
  const { data, isLoading } = useDonationsListQuery({ page, search, sort });

  const handleSort = (field: string) => {
    if (sort === field) {
      setSort(`-${field}`);
    } else if (sort === `-${field}`) {
      setSort('');
    } else {
      setSort(field);
    }
    setPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sort === field) return <ArrowUp className="h-4 w-4 text-indigo-600 shrink-0" />;
    if (sort === `-${field}`) return <ArrowDown className="h-4 w-4 text-indigo-600 shrink-0" />;
    return <ArrowUpDown className="h-4 w-4 text-slate-400 shrink-0" />;
  };

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Donations</h1>
          <p className="text-slate-500 mt-1">Manage platform donations</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search donations..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead 
                  className="cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('donation_number')}
                >
                  <div className="flex items-center gap-1">
                    Reference
                    {getSortIcon('donation_number')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('donor_name')}
                >
                  <div className="flex items-center gap-1">
                    Donor
                    {getSortIcon('donor_name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('campaign')}
                >
                  <div className="flex items-center gap-1">
                    Campaign
                    {getSortIcon('campaign')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-1">
                    Amount
                    {getSortIcon('amount')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('paid_at')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {getSortIcon('paid_at')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data?.results?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No donations found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.results?.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell className="font-medium text-xs text-slate-500">{donation.donation_number || '-'}</TableCell>
                    <TableCell>{donation.donor_name}</TableCell>
                    <TableCell className="text-slate-600">
                      {typeof donation.campaign === 'string' ? donation.campaign : donation.campaign?.title || donation.campaign_title || 'General'}
                    </TableCell>
                    <TableCell className="font-medium">${donation.amount}</TableCell>
                    <TableCell>
                      <StatusBadge status={donation.status} type="transaction_status" />
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {donation.paid_at ? dayjs(donation.paid_at).format('MMM D, YYYY') : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(page * 10, data?.data?.count || 0)}</span> of <span className="font-medium">{data?.data?.count || 0}</span> results
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
