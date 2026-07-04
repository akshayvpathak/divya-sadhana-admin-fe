import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';
import dayjs from 'dayjs';

export interface DonationCampaignRow {
  id: string;
  cover_image_url?: string | null;
  title: string;
  target_amount: number;
  raised_amount: number;
  progress_percent: number;
  status: string;
  ends_at: string | null;
}

interface UseDonationCampaignTableColumnsProps {
  openDeleteModal: (id: string) => void;
}

export const useDonationCampaignTableColumns = ({
  openDeleteModal,
}: UseDonationCampaignTableColumnsProps): ColumnConfig<DonationCampaignRow>[] => {
  return [
    {
      id: 'cover_image_url',
      header: 'Image',
      headerClassName: 'w-[80px]',
      renderCell: (row) => (
        <div className="h-10 w-10 relative rounded-md overflow-hidden bg-slate-100 border border-slate-200">
          {row.cover_image_url ? (
            <Image 
              src={row.cover_image_url} 
              alt={row.title} 
              fill 
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-slate-300" />
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'title',
      accessorKey: 'title',
      header: 'Title',
      sortable: true,
      cellClassName: 'font-medium max-w-[200px] truncate',
    },
    {
      id: 'target_amount',
      accessorKey: 'target_amount',
      header: 'Target',
      sortable: true,
      cellClassName: 'font-medium text-slate-900',
      renderCell: (row) => formatINR(row.target_amount),
    },
    {
      id: 'progress',
      header: 'Progress',
      renderCell: (row) => (
        <div className="space-y-1.5 w-full max-w-[120px]">
          <div className="flex justify-between text-[10px] font-medium">
            <span>{formatINR(row.raised_amount)}</span>
            <span>{row.progress_percent}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500" 
              style={{ width: `${Math.min(Number(row.progress_percent), 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      renderCell: (row) => <StatusBadge status={row.status} type="campaign_status" />,
    },
    {
      id: 'ends_at',
      accessorKey: 'ends_at',
      header: 'Ends At',
      sortable: true,
      cellClassName: 'text-slate-500',
      renderCell: (row) => row.ends_at ? dayjs(row.ends_at).format('MMM D, YYYY') : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      renderCell: (row) => (
        <div>
          <Link href={`/donation-campaigns/${row.id}`}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/donation-campaigns/${row.id}?mode=edit`}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
              <Edit2 className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => openDeleteModal(row.id)} 
            className="text-slate-400 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
};
