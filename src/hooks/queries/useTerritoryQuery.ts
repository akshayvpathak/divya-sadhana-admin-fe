import { useAuth } from "@/context/AuthContext";
import {
  CreateAssignmentPayload,
  UpdateAssignmentPayload,
} from "@/schemas/territory.schema";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentsList,
  getStatesList,
  updateAssignment,
} from "@/services/territory.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const useStatesListQuery = (filters: {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: string;
  sort?: string;
} = {}) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["territory-states", filters],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getStatesList(accessToken, {
        page: filters.page,
        page_size: filters.page_size ?? 100,
        search: filters.search,
        is_active: filters.is_active,
        sort: filters.sort,
      });
    },
    enabled: !!accessToken,
  });
};

export const useAssignmentsListQuery = (filters: {
  page?: number;
  page_size?: number;
  search?: string;
  state?: string;
  trustee?: string;
  is_active?: string;
  sort?: string;
} = {}) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["territory-assignments", filters],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getAssignmentsList(accessToken, {
        page: filters.page ?? 1,
        page_size: filters.page_size ?? 10,
        search: filters.search,
        state: filters.state,
        trustee: filters.trustee,
        is_active: filters.is_active,
        sort: filters.sort,
      });
    },
    enabled: !!accessToken,
  });
};

export const useCreateAssignmentMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAssignmentPayload) => {
      if (!accessToken) throw new Error("No access token");
      return createAssignment(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["territory-assignments"] });
      toast.success("Area trustee assigned");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateAssignmentMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAssignmentPayload;
    }) => {
      if (!accessToken) throw new Error("No access token");
      return updateAssignment(id, payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["territory-assignments"] });
      toast.success("Assignment updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteAssignmentMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) throw new Error("No access token");
      return deleteAssignment(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["territory-assignments"] });
      toast.success("Assignment removed");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
