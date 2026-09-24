'use client';

import { useUsers } from '@/hooks/useUsers';
import { useAllCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { useDonationCampaignsListQuery } from '@/hooks/queries/useDonationCampaignsQuery';
import { useOrdersListQuery } from '@/hooks/queries/useOrdersQuery';
import { Users, Tags, Package, Heart, ShoppingCart } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';

export default function DashboardPage() {
  const { data: usersData, isLoading: loadingUsers } = useUsers(1, 1);
  const { data: categoriesData, isLoading: loadingCategories } = useAllCategories();
  const { data: productsData, isLoading: loadingProducts } = useProducts(1, 1);
  const { data: campaignsData, isLoading: loadingCampaigns } = useDonationCampaignsListQuery({});
  // Only `count` is read; the rows come along for the ride.
  const { data: ordersData, isLoading: loadingOrders } = useOrdersListQuery(1, '', '-created_at');

  const totalRaised = campaignsData?.data?.results?.reduce((acc, campaign) => {
    return acc + (Number(campaign.raised_amount) || 0);
  }, 0) || 0;

  // Every card links to the list its number came from, so the dashboard is a
  // way in rather than a read-only summary.
  const stats = [
    {
      name: 'Total Users',
      value: usersData?.meta.total || 0,
      icon: Users,
      loading: loadingUsers,
      tone: 'info' as const,
      href: '/users',
    },
    {
      name: 'Total Orders',
      value: ordersData?.data?.count || 0,
      icon: ShoppingCart,
      loading: loadingOrders,
      tone: 'royal' as const,
      href: '/orders',
    },
    {
      name: 'Total Categories',
      value: categoriesData?.length || 0,
      icon: Tags,
      loading: loadingCategories,
      tone: 'plum' as const,
      href: '/categories',
    },
    {
      name: 'Total Products',
      value: productsData?.meta.total || 0,
      icon: Package,
      loading: loadingProducts,
      tone: 'success' as const,
      href: '/products',
    },
    {
      name: 'Total Raised',
      value: formatINR(totalRaised),
      icon: Heart,
      loading: loadingCampaigns,
      tone: 'gold' as const,
      href: '/donation-campaigns',
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Dashboard Overview"
        showBreadcrumbs={false}
      />

      {/* Three across, not five: at five columns the longer labels wrap and the
          values stop lining up across the row. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.name}
            label={stat.name}
            value={stat.value}
            loading={stat.loading}
            tone={stat.tone}
            href={stat.href}
            icon={<stat.icon className="h-5 w-5" />}
          />
        ))}
      </div>

      {/* <div className="bg-surface rounded-2xl shadow-card border border-line p-4 sm:p-6 mt-8 h-96 flex items-center justify-center">
        <p className="text-moon">Charts and more detailed analytics would go here.</p>
      </div> */}
    </div>
  );
}
