import React from 'react';
import { DateTimeCell } from '@/components/common/DateTimeCell';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { Withdrawal } from '@/schemas/withdrawals.schema';
import { formatINR } from '@/lib/currency';
import { WithdrawalStatusBadge } from './WithdrawalStatusBadge';
import { WithdrawalActionsCell } from './WithdrawalActionsCell';

/** Best-effort display name for the trustee behind a withdrawal request. */
export function withdrawalTrusteeName(row: Withdrawal): string {
  if (row.trustee_name) return row.trustee_name;
  if (row.trustee && typeof row.trustee === 'object') {
    const t = row.trustee as Record<string, unknown>;
    const full =
      (t.full_name as string) ||
      (t.name as string) ||
      [t.first_name, t.last_name].filter(Boolean).join(' ').trim();
    if (full) return full;
    if (typeof t.email === 'string') return t.email;
  }
  // Composed cell (name over email), so a string is required here.
  return row.trustee_email || '—';
}

const METHOD_LABELS: Record<string, string> = {
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
};

function methodLabel(method?: string | null): string {
  const key = (method ?? '').toLowerCase().trim();
  return METHOD_LABELS[key] || (method ? String(method) : '—');
}

/** Compact payout destination line for the method column. */
function payoutDetail(row: Withdrawal): string | null {
  const key = (row.method ?? '').toLowerCase().trim();
  if (key === 'upi') return row.upi_id || null;
  if (key === 'bank_transfer') {
    const parts = [
      row.bank_account_name,
      row.bank_account_number,
      row.bank_ifsc,
    ].filter(Boolean) as string[];
    return parts.length ? parts.join(' · ') : null;
  }
  // Unknown method — surface whatever payout hint exists.
  return row.upi_id || row.bank_account_number || null;
}

export const useWithdrawalTableColumns = (): ColumnConfig<Withdrawal>[] => {
  return [
    {
      id: 'trustee',
      header: 'Trustee',
      cellClassName: 'font-medium text-ink',
      mobile: 'title',
      renderMobile: (row) => {
        const name = withdrawalTrusteeName(row);
        const email = row.trustee_email;
        return (
          <span className="block">
            <span className="block break-words">{name}</span>
            {email && email !== name ? (
              <span className="mt-0.5 block break-all text-xs font-normal text-moon">{email}</span>
            ) : null}
          </span>
        );
      },
      renderCell: (row) => {
        const name = withdrawalTrusteeName(row);
        const email = row.trustee_email;
        return (
          <div className="flex flex-col">
            <span>{name}</span>
            {email && email !== name && (
              <span className="text-xs text-moon">{email}</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'Amount',
      mobile: 'field',
      headerAlign: 'right',
      cellAlign: 'right',
      cellClassName: 'font-medium text-ink',
      renderCell: (row) =>
        row.amount !== null && row.amount !== undefined
          ? formatINR(row.amount)
          : '—',
    },
    {
      id: 'method',
      header: 'Method',
      mobile: 'field',
      renderCell: (row) => {
        const detail = payoutDetail(row);
        return (
          <div className="flex flex-col">
            <span className="text-charcoal text-sm">{methodLabel(row.method)}</span>
            {detail && (
              <span className="font-mono text-xs text-moon max-w-[240px] truncate">
                {detail}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      mobile: 'status',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => <WithdrawalStatusBadge status={row.status} />,
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Requested',
      mobile: 'field',
      cellClassName: 'whitespace-nowrap',
      renderCell: (row) => <DateTimeCell value={row.created_at} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      mobile: 'actions',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => <WithdrawalActionsCell withdrawal={row} />,
    },
  ];
};
