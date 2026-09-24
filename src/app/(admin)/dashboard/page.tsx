'use client';

import {
  Users,
  Tags,
  Package,
  Heart,
  ShoppingCart,
  Clock3,
  LoaderCircle,
  Truck,
  HandHeart,
  Sparkles,
  Landmark,
  WalletCards,
  IndianRupee,
} from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { useAdminDashboardOverviewQuery } from '@/hooks/queries/useDashboardQuery';

export default function DashboardPage() {
  const { data, isLoading } = useAdminDashboardOverviewQuery();
  const counts = data?.counts;

  // One backend snapshot powers the whole page. Cards link to the relevant
  // admin list; order workflow cards carry the exact URL filters supported by
  // the Orders page so the number and destination stay aligned.
  const stats = [
    {
      name: 'Total Users',
      value: counts?.users ?? 0,
      icon: Users,
      tone: 'info' as const,
      href: '/users',
    },
    {
      name: 'Total Orders',
      value: counts?.orders ?? 0,
      icon: ShoppingCart,
      tone: 'royal' as const,
      href: '/orders',
    },
    {
      name: 'Pending Orders',
      value: counts?.orders_pending ?? 0,
      icon: Clock3,
      tone: 'warning' as const,
      href: '/orders?status=payment_pending',
    },
    {
      name: 'Processing Orders',
      value: counts?.orders_processing ?? 0,
      icon: LoaderCircle,
      tone: 'plum' as const,
      href: '/orders?status=processing',
    },
    {
      name: 'Pending Shipping',
      value: counts?.shipping_pending ?? 0,
      icon: Truck,
      tone: 'danger' as const,
      href: '/orders?shipping_status=pending',
    },
    {
      name: 'Total Products',
      value: counts?.products ?? 0,
      icon: Package,
      tone: 'success' as const,
      href: '/products',
    },
    {
      name: 'Categories',
      value: counts?.categories ?? 0,
      icon: Tags,
      tone: 'plum' as const,
      href: '/categories',
    },
    {
      name: 'Active Services',
      value: counts?.services_active ?? 0,
      icon: Sparkles,
      tone: 'gold' as const,
      href: '/sadhana-services',
    },
    {
      name: 'Active Campaigns',
      value: counts?.campaigns_active ?? 0,
      icon: HandHeart,
      tone: 'success' as const,
      href: '/donation-campaigns',
    },
    {
      name: 'Active Trustees',
      value: counts?.trustees ?? 0,
      icon: Landmark,
      tone: 'info' as const,
      href: '/trustees',
    },
    {
      name: 'Paid Donations',
      value: counts?.donations_paid ?? 0,
      icon: Heart,
      tone: 'gold' as const,
      href: '/donations',
    },
    {
      name: 'Pending Withdrawals',
      value: counts?.pending_withdrawals ?? 0,
      icon: WalletCards,
      tone: 'warning' as const,
      href: '/withdrawals',
    },
    {
      name: 'Total Raised',
      value: formatINR(Number(data?.donations.lifetime ?? 0)),
      icon: Heart,
      tone: 'gold' as const,
      href: '/donations',
    },
    {
      name: 'Order Revenue',
      value: formatINR(Number(data?.revenue.lifetime ?? 0)),
      icon: IndianRupee,
      tone: 'royal' as const,
      href: '/orders',
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Dashboard Overview" showBreadcrumbs={false} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.name}
            label={stat.name}
            value={stat.value}
            loading={isLoading}
            tone={stat.tone}
            href={stat.href}
            icon={<stat.icon className="h-5 w-5" />}
          />
        ))}
      </div>
    </div>
  );
}
