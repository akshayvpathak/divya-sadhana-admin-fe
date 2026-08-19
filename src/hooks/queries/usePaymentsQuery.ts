import { useAuth } from "@/context/AuthContext";
import { getPayment, getPaymentsList } from "@/services/payments.service";
import { useQuery } from "@tanstack/react-query";
import { useInfiniteListQuery } from "./useInfiniteListQuery";

const PAYMENTS_PAGE_SIZE = 10;
const PAYMENT_SEARCH_FIELDS =
  "internal_payment_ref,provider_order_id,provider_payment_id,idempotency_key,provider,status,user,order";

export const usePaymentsListQuery = (
  page: number = 1,
  search: string = "",
  sort: string = "-created_at",
  status?: string,
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["payments", page, search, sort, status],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getPaymentsList(accessToken, {
        page,
        page_size: PAYMENTS_PAGE_SIZE,
        search,
        search_fields: PAYMENT_SEARCH_FIELDS,
        sort,
        status: status === "all" ? undefined : status,
      });
    },
    enabled: !!accessToken && enabled,
  });
};

/** Mobile card list: same endpoint and filters, appended page by page. */
export const usePaymentsInfiniteQuery = (
  search: string = "",
  sort: string = "-created_at",
  status?: string,
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

  return useInfiniteListQuery({
    queryKey: ["payments", "infinite", search, sort, status],
    pageSize: PAYMENTS_PAGE_SIZE,
    enabled: !!accessToken && enabled,
    fetchPage: async (page) => {
      if (!accessToken) throw new Error("No access token");
      const response = await getPaymentsList(accessToken, {
        page,
        page_size: PAYMENTS_PAGE_SIZE,
        search,
        search_fields: PAYMENT_SEARCH_FIELDS,
        sort,
        status: status === "all" ? undefined : status,
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
