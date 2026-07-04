import { useAuth } from "@/context/AuthContext";
import { PromoteTrusteePayload } from "@/schemas/trustees.schema";
import {
  getTrusteeCommissions,
  getTrusteeDashboard,
  getTrusteeEarningsSummary,
  getTrusteesList,
  promoteTrustee,
  updateTrustee,
  deleteTrustee,
  UpdateTrusteePayload,
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

export const useTrusteeEarningsSummaryQuery = (trusteeId: string | null) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["trustee-earnings-summary", trusteeId],
    queryFn: async () => {
      if (!accessToken || !trusteeId) throw new Error("Missing required data");
      return getTrusteeEarningsSummary(trusteeId, accessToken);
    },
    enabled: !!accessToken && !!trusteeId,
  });
};

export const useUpdateTrusteeMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateTrusteePayload }) => {
      if (!accessToken) throw new Error("No access token");
      return updateTrustee(id, payload, accessToken);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trustees"] });
      queryClient.invalidateQueries({ queryKey: ["trustee-dashboard", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["trustee-earnings-summary", variables.id] });
      toast.success("Trustee updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteTrusteeMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) throw new Error("No access token");
      return deleteTrustee(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trustees"] });
      toast.success("Trustee removed");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
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
