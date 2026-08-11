import React from 'react';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';
import dayjs from 'dayjs';

export interface DonationCampaignRow {
  id: string;
  cover_image_url?: string | null;
  title: string;
  description?: string | null;
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
      id: 'title',
      accessorKey: 'title',
      header: 'Campaign',
      sortable: true,
      renderCell: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
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
          <div className="flex flex-col max-w-[250px]">
            <span className="font-medium truncate">{row.title}</span>
            <span 
              className="text-xs text-slate-500 overflow-hidden whitespace-nowrap text-ellipsis [&>*]:inline"
              dangerouslySetInnerHTML={{ __html: row.description || '' }}
            />
          </div>
        </div>
      ),
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
      headerAlign: 'right',
      cellAlign: 'right',
      renderCell: (row) => (
        <RowActions
          actions={[
            { kind: 'view', href: `/donation-campaigns/${row.id}` },
            { kind: 'edit', href: `/donation-campaigns/${row.id}?mode=edit` },
            { kind: 'delete', onClick: () => openDeleteModal(row.id) },
          ]}
        />
      ),
    },
  ];
};
