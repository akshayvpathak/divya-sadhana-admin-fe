import React from 'react';
import { Badge } from '../badge';
import { cn } from '@/lib/utils';
import { formatStatusLabel } from '@/lib/statusFormatter';
import { StatusConfig } from './types';
import { activeStatusMap, aiReadingsStatusMap, campaignStatusMap, commissionStatusMap, orderStatusMap, paymentStatusMap, publishedStatusMap, roleStatusMap, serviceBookingStatusMap, serviceCategoryMap, shippingStatusMap, transactionStatusMap } from './badge-status';


export type ModuleType =
  | 'active'
  | 'published'
  | 'order'
  | 'payment'
  | 'shipping'
  | 'transaction'
  | 'campaign'
  | 'commission'
  | 'role'
  | 'ai-readings'
  | 'service-booking'
  | 'service-category';

const statusMaps: Record<ModuleType, Record<string, StatusConfig>> = {
  active: activeStatusMap,
  published: publishedStatusMap,
  order: orderStatusMap,
  payment: paymentStatusMap,
  shipping: shippingStatusMap,
  transaction: transactionStatusMap,
  campaign: campaignStatusMap,
  commission: commissionStatusMap,
  role: roleStatusMap,
  'ai-readings': aiReadingsStatusMap,
  'service-booking': serviceBookingStatusMap,
  'service-category': serviceCategoryMap,
};

export interface ModuleStatusProps {
  status: string | boolean | null | undefined;
  module: ModuleType;
  className?: string;
}

export function ModuleStatus({ status, module, className }: ModuleStatusProps) {
  // Convert boolean/null/undefined values to lowercase trimmed strings for comparison
  const statusStr = status !== null && status !== undefined ? String(status).toLowerCase().trim() : '';

  const map = statusMaps[module];
  const config = map ? map[statusStr] : undefined;

  if (config) {
    return (
      <Badge
        variant={config.variant}
        className={cn("px-2.5 py-1 text-center whitespace-nowrap", config.className, className)}
      >
        {config.label}
      </Badge>
    );
  }

  // Fallback to title case formatted label
  const formatted = formatStatusLabel(status);
  return (
    <Badge
      variant="slate"
      className={cn("px-2.5 py-1 text-center whitespace-nowrap", className)}
    >
      {formatted || 'N/A'}
    </Badge>
  );
}
