import { useAuth } from "@/context/AuthContext";
import { UpdateServiceBookingPayload } from "@/schemas/service-bookings.schema";
import {
  getServiceBooking,
  getServiceBookingsList,
  updateServiceBooking,
} from "@/services/service-bookings.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useInfiniteListQuery } from "./useInfiniteListQuery";

const SERVICE_BOOKINGS_PAGE_SIZE = 10;

export interface ServiceBookingsListFilters {
  page?: number;
  status?: string;
  service__slug?: string;
  search?: string;
  ordering?: string;
}

const notifyError = (fallback: string) => (error: unknown) => {
  toast.error(error instanceof Error ? error.message : fallback);
};

export const useServiceBookingsListQuery = (
  filters: ServiceBookingsListFilters,
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;
  return useQuery({
    queryKey: ["service-bookings", filters],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getServiceBookingsList(accessToken, {
        page: filters.page ?? 1,
        paginate: SERVICE_BOOKINGS_PAGE_SIZE,
        status: filters.status,
        service__slug: filters.service__slug,
        search: filters.search ?? "",
        ordering: filters.ordering ?? "-created_at",
      });
    },
    enabled: !!accessToken && enabled,
  });
};

/** Mobile card list: same endpoint and filters, appended page by page. */
export const useServiceBookingsInfiniteQuery = (
  filters: ServiceBookingsListFilters,
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

  return useInfiniteListQuery({
    queryKey: ["service-bookings", "infinite", { ...filters, page: undefined }],
    pageSize: SERVICE_BOOKINGS_PAGE_SIZE,
    enabled: !!accessToken && enabled,
    fetchPage: async (page) => {
      if (!accessToken) throw new Error("No access token");
      const response = await getServiceBookingsList(accessToken, {
        page,
        paginate: SERVICE_BOOKINGS_PAGE_SIZE,
        status: filters.status,
        service__slug: filters.service__slug,
        search: filters.search ?? "",
        ordering: filters.ordering ?? "-created_at",
      });
      return response.data;
    },
  });
};

export const useServiceBookingQuery = (bookingId: string | null) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["service-booking", bookingId],
    queryFn: async () => {
      if (!accessToken || !bookingId) throw new Error("Missing required data");
      return getServiceBooking(bookingId, accessToken);
    },
    enabled: !!accessToken && !!bookingId,
  });
};

export const useUpdateServiceBookingMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      payload,
    }: {
      bookingId: string;
      payload: UpdateServiceBookingPayload;
    }) => {
      if (!accessToken) throw new Error("No access token");
      return updateServiceBooking(bookingId, payload, accessToken);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["service-booking", variables.bookingId] });
    },
    onError: notifyError("Failed to update booking. Please try again."),
  });
};
