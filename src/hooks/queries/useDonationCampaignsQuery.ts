import { useAuth } from "@/context/AuthContext";
import {
  CreateDonationCampaignPayload,
  UpdateDonationCampaignPayload,
} from "@/schemas/donation-campaigns.schema";
import {
  createDonationCampaign,
  deleteDonationCampaign,
  getDonationCampaign,
  getDonationCampaignsList,
  updateDonationCampaign,
} from "@/services/donation-campaigns.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const notifyError = (fallback: string) => (error: unknown) => {
  toast.error(error instanceof Error ? error.message : fallback);
};

export const useDonationCampaignsListQuery = (filters: {
  page?: number;
  search?: string;
  status?: string;
  is_active?: string;
  target_amount_min?: string;
  target_amount_max?: string;
  ends_at?: string;
  sort?: string;
}) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["donation-campaigns", filters],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getDonationCampaignsList(accessToken, {
        page: filters.page ?? 1,
        page_size: 10,
        search: filters.search ?? "",
        status: filters.status,
        is_active: filters.is_active,
        target_amount_min: filters.target_amount_min,
        target_amount_max: filters.target_amount_max,
        ends_at: filters.ends_at,
        sort: filters.sort,
      });
    },
    enabled: !!accessToken,
  });
};

export const useAllDonationCampaignsQuery = () => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["donation-campaigns", "all"],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      const response = await getDonationCampaignsList(accessToken, {
        page: 1,
        page_size: 100,
      });
      return response.data.results;
    },
    enabled: !!accessToken,
    staleTime: 30000,
  });
};

export const useDonationCampaignQuery = (campaignId: string | null) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["donation-campaign", campaignId],
    queryFn: async () => {
      if (!accessToken || !campaignId) throw new Error("Missing required data");
      return getDonationCampaign(campaignId, accessToken);
    },
    enabled: !!accessToken && !!campaignId,
  });
};

export const useCreateDonationCampaignMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateDonationCampaignPayload) => {
      if (!accessToken) throw new Error("No access token");
      return createDonationCampaign(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donation-campaigns"] });
    },
    onError: notifyError("Failed to create campaign. Please try again."),
  });
};

export const useUpdateDonationCampaignMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, payload }: { campaignId: string; payload: UpdateDonationCampaignPayload }) => {
      if (!accessToken) throw new Error("No access token");
      return updateDonationCampaign(campaignId, payload, accessToken);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["donation-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["donation-campaign", variables.campaignId] });
    },
    onError: notifyError("Failed to update campaign. Please try again."),
  });
};

export const useDeleteDonationCampaignMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      if (!accessToken) throw new Error("No access token");
      return deleteDonationCampaign(campaignId, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donation-campaigns"] });
    },
    onError: notifyError("Failed to delete campaign. Please try again."),
  });
};