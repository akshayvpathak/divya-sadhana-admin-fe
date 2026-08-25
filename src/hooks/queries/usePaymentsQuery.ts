import { useAuth } from "@/context/AuthContext";
import { getAllPaymentsList, getPayment } from "@/services/payments.service";
import { useQuery } from "@tanstack/react-query";
import { useInfiniteListQuery } from "./useInfiniteListQuery";

const PAYMENTS_PAGE_SIZE = 10;

export const usePaymentsListQuery = (
  page: number = 1,
  search: string = "",
  status?: string,
  source?: string,
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["payments", page, search, status, source],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getAllPaymentsList(accessToken, {
        page,
        page_size: PAYMENTS_PAGE_SIZE,
        search,
        status: status === "all" ? undefined : status,
        source: source === "all" || !source ? undefined : source,
      });
    },
    enabled: !!accessToken && enabled,
  });
};

/** Mobile card list: same endpoint and filters, appended page by page. */
export const usePaymentsInfiniteQuery = (
  search: string = "",
  status?: string,
  source?: string,
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

  return useInfiniteListQuery({
    queryKey: ["payments", "infinite", search, status, source],
    pageSize: PAYMENTS_PAGE_SIZE,
    enabled: !!accessToken && enabled,
    fetchPage: async (page) => {
      if (!accessToken) throw new Error("No access token");
      const response = await getAllPaymentsList(accessToken, {
        page,
        page_size: PAYMENTS_PAGE_SIZE,
        search,
        status: status === "all" ? undefined : status,
        source: source === "all" || !source ? undefined : source,
      });
      return response.data;
    },
  });
};

export const usePaymentQuery = (paymentId: string | null) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["payment", paymentId],
    queryFn: async () => {
      if (!accessToken || !paymentId) throw new Error("Missing required data");
      return getPayment(paymentId, accessToken);
    },
    enabled: !!accessToken && !!paymentId,
  });
};
