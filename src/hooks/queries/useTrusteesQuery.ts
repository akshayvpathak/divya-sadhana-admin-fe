import { useAuth } from "@/context/AuthContext";
import {
  PromoteTrusteePayload,
  PromoteTrusteeWithTerritoryPayload,
} from "@/schemas/trustees.schema";
import {
  getTrusteeCommissions,
  getTrusteeDashboard,
  getTrusteesList,
  promoteTrustee,
  promoteTrusteeWithTerritory,
  updateTrustee,
  deleteTrustee,
  UpdateTrusteePayload,
} from "@/services/trustees.service";
import {
  createAssignment,
  deleteAssignment,
} from "@/services/territory.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const useTrusteesListQuery = (filters: {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: string;
  sort?: string;
  state_id?: string;
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
        state_id: filters.state_id,
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
      toast.success("Trustee updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/** Territory changes resolved by the edit form, as concrete API calls. */
export interface TerritoryDiff {
  /** Assignment ids to drop. */
  remove: string[];
  /** Seats to add for this member. */
  create: { state: string; district?: string | null }[];
}

/**
 * Edit-side counterpart to `usePromoteTrusteeWithTerritoryMutation`.
 *
 * The API has no combined update endpoint, so this fans out: PATCH the trustee,
 * then apply the territory diff as individual assignment calls. That means it is
 * NOT atomic — a failure part-way leaves earlier calls applied, so queries are
 * invalidated on error too and the form re-reads the real server state.
 */
export const useUpdateTrusteeWithTerritoryMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ["trustees"] });
    queryClient.invalidateQueries({ queryKey: ["trustee-dashboard", id] });
    queryClient.invalidateQueries({ queryKey: ["territory-assignments"] });
    queryClient.invalidateQueries({ queryKey: ["territory-coverage"] });
  };

  return useMutation({
    mutationFn: async ({
      id,
      payload,
      territory,
    }: {
      id: string;
      payload: UpdateTrusteePayload;
      territory: TerritoryDiff;
    }) => {
      if (!accessToken) throw new Error("No access token");
      const updated = await updateTrustee(id, payload, accessToken);

      // Removals run first: freeing a state before re-assigning it keeps a
      // swap (drop Punjab, take Gujarat) from tripping the backend's
      // "state already owned" rule mid-save.
      for (const assignmentId of territory.remove) {
        await deleteAssignment(assignmentId, accessToken);
      }
      for (const seat of territory.create) {
        await createAssignment(
          {
            trustee: id,
            state: seat.state,
            district: seat.district ?? undefined,
            is_active: true,
          },
          accessToken
        );
      }

      return updated;
    },
    onSuccess: (_data, variables) => {
      invalidate(variables.id);
      toast.success("Member updated");
    },
    onError: (error: Error, variables) => {
      invalidate(variables.id);
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

export const usePromoteTrusteeWithTerritoryMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PromoteTrusteeWithTerritoryPayload) => {
      if (!accessToken) throw new Error("No access token");
      return promoteTrusteeWithTerritory(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trustees"] });
      queryClient.invalidateQueries({ queryKey: ["territory-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["territory-coverage"] });
      toast.success("Member appointed");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
