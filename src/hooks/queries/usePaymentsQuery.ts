import { useAuth } from "@/context/AuthContext";
import { getPayment, getPaymentsList } from "@/services/payments.service";
import { useQuery } from "@tanstack/react-query";

export const usePaymentsListQuery = (
  page: number = 1,
  search: string = "",
  sort: string = "-created_at",
  status?: string
) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["payments", page, search, sort, status],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getPaymentsList(accessToken, {
        page,
        page_size: 10,
        search,
        search_fields:
          "internal_payment_ref,provider_order_id,provider_payment_id,idempotency_key,provider,status,user,order",
        sort,
        status: status === 'all' ? undefined : status,
      });
    },
    enabled: !!accessToken,
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
