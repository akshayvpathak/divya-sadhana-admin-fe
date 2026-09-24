import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getAdminDashboardOverview } from "@/services/dashboard.service";

export const DASHBOARD_OVERVIEW_KEY = ["admin-dashboard-overview"];

export function useAdminDashboardOverviewQuery() {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: DASHBOARD_OVERVIEW_KEY,
    queryFn: () => getAdminDashboardOverview(accessToken!),
    enabled: !!accessToken,
    staleTime: 30_000,
  });
}
