import { API_BASE_URL } from "@/services/api.service";

export interface AdminDashboardOverview {
  as_of: string;
  counts: {
    users: number;
    products: number;
    categories: number;
    orders: number;
    orders_paid: number;
    orders_pending: number;
    orders_processing: number;
    shipping_pending: number;
    shipping_shipped: number;
    shipping_delivered: number;
    trustees: number;
    services_active: number;
    campaigns_active: number;
    donations_paid: number;
    pending_withdrawals: number;
  };
  revenue: {
    lifetime: string;
    this_month: string;
  };
  donations: {
    lifetime: string;
    this_month: string;
  };
}

interface DashboardEnvelope {
  data: AdminDashboardOverview;
  message?: string;
}

export async function getAdminDashboardOverview(
  accessToken: string
): Promise<AdminDashboardOverview> {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard/overview/`, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as DashboardEnvelope | null;
  if (!response.ok || !json?.data) {
    throw new Error(json?.message || "Failed to load dashboard overview");
  }

  return json.data;
}
