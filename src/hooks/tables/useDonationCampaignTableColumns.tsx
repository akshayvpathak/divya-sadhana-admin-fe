import React from 'react';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';
import { DateTimeCell } from '@/components/common/DateTimeCell';

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
      mobile: 'title',
      renderMobile: (row) => (
        <span className="flex items-start gap-3">
          <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-line bg-cosmos">
            {row.cover_image_url ? (
              <Image src={row.cover_image_url} alt={row.title} fill className="object-cover" unoptimized />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-5 w-5 text-line" />
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block break-words">{row.title}</span>
            <span
              className="mt-0.5 line-clamp-2 block text-xs font-normal text-moon [&>*]:inline"
              dangerouslySetInnerHTML={{ __html: row.description || '' }}
            />
          </span>
        </span>
      ),
      renderCell: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-cosmos shrink-0 border border-line">
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
                <ImageIcon className="h-5 w-5 text-line" />
              </div>
            )}
          </div>
          <div className="flex flex-col max-w-[250px]">
            <span className="font-medium truncate">{row.title}</span>
            <span 
              className="text-xs text-moon overflow-hidden whitespace-nowrap text-ellipsis [&>*]:inline"
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
      cellClassName: 'font-medium text-ink',
      mobile: 'field',
      renderCell: (row) => formatINR(row.target_amount),
    },
    {
      id: 'progress',
      header: 'Progress',
      mobile: 'field',
      // Full-width bar on a card; the table caps it at 120px.
      renderMobile: (row) => (
        <span className="block w-full min-w-32 space-y-1.5">
          <span className="flex justify-between text-[11px] font-medium">
            <span>{formatINR(row.raised_amount)}</span>
            <span>{row.progress_percent}%</span>
          </span>
          <span className="block h-1.5 w-full overflow-hidden rounded-full bg-cosmos">
            <span
              className="block h-full bg-gold-deep transition-all duration-500"
              style={{ width: `${Math.min(Number(row.progress_percent), 100)}%` }}
            />
          </span>
        </span>
      ),
      renderCell: (row) => (
        <div className="space-y-1.5 w-full max-w-[120px]">
          <div className="flex justify-between text-[10px] font-medium">
            <span>{formatINR(row.raised_amount)}</span>
            <span>{row.progress_percent}%</span>
          </div>
          <div className="h-1.5 w-full bg-cosmos rounded-full overflow-hidden">
            <div 
              className="h-full bg-gold-deep transition-all duration-500" 
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
      headerAlign: 'center',
      cellAlign: 'center',
      mobile: 'status',
      renderCell: (row) => <StatusBadge status={row.status} type="campaign_status" />,
    },
    {
      id: 'ends_at',
      accessorKey: 'ends_at',
      header: 'Ends At',
      sortable: true,
      cellClassName: 'whitespace-nowrap',
      mobile: 'field',
      mobileLabel: 'Ends',
      renderCell: (row) => <DateTimeCell value={row.ends_at} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      mobile: 'actions',
      headerAlign: 'center',
      cellAlign: 'center',
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
