'use client';

import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { staticListState } from '@/hooks/queries/useInfiniteListQuery';
import type { ColumnConfig } from '@/components/common/DataTable/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatINR } from '@/lib/currency';
import { buildValueLabelMap, formatVariantLabel } from '@/lib/product-variants';
import type { ProductOptionGroup, ProductVariant } from '@/schemas/products.schema';

/** Read-only variants grid, on the shared DataTable. */
export function ProductVariantsTable({
  variants,
  optionGroups,
}: {
  variants: ProductVariant[];
  optionGroups: ProductOptionGroup[];
}) {
  const labelById = buildValueLabelMap(optionGroups);

  const columns: ColumnConfig<ProductVariant>[] = [
    {
      id: 'options',
      header: 'Variant',
      mobile: 'title',
      renderCell: (row) => {
        const label = formatVariantLabel(row, labelById);
        return label ? <span className="font-semibold text-ink">{label}</span> : null;
      },
    },
    {
      id: 'sku',
      accessorKey: 'sku',
      header: 'SKU',
      cellClassName: 'font-mono text-xs',
      mobile: 'subtitle',
    },
    {
      id: 'price',
      header: 'Price',
      mobile: 'field',
      cellAlign: 'right',
      headerAlign: 'right',
      cellClassName: 'font-semibold tabular-nums',
      renderCell: (row) => formatINR(row.price),
    },
    {
      id: 'stock_quantity',
      header: 'Stock',
      mobile: 'field',
      cellAlign: 'right',
      headerAlign: 'right',
      cellClassName: 'tabular-nums',
      renderCell: (row) => row.stock_quantity,
    },
    {
      id: 'is_active',
      header: 'Status',
      mobile: 'status',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => <StatusBadge status={row.is_active} type="active" />,
    },
  ];

  return (
    <ResponsiveDataView
      columns={columns}
      data={variants}
      mobile={staticListState(variants)}
      rowKey="id"
      emptyMessage="No variants configured"
      emptyHint="Add option groups and variants from the product editor."
    />
  );
}
