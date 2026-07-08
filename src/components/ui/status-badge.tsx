import React from 'react';
import { ModuleStatus, ModuleType } from './badges/ModuleStatus';

interface StatusBadgeProps {
  status?: string | boolean | null;
  type?: 'active' | 'published' | 'order_status' | 'payment_status' | 'shipping_status' | 'transaction_status' | 'campaign_status' | 'commission_status' | 'role';
}

const typeToModuleMap: Record<string, ModuleType> = {
  active: 'active',
  published: 'published',
  order_status: 'order',
  payment_status: 'payment',
  shipping_status: 'shipping',
  transaction_status: 'transaction',
  campaign_status: 'campaign',
  commission_status: 'commission',
  role: 'role',
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const module = type ? typeToModuleMap[type] : undefined;
  
  if (module) {
    return <ModuleStatus status={status} module={module} />;
  }

  // Fallback if type is missing: infer module based on status string value
  const statusStr = status !== null && status !== undefined ? String(status).toLowerCase().trim() : '';
  let fallbackModule: ModuleType = 'active';

  if (['success', 'successful', 'completed', 'captured', 'paid', 'succeeded', 'failed', 'failure', 'declined', 'error', 'rejected', 'pending', 'initiated', 'processing', 'authorized', 'unpaid', 'created', 'refunded', 'refund'].includes(statusStr)) {
    fallbackModule = 'transaction';
  } else if (['active', 'completed', 'inactive'].includes(statusStr)) {
    fallbackModule = 'campaign';
  } else if (statusStr === 'admin' || statusStr === 'user') {
    fallbackModule = 'role';
  }

  return <ModuleStatus status={status} module={fallbackModule} />;
}
