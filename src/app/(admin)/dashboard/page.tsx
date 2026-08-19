'use client';

import { useUsers } from '@/hooks/useUsers';
import { useAllCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { useDonationCampaignsListQuery } from '@/hooks/queries/useDonationCampaignsQuery';
import { Users, Tags, Package, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatINR } from '@/lib/currency';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';

export default function DashboardPage() {
  const { data: usersData, isLoading: loadingUsers } = useUsers(1, 1);
  const { data: categoriesData, isLoading: loadingCategories } = useAllCategories();
  const { data: productsData, isLoading: loadingProducts } = useProducts(1, 1);
  const { data: campaignsData, isLoading: loadingCampaigns } = useDonationCampaignsListQuery({});

  const totalRaised = campaignsData?.data?.results?.reduce((acc, campaign) => {
    return acc + (Number(campaign.raised_amount) || 0);
  }, 0) || 0;

  const stats = [
    {
      name: 'Total Users',
      value: usersData?.meta.total || 0,
      icon: Users,
      loading: loadingUsers,
      tone: 'info' as const,
    },
    {
      name: 'Total Categories',
      value: categoriesData?.length || 0,
      icon: Tags,
      loading: loadingCategories,
      tone: 'plum' as const,
    },
    {
      name: 'Total Products',
      value: productsData?.meta.total || 0,
      icon: Package,
      loading: loadingProducts,
      tone: 'success' as const,
    },
    {
      name: 'Total Raised',
      value: formatINR(totalRaised),
      icon: Heart,
      loading: loadingCampaigns,
      tone: 'gold' as const,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Dashboard Overview"
        showBreadcrumbs={false}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.name}
            label={stat.name}
            value={stat.value}
            loading={stat.loading}
            tone={stat.tone}
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
