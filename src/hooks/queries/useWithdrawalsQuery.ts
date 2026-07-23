import { useAuth } from "@/context/AuthContext";
import {
  approveWithdrawal,
  getWithdrawalsList,
  markWithdrawalFailed,
  markWithdrawalPaid,
  rejectWithdrawal,
} from "@/services/wallet.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const useWithdrawalsListQuery = (
  filters: {
    page?: number;
    page_size?: number;
    status?: string;
  } = {}
) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["withdrawals", filters],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getWithdrawalsList(accessToken, {
        page: filters.page ?? 1,
        page_size: filters.page_size ?? 10,
        status: filters.status,
      });
    },
    enabled: !!accessToken,
  });
};

export const useApproveWithdrawalMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) throw new Error("No access token");
      return approveWithdrawal(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      toast.success("Withdrawal approved");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useRejectWithdrawalMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!accessToken) throw new Error("No access token");
      return rejectWithdrawal(id, reason, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      toast.success("Withdrawal rejected");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useMarkWithdrawalPaidMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) throw new Error("No access token");
      return markWithdrawalPaid(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      toast.success("Withdrawal marked as paid");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useMarkWithdrawalFailedMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!accessToken) throw new Error("No access token");
      return markWithdrawalFailed(id, reason, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      toast.success("Withdrawal marked as failed");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
