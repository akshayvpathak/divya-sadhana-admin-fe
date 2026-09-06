import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { useInfiniteListQuery } from "./useInfiniteListQuery";
import { toAiServiceRow } from "@/hooks/tables/useAiServiceTableColumns";
import {
  getAiService,
  getAiServicesList,
  updateAiService,
} from "@/services/ai-services.service";

const AI_SERVICES_PAGE_SIZE = 10;

export const useAiServicesListQuery = (filters: { page?: number; search?: string } = {}) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["ai-services", filters],
    queryFn: () => {
      if (!accessToken) throw new Error("No access token");
      return getAiServicesList(accessToken, {
        page: filters.page ?? 1,
        page_size: AI_SERVICES_PAGE_SIZE,
        search: filters.search,
      });
    },
    enabled: !!accessToken,
    placeholderData: keepPreviousData,
  });
};

export const useAiServiceQuery = (id: string) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["ai-service", id],
    queryFn: () => {
      if (!accessToken) throw new Error("No access token");
      return getAiService(id, accessToken);
    },
    enabled: !!id && !!accessToken,
  });
};

export const useUpdateAiService = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      if (!accessToken) throw new Error("No access token");
      return updateAiService(id, data, accessToken);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ai-services"] });
      queryClient.invalidateQueries({ queryKey: ["ai-service", variables.id] });
      toast.success("Pricing updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/** Card list below `lg`: same endpoint, appended page by page. */
export const useAiServicesInfiniteQuery = (filters: { search?: string } = {}) => {
  const { accessToken } = useAuth();
  return useInfiniteListQuery({
    queryKey: ["ai-services", "infinite", filters],
    pageSize: AI_SERVICES_PAGE_SIZE,
    enabled: !!accessToken,
    fetchPage: async (page) => {
      if (!accessToken) throw new Error("No access token");
      const response = await getAiServicesList(accessToken, {
        page,
        page_size: AI_SERVICES_PAGE_SIZE,
        search: filters.search,
      });
      return { count: response.data.count, results: response.data.results.map(toAiServiceRow) };
    },
  });
};
