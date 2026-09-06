import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getSiteConfig, updateSiteConfig } from "@/services/site-config.service";
import { useAuth } from "@/context/AuthContext";

const KEY = ["site-config"];

export const useSiteConfigQuery = () => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => getSiteConfig(accessToken ?? undefined),
    enabled: !!accessToken,
  });
};

export const useUpdateSiteConfig = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!accessToken) throw new Error("No access token");
      return updateSiteConfig(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast.success("Settings saved");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
