import { useAuth } from "@/context/AuthContext";
import { getOrder, getOrdersList } from "@/services/orders.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useOrdersListQuery = (
  page: number = 1,
  search: string = "",
  sort: string = "",
  filters?: {
    payment_status?: string;
    status?: string;
    shipping_status?: string;
  }
) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["orders", page, search, sort, filters],
    queryFn: async () => {
      if (process.env.NEXT_PUBLIC_DEBUG_API === "true") {
        // eslint-disable-next-line no-console
        console.log("[API DEBUG] useOrdersListQuery", {
          queryKey: ["orders", page, search, sort, filters],
          hasAccessToken: !!accessToken,
        });
      }

      if (!accessToken) throw new Error("No access token");
      return getOrdersList(accessToken, {
        page,
        page_size: 10,
        search,
        search_fields: "order_number,user,items__product_name_snapshot",
        sort,
        payment_status: filters?.payment_status,
        status: filters?.status,
        shipping_status: filters?.shipping_status,
      });
    },
    enabled: !!accessToken,
  });
};

export const useOrderQuery = (orderId: string | null) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (process.env.NEXT_PUBLIC_DEBUG_API === "true") {
        // eslint-disable-next-line no-console
        console.log("[API DEBUG] useOrderQuery", { orderId, hasAccessToken: !!accessToken });
      }

      if (!accessToken || !orderId) throw new Error("Missing required data");
      return getOrder(orderId, accessToken);
    },
    enabled: !!accessToken && !!orderId,
  });
};
