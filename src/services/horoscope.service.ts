import {
  HoroscopeEntry,
  HoroscopePeriod,
  HoroscopeSeoPatchPayload,
  ZodiacSign,
  horoscopeEntrySchema,
} from "@/schemas/horoscope.schema";
import { apiErrorFrom } from "@/services/auth.service";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

function getCsrfToken(): string {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1] || ""
  );
}

export const fetchHoroscope = async (
  sign: ZodiacSign,
  period: HoroscopePeriod
): Promise<HoroscopeEntry> => {
  const response = await fetch(`${API_BASE_URL}/horoscope/${sign}/${period}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch horoscope");
  }

  const json = await response.json();
  return horoscopeEntrySchema.parse(json.data || json);
};

export const patchHoroscopeSeo = async (
  id: string,
  payload: HoroscopeSeoPatchPayload,
  accessToken: string
): Promise<HoroscopeEntry> => {
  const response = await fetch(
    `${API_BASE_URL}/horoscope/admin/entries/${id}/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-CSRFTOKEN": getCsrfToken(),
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const json = await response.json();
    throw apiErrorFrom(json, "Failed to update horoscope SEO", response.status);
  }

  const json = await response.json();
  return horoscopeEntrySchema.parse(json.data || json);
};
