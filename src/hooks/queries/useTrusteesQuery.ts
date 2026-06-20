import { useAuth } from "@/context/AuthContext";
import { PromoteTrusteePayload } from "@/schemas/trustees.schema";
import {
  getTrusteeCommissions,
  getTrusteeDashboard,
  getTrusteesList,
  promoteTrustee,
} from "@/services/trustees.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const useTrusteesListQuery = (filters: {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: string;
  sort?: string;
} = {}) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["trustees", filters],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getTrusteesList(accessToken, {
        page: filters.page ?? 1,
        page_size: filters.page_size ?? 10,
        search: filters.search,
        is_active: filters.is_active,
        sort: filters.sort,
      });
    },
    enabled: !!accessToken,
  });
};

export const useTrusteeDashboardQuery = (trusteeId: string | null) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["trustee-dashboard", trusteeId],
    queryFn: async () => {
      if (!accessToken || !trusteeId) throw new Error("Missing required data");
      return getTrusteeDashboard(trusteeId, accessToken);
    },
    enabled: !!accessToken && !!trusteeId,
  });
};

export const useTrusteeCommissionsQuery = (
  trusteeId: string | null,
  filters: { status?: string; kind?: string; page?: number } = {}
) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["trustee-commissions", trusteeId, filters],
    queryFn: async () => {
      if (!accessToken || !trusteeId) throw new Error("Missing required data");
      return getTrusteeCommissions(trusteeId, accessToken, {
        status: filters.status,
        kind: filters.kind,
        page: filters.page ?? 1,
        page_size: 10,
      });
    },
    enabled: !!accessToken && !!trusteeId,
  });
};

export const usePromoteTrusteeMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PromoteTrusteePayload) => {
      if (!accessToken) throw new Error("No access token");
      return promoteTrustee(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trustees"] });
      toast.success("Trustee promoted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
