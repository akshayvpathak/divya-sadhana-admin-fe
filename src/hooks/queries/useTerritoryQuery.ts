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
  getDistrictsList,
  getTerritoryCoverageList,
  getTerritoryCoverageDetail,
  getCommissionRetentionSummary,
  getCommissionRetentionEntries,
  RetentionFilters,
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
  member?: string;
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
        member: filters.member ?? filters.trustee,
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


export const useDistrictsListQuery = (stateId: string | undefined | null) => {
  const { accessToken } = useAuth();
  const id = stateId?.trim() || "";

  return useQuery({
    queryKey: ["territory-districts", id],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getDistrictsList(accessToken, id);
    },
    enabled: !!accessToken && !!id,
  });
};

export const useTerritoryCoverageListQuery = () => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["territory-coverage"],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getTerritoryCoverageList(accessToken);
    },
    enabled: !!accessToken,
  });
};

export const useTerritoryCoverageDetailQuery = (
  stateId: string | undefined | null,
  enabled = true
) => {
  const { accessToken } = useAuth();
  const id = stateId?.trim() || "";

  return useQuery({
    queryKey: ["territory-coverage-detail", id],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getTerritoryCoverageDetail(accessToken, id);
    },
    enabled: !!accessToken && !!id && enabled,
  });
};

export const useCommissionRetentionSummaryQuery = (
  filters: RetentionFilters = {},
  enabled = true
) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["commission-retention-summary", filters],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getCommissionRetentionSummary(accessToken, filters);
    },
    enabled: !!accessToken && enabled,
  });
};

export const useCommissionRetentionEntriesQuery = (
  filters: RetentionFilters = {},
  enabled = true
) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["commission-retention-entries", filters],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getCommissionRetentionEntries(accessToken, filters);
    },
    enabled: !!accessToken && enabled,
  });
};
