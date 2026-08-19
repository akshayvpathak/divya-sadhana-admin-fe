import { useAuth } from "@/context/AuthContext";
import { getOrder, getOrdersList, updateOrderShipping, getOrderTracking, getShippingInfo, exportOrdersCsv } from "@/services/orders.service";
import { UpdateOrderShippingPayload } from "@/schemas/orders.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useInfiniteListQuery } from "./useInfiniteListQuery";

const ORDERS_PAGE_SIZE = 10;
const ORDER_SEARCH_FIELDS = "order_number,user,items__product_name_snapshot";

export interface OrdersListFilters {
  payment_status?: string;
  status?: string;
  shipping_status?: string;
}

export const useOrdersListQuery = (
  page: number = 1,
  search: string = "",
  sort: string = "",
  filters?: OrdersListFilters,
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

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
        page_size: ORDERS_PAGE_SIZE,
        search,
        search_fields: ORDER_SEARCH_FIELDS,
        sort,
        payment_status: filters?.payment_status,
        status: filters?.status,
        shipping_status: filters?.shipping_status,
      });
    },
    enabled: !!accessToken && enabled,
  });
};

/** Mobile card list: same endpoint, same filters, appended page by page. */
export const useOrdersInfiniteQuery = (
  search: string = "",
  sort: string = "",
  filters?: OrdersListFilters,
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

  return useInfiniteListQuery({
    queryKey: ["orders", "infinite", search, sort, filters],
    pageSize: ORDERS_PAGE_SIZE,
    enabled: !!accessToken && enabled,
    fetchPage: async (page) => {
      if (!accessToken) throw new Error("No access token");
      const response = await getOrdersList(accessToken, {
        page,
        page_size: ORDERS_PAGE_SIZE,
        search,
        search_fields: ORDER_SEARCH_FIELDS,
        sort,
        payment_status: filters?.payment_status,
        status: filters?.status,
        shipping_status: filters?.shipping_status,
      });
      return response.data;
    },
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


export const useUpdateOrderShippingMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: UpdateOrderShippingPayload;
    }) => {
      if (!accessToken) throw new Error("No access token");
      return updateOrderShipping(orderId, payload, accessToken);
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", order.id] });
      queryClient.invalidateQueries({ queryKey: ["order-tracking", order.id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update shipping");
    },
  });
};


export const useOrderTrackingQuery = (orderId: string | null) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["order-tracking", orderId],
    queryFn: async () => {
      if (!accessToken || !orderId) throw new Error("Missing required data");
      return getOrderTracking(orderId, accessToken);
    },
    enabled: !!accessToken && !!orderId,
  });
};

export const useShippingInfoQuery = () => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["shipping-info"],
    queryFn: async () => getShippingInfo(accessToken || undefined),
    staleTime: 60 * 60 * 1000,
  });
};

export const useExportOrdersCsvMutation = () => {
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("No access token");
      const blob = await exportOrdersCsv(accessToken);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success("Orders CSV downloaded"),
    onError: (err: Error) => toast.error(err.message || "Export failed"),
  });
};
