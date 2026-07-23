import { useAuth } from "@/context/AuthContext";
import {
  CreateServiceBatchPayload,
  UpdateServiceBatchPayload,
} from "@/schemas/service-batches.schema";
import {
  createServiceBatch,
  deleteServiceBatch,
  getServiceBatch,
  getServiceBatchesList,
  updateServiceBatch,
} from "@/services/service-batches.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const notifyError = (fallback: string) => (error: unknown) => {
  toast.error(error instanceof Error ? error.message : fallback);
};

export const useServiceBatchesListQuery = (filters: {
  page?: number;
  service?: string;
  search?: string;
  ordering?: string;
}) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["service-batches", filters],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getServiceBatchesList(accessToken, {
        page: filters.page ?? 1,
        paginate: 10,
        service: filters.service,
        search: filters.search ?? "",
        ordering: filters.ordering,
      });
    },
    enabled: !!accessToken,
  });
};

/** Open/available batches for a single service — used by the booking detail select. */
export const useServiceBatchesByServiceQuery = (serviceId: string | null | undefined) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["service-batches", "by-service", serviceId],
    queryFn: async () => {
      if (!accessToken || !serviceId) throw new Error("Missing required data");
      const response = await getServiceBatchesList(accessToken, { service: serviceId, paginate: 100 });
      return response.data.results;
    },
    enabled: !!accessToken && !!serviceId,
    staleTime: 30000,
  });
};

export const useServiceBatchQuery = (batchId: string | null) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["service-batch", batchId],
    queryFn: async () => {
      if (!accessToken || !batchId) throw new Error("Missing required data");
      return getServiceBatch(batchId, accessToken);
    },
    enabled: !!accessToken && !!batchId,
  });
};

export const useCreateServiceBatchMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateServiceBatchPayload) => {
      if (!accessToken) throw new Error("No access token");
      return createServiceBatch(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-batches"] });
    },
    onError: notifyError("Failed to create batch. Please try again."),
  });
};

export const useUpdateServiceBatchMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ batchId, payload }: { batchId: string; payload: UpdateServiceBatchPayload }) => {
      if (!accessToken) throw new Error("No access token");
      return updateServiceBatch(batchId, payload, accessToken);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-batches"] });
      queryClient.invalidateQueries({ queryKey: ["service-batch", variables.batchId] });
    },
    onError: notifyError("Failed to update batch. Please try again."),
  });
};

export const useDeleteServiceBatchMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (batchId: string) => {
      if (!accessToken) throw new Error("No access token");
      return deleteServiceBatch(batchId, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-batches"] });
    },
    onError: notifyError("Failed to delete batch. Please try again."),
  });
};
