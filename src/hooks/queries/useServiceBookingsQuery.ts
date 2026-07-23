import { useAuth } from "@/context/AuthContext";
import { UpdateServiceBookingPayload } from "@/schemas/service-bookings.schema";
import {
  getServiceBooking,
  getServiceBookingsList,
  updateServiceBooking,
} from "@/services/service-bookings.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const notifyError = (fallback: string) => (error: unknown) => {
  toast.error(error instanceof Error ? error.message : fallback);
};

export const useServiceBookingsListQuery = (filters: {
  page?: number;
  status?: string;
  service__slug?: string;
  search?: string;
  ordering?: string;
}) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["service-bookings", filters],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getServiceBookingsList(accessToken, {
        page: filters.page ?? 1,
        paginate: 10,
        status: filters.status,
        service__slug: filters.service__slug,
        search: filters.search ?? "",
        ordering: filters.ordering ?? "-created_at",
      });
    },
    enabled: !!accessToken,
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
