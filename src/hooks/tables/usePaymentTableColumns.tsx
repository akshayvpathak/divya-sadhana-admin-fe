import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { formatINR } from '@/lib/currency';
import { DateTimeCell } from '@/components/common/DateTimeCell';
import {
  PAYMENT_SOURCE_BADGE,
  PAYMENT_SOURCE_LABELS,
  paymentRelatedHref,
  paymentRelatedLabel,
} from '@/lib/payment-links';
import type { AllPayment } from '@/schemas/payments.schema';

export type PaymentRow = AllPayment;

function userDisplayName(user: AllPayment['user']): string {
  if (!user) return '';
  if (user.full_name?.trim()) return user.full_name.trim();
  return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
}

export const usePaymentTableColumns = (): ColumnConfig<PaymentRow>[] => {
  return [
    {
      id: 'internal_payment_ref',
      accessorKey: 'internal_payment_ref',
      header: 'Reference',
      cellClassName: 'font-medium text-moon text-xs',
      mobile: 'title',
      renderMobile: (row) => (
        <span className="font-mono text-sm break-all">
          {row.internal_payment_ref}
        </span>
      ),
    },
    {
      id: 'source',
      accessorKey: 'source',
      header: 'Source',
      mobile: 'status',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => {
        const source = row.source || '';
        const label = PAYMENT_SOURCE_LABELS[source] ?? source.replace(/_/g, ' ');
        const badge =
          PAYMENT_SOURCE_BADGE[source] ??
          'bg-cream text-charcoal border-line';
        return (
          <span
            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      id: 'user',
      accessorKey: 'user',
      header: 'User',
      mobile: 'subtitle',
      renderCell: (row) => {
        if (row.user == null) {
          return <span className="italic text-moon">Deleted user</span>;
        }
        const name = userDisplayName(row.user);
        return name || row.user.email || 'Unknown';
      },
    },
    {
      id: 'association',
      header: 'Linked To',
      mobile: 'field',
      renderCell: (row) => {
        const href = paymentRelatedHref(row.source, row.reference_id);
        const label = paymentRelatedLabel(row.source);
        if (href) {
          return (
            <Link
              href={href}
              className="font-medium text-gold-press hover:text-ink hover:underline"
            >
              {label}
            </Link>
          );
        }
        if (row.source === 'consultation') {
          return <span className="font-medium text-charcoal">{label}</span>;
        }
        return <span className="italic text-moon">None</span>;
      },
    },
    {
      id: 'provider',
      accessorKey: 'provider',
      header: 'Provider',
      cellClassName: 'capitalize',
      mobile: 'field',
      renderCell: (row) => row.provider || null,
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'Amount',
      cellClassName: 'font-medium',
      mobile: 'field',
      renderCell: (row) =>
        row.amount !== undefined ? formatINR(row.amount) : null,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      headerAlign: 'center',
      cellAlign: 'center',
      mobile: 'status',
      renderCell: (row) => (
        <StatusBadge status={row.status || ''} type="transaction_status" />
      ),
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Date',
      cellClassName: 'whitespace-nowrap',
      mobile: 'field',
      renderCell: (row) => <DateTimeCell value={row.created_at} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      mobile: 'actions',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => {
        const href = paymentRelatedHref(row.source, row.reference_id);
        return (
          <RowActions
            actions={[
              {
                kind: 'view',
                href: href ?? undefined,
                hidden: !href,
              },
            ]}
          />
        );
      },
    },
  ];
};
