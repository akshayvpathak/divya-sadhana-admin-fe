import { useAuth } from "@/context/AuthContext";
import { getAiReading, getAiReadingsList } from "@/services/ai-readings.service";
import { useQuery } from "@tanstack/react-query";

export const useAiReadingsListQuery = (
  page: number = 1,
  search: string = "",
  status: string = "all",
  serviceKind: string = "all",
  sort: string = "-created_at"
) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["aiReadings", page, search, status, serviceKind, sort],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getAiReadingsList(accessToken, {
        page,
        paginate: 10,
        search,
        search_fields: "request_number,user__email",
        status,
        service__kind: serviceKind,
        sort,
      });
    },
    enabled: !!accessToken,
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
