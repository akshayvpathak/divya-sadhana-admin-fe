import { useAuth } from "@/context/AuthContext";
import {
  CreateSadhanaServicePayload,
  UpdateSadhanaServicePayload,
} from "@/schemas/sadhana-services.schema";
import {
  createSadhanaService,
  deleteSadhanaService,
  getSadhanaService,
  getSadhanaServicesList,
  updateSadhanaService,
} from "@/services/sadhana-services.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const notifyError = (fallback: string) => (error: unknown) => {
  toast.error(error instanceof Error ? error.message : fallback);
};

export const useSadhanaServicesListQuery = (filters: {
  page?: number;
  search?: string;
  category?: string;
  is_active?: string;
  ordering?: string;
}) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["sadhana-services", filters],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getSadhanaServicesList(accessToken, {
        page: filters.page ?? 1,
        paginate: 10,
        search: filters.search ?? "",
        category: filters.category,
        is_active: filters.is_active,
        ordering: filters.ordering,
      });
    },
    enabled: !!accessToken,
  });
};

export const useAllSadhanaServicesQuery = () => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["sadhana-services", "all"],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      const response = await getSadhanaServicesList(accessToken, { page: 1, paginate: 200 });
      return response.data.results;
    },
    enabled: !!accessToken,
    staleTime: 30000,
  });
};

export const useSadhanaServiceQuery = (serviceId: string | null) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["sadhana-service", serviceId],
    queryFn: async () => {
      if (!accessToken || !serviceId) throw new Error("Missing required data");
      return getSadhanaService(serviceId, accessToken);
    },
    enabled: !!accessToken && !!serviceId,
  });
};

export const useCreateSadhanaServiceMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSadhanaServicePayload) => {
      if (!accessToken) throw new Error("No access token");
      return createSadhanaService(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sadhana-services"] });
    },
    onError: notifyError("Failed to create service. Please try again."),
  });
};

export const useUpdateSadhanaServiceMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      serviceId,
      payload,
    }: {
      serviceId: string;
      payload: UpdateSadhanaServicePayload;
    }) => {
      if (!accessToken) throw new Error("No access token");
      return updateSadhanaService(serviceId, payload, accessToken);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sadhana-services"] });
      queryClient.invalidateQueries({ queryKey: ["sadhana-service", variables.serviceId] });
    },
    onError: notifyError("Failed to update service. Please try again."),
  });
};

export const useDeleteSadhanaServiceMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serviceId: string) => {
      if (!accessToken) throw new Error("No access token");
      return deleteSadhanaService(serviceId, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sadhana-services"] });
    },
    onError: notifyError("Failed to delete service. Please try again."),
  });
};
