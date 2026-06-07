import React from 'react';
import { formatStatusLabel } from '@/lib/utils';

interface StatusBadgeProps {
  status?: string | boolean | null;
  type?: 'active' | 'published' | 'order_status' | 'payment_status' | 'shipping_status' | 'transaction_status' | 'campaign_status' | 'role';
}

const orderStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 font-medium text-xs',
  processing: 'bg-blue-100 text-blue-700 font-medium text-xs',
  completed: 'bg-green-100 text-green-700 font-medium text-xs',
  cancelled: 'bg-rose-100 text-rose-700 font-medium text-xs',
  refunded: 'bg-orange-100 text-orange-700 font-medium text-xs',
  failed: 'bg-rose-100 text-rose-700 font-medium text-xs',
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  // Convert boolean/null to string for switch case matching
  const statusStr = status !== null && status !== undefined ? String(status).toLowerCase().trim() : '';
  
  let label = status !== null && status !== undefined ? String(status) : 'N/A';
  let classes = "bg-slate-100 text-slate-700";

  switch (type) {
    case 'active':
      if (statusStr === 'true' || statusStr === 'active') {
        label = 'Active';
        classes = 'bg-green-100 text-green-700 font-bold uppercase tracking-wider text-[10px]';
      } else {
        label = 'Inactive';
        classes = 'bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]';
      }
      break;
    
    case 'published':
      if (statusStr === 'true' || statusStr === 'published') {
        label = 'Published';
        classes = 'bg-indigo-100 text-indigo-700 font-bold uppercase tracking-wider text-[10px]';
      } else {
        label = 'Draft';
        classes = 'bg-amber-100 text-amber-700 font-bold uppercase tracking-wider text-[10px]';
      }
      break;

    case 'order_status': {
      const matchedColor = orderStatusColors[statusStr];
      classes = matchedColor || 'bg-slate-100 text-slate-700 font-medium text-xs';
      label = status ? String(status) : 'Pending';
      break;
    }

    case 'payment_status':
      if (statusStr === 'paid') {
        label = 'Paid';
        classes = 'bg-green-100 text-green-700 font-bold uppercase tracking-wider text-xs';
      } else {
        label = status ? String(status) : 'Unpaid';
        classes = 'bg-amber-100 text-amber-700 font-bold uppercase tracking-wider text-xs';
      }
      break;

    case 'shipping_status':
      if (statusStr === 'delivered') {
        label = 'Delivered';
        classes = 'bg-green-100 text-green-700 font-bold uppercase tracking-wider text-xs';
      } else {
        label = status ? String(status) : 'Pending';
        classes = 'bg-blue-100 text-blue-700 font-bold uppercase tracking-wider text-xs';
      }
      break;

    case 'transaction_status':
      if (['success', 'successful', 'completed', 'captured', 'paid', 'succeeded'].includes(statusStr)) {
        label = 'Success';
        classes = 'bg-green-100 text-green-700 font-medium text-xs';
      } else if (['failed', 'failure', 'declined', 'error', 'rejected'].includes(statusStr)) {
        label = 'Failed';
        classes = 'bg-rose-100 text-rose-700 font-medium text-xs';
      } else if (['pending', 'initiated', 'processing', 'authorized', 'unpaid', 'created'].includes(statusStr)) {
        label = 'Pending';
        classes = 'bg-amber-100 text-amber-700 font-medium text-xs';
      } else if (['refunded', 'refund'].includes(statusStr)) {
        label = 'Refunded';
        classes = 'bg-blue-100 text-blue-700 font-medium text-xs';
      } else {
        label = status ? String(status) : 'Pending';
        classes = 'bg-slate-100 text-slate-700 font-medium text-xs uppercase';
      }
      break;

    case 'campaign_status':
      if (statusStr === 'active') {
        label = 'Active';
        classes = 'bg-indigo-100 text-indigo-700 font-medium text-xs';
      } else if (statusStr === 'completed') {
        label = 'Completed';
        classes = 'bg-green-100 text-green-700 font-medium text-xs';
      } else {
        label = status ? String(status) : 'Inactive';
        classes = 'bg-slate-100 text-slate-700 font-medium text-xs uppercase';
      }
      break;

    case 'role':
      if (statusStr === 'admin') {
        label = 'Admin';
        classes = 'bg-indigo-100 text-indigo-700 font-medium text-xs';
      } else {
        label = 'User';
        classes = 'bg-slate-100 text-slate-700 font-medium text-xs uppercase';
      }
      break;

    default:
      if (statusStr === 'true' || statusStr === 'active' || statusStr === 'success' || statusStr === 'paid' || statusStr === 'completed' || statusStr === 'delivered') {
        classes = 'bg-green-100 text-green-700 font-medium text-xs';
      } else if (statusStr === 'false' || statusStr === 'inactive' || statusStr === 'failed' || statusStr === 'unpaid' || statusStr === 'draft') {
        classes = 'bg-slate-100 text-slate-700 font-medium text-xs uppercasex';
      } else {
        classes = 'bg-indigo-100 text-indigo-700 font-medium text-xs uppercase';
      }
  }

  // Use the global formatting utility for label text
  const finalLabel = ['active', 'published', 'role'].includes(type || '') ? label : formatStatusLabel(label);

  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-center whitespace-nowrap ${classes}`}>
      {finalLabel}
    </span>
  );
}
