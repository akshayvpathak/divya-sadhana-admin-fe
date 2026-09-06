import React from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';
import { applyDiscount, type DiscountType } from '@/schemas/discount.schema';

export interface AiServiceRow {
  id: string;
  name: string;
  slug: string;
  kind: string;
  report_unlock_price: number;
  is_active: boolean;
  discount_enabled: boolean;
  discount_type: DiscountType;
  discount_value: number;
}

/**
 * Wire → row. The serializer is lenient (nullable strings throughout) but the table wants
 * concrete values, and both the paginated and the infinite query must produce the same shape
 * or the desktop and mobile views would drift.
 */
export function toAiServiceRow(s: {
  id: string;
  name?: string | null;
  slug?: string | null;
  kind?: string | null;
  report_unlock_price: number;
  is_active: boolean;
  discount_enabled: boolean;
  discount_type: DiscountType;
  discount_value: number;
}): AiServiceRow {
  return {
    id: s.id,
    name: s.name || 'Untitled',
    slug: s.slug || '',
    kind: s.kind || '',
    report_unlock_price: s.report_unlock_price,
    is_active: s.is_active,
    discount_enabled: s.discount_enabled,
    discount_type: s.discount_type,
    discount_value: s.discount_value,
  };
}

/** Base price struck through beside the payable one, so a live discount is obvious at a glance. */
function priceCell(row: AiServiceRow): React.ReactNode {
  const final = applyDiscount(row.report_unlock_price, row);
  if (!row.discount_enabled || final >= row.report_unlock_price) {
    return <span className="tabular-nums">{formatINR(row.report_unlock_price)}</span>;
  }
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-xs text-moon line-through">{formatINR(row.report_unlock_price)}</span>
      <span className="font-medium tabular-nums text-charcoal">{formatINR(final)}</span>
    </span>
  );
}

function discountCell(row: AiServiceRow): React.ReactNode {
  if (!row.discount_enabled || row.discount_value <= 0) {
    return <span className="text-moon">—</span>;
  }
  return (
    <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-charcoal">
      {row.discount_type === 'fixed' ? `${formatINR(row.discount_value)} OFF` : `${row.discount_value}% OFF`}
    </span>
  );
}

export const useAiServiceTableColumns = (): ColumnConfig<AiServiceRow>[] => [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Service',
    mobile: 'title',
    renderCell: (row) => (
      <span className="flex flex-col">
        <span className="font-medium text-charcoal">{row.name}</span>
        <span className="text-xs text-moon">{row.slug}</span>
      </span>
    ),
  },
  {
    id: 'report_unlock_price',
    accessorKey: 'report_unlock_price',
    header: 'Unlock price',
    mobile: 'field',
    renderCell: priceCell,
  },
  {
    id: 'discount',
    accessorKey: 'discount_value',
    header: 'Discount',
    mobile: 'field',
    renderCell: discountCell,
  },
  {
    id: 'is_active',
    accessorKey: 'is_active',
    header: 'Status',
    mobile: 'status',
    renderCell: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
  },
  {
    id: 'actions',
    header: 'Actions',
    mobile: 'actions',
    headerAlign: 'center',
    cellAlign: 'center',
    // Edit only: AI services are created and configured outside this panel.
    renderCell: (row) => <RowActions actions={[{ kind: 'edit', href: `/ai-services/${row.id}` }]} />,
  },
];
