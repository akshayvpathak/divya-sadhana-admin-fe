'use client';

import { useUsers } from '@/hooks/useUsers';
import { useAllCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { useDonationCampaignsListQuery } from '@/hooks/queries/useDonationCampaignsQuery';
import { Users, Tags, Package, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
      color: 'bg-blue-500',
    },
    {
      name: 'Total Categories',
      value: categoriesData?.length || 0,
      icon: Tags,
      loading: loadingCategories,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Products',
      value: productsData?.meta.total || 0,
      icon: Package,
      loading: loadingProducts,
      color: 'bg-emerald-500',
    },
    {
      name: 'Total Raised',
      value: `$${totalRaised.toLocaleString()}`,
      icon: Heart,
      loading: loadingCampaigns,
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome to your admin control panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4"
          >
            <div className={`p-4 rounded-lg text-white ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              {stat.loading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-8 h-96 flex items-center justify-center">
        <p className="text-slate-400">Charts and more detailed analytics would go here.</p>
      </div> */}
    </div>
  );
}
