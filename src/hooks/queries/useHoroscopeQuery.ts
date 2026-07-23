import { useAuth } from "@/context/AuthContext";
import {
  HOROSCOPE_PERIODS,
  HoroscopePeriod,
  HoroscopeSeoPatchPayload,
  ZODIAC_SIGNS,
  ZodiacSign,
} from "@/schemas/horoscope.schema";
import {
  fetchHoroscope,
  patchHoroscopeSeo,
} from "@/services/horoscope.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const horoscopeQueryKey = (sign: ZodiacSign, period: HoroscopePeriod) =>
  ["horoscope", sign, period] as const;

export const useHoroscopeQuery = (
  sign: ZodiacSign | null,
  period: HoroscopePeriod | null
) => {
  return useQuery({
    queryKey: horoscopeQueryKey(sign!, period!),
    queryFn: async () => {
      if (!sign || !period) throw new Error("Missing sign or period");
      return fetchHoroscope(sign, period);
    },
    enabled: !!sign && !!period,
  });
};

export const useHoroscopeGridQuery = () => {
  return useQuery({
    queryKey: ["horoscope-grid"],
    queryFn: async () => {
      const combos = ZODIAC_SIGNS.flatMap((sign) =>
        HOROSCOPE_PERIODS.map((period) => ({ sign, period }))
      );

      const results = await Promise.allSettled(
        combos.map(({ sign, period }) => fetchHoroscope(sign, period))
      );

      return combos.map((combo, index) => {
        const result = results[index];
        return {
          ...combo,
          entry: result.status === "fulfilled" ? result.value : null,
          error:
            result.status === "rejected"
              ? result.reason instanceof Error
                ? result.reason.message
                : "Failed to load"
              : null,
        };
      });
    },
    staleTime: 60_000,
  });
};

export const usePatchHoroscopeSeoMutation = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      sign,
      period,
      payload,
    }: {
      id: string;
      sign: ZodiacSign;
      period: HoroscopePeriod;
      payload: HoroscopeSeoPatchPayload;
    }) => {
      if (!accessToken) throw new Error("No access token");
      return patchHoroscopeSeo(id, payload, accessToken);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: horoscopeQueryKey(variables.sign, variables.period),
      });
      queryClient.invalidateQueries({ queryKey: ["horoscope-grid"] });
      queryClient.setQueryData(
        horoscopeQueryKey(variables.sign, variables.period),
        data
      );
      toast.success("Horoscope SEO updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update horoscope SEO");
    },
  });
};
