import { useAuth } from "@/context/AuthContext";
import { getAiReading, getAiReadingsList } from "@/services/ai-readings.service";
import { useQuery } from "@tanstack/react-query";
import { useInfiniteListQuery } from "./useInfiniteListQuery";

const AI_READINGS_PAGE_SIZE = 10;

export const useAiReadingsListQuery = (
  page: number = 1,
  search: string = "",
  status: string = "all",
  serviceKind: string = "all",
  sort: string = "-created_at",
  failureCode: string = "all",
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["aiReadings", page, search, status, serviceKind, sort, failureCode],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getAiReadingsList(accessToken, {
        page,
        paginate: AI_READINGS_PAGE_SIZE,
        search,
        search_fields: "request_number,user__email",
        status,
        service__kind: serviceKind,
        failure_code: failureCode,
        sort,
      });
    },
    enabled: !!accessToken && enabled,
  });
};

/** Mobile card list: same endpoint and filters, appended page by page. */
export const useAiReadingsInfiniteQuery = (
  search: string = "",
  status: string = "all",
  serviceKind: string = "all",
  sort: string = "-created_at",
  failureCode: string = "all",
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

  return useInfiniteListQuery({
    queryKey: ["aiReadings", "infinite", search, status, serviceKind, sort, failureCode],
    pageSize: AI_READINGS_PAGE_SIZE,
    enabled: !!accessToken && enabled,
    fetchPage: async (page) => {
      if (!accessToken) throw new Error("No access token");
      const response = await getAiReadingsList(accessToken, {
        page,
        paginate: AI_READINGS_PAGE_SIZE,
        search,
        search_fields: "request_number,user__email",
        status,
        service__kind: serviceKind,
        failure_code: failureCode,
        sort,
      });
      return response.data;
    },
  });
};

export const useAiReadingQuery = (readingId: string | null) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["aiReading", readingId],
    queryFn: async () => {
      if (!accessToken || !readingId) throw new Error("Missing required data");
      return getAiReading(readingId, accessToken);
    },
    enabled: !!accessToken && !!readingId,
  });
};
