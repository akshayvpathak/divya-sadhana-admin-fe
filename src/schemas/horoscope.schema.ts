import { z } from "zod";

export const ZODIAC_SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

export const HOROSCOPE_PERIODS = ["daily", "weekly", "monthly"] as const;

export const zodiacSignSchema = z.enum(ZODIAC_SIGNS);
export const horoscopePeriodSchema = z.enum(HOROSCOPE_PERIODS);

export type ZodiacSign = z.infer<typeof zodiacSignSchema>;
export type HoroscopePeriod = z.infer<typeof horoscopePeriodSchema>;

export const horoscopeFaqItemSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

export const horoscopeEntrySchema = z.object({
  id: z.string(),
  zodiac_sign: zodiacSignSchema,
  period: horoscopePeriodSchema,
  period_key: z.string(),
  slug: z.string(),
  rashi_hi: z.string().nullable().optional(),
  rashi_slug_hi: z.string().nullable().optional(),
  summary: z.string().nullable().optional().default(""),
  payload: z.record(z.string(), z.unknown()).nullable().optional(),
  html: z.string().nullable().optional(),
  faq: z.array(horoscopeFaqItemSchema).nullable().optional().default([]),
  meta_title: z.string().nullable().optional().default(""),
  meta_description: z.string().nullable().optional().default(""),
  meta_keywords: z.string().nullable().optional().default(""),
  og_image_key: z.string().nullable().optional().default(""),
  og_image_url: z.string().nullable().optional(),
  is_indexable: z.boolean().nullable().optional().default(true),
  stale: z.boolean().nullable().optional().default(false),
  generated_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const horoscopeSeoPatchSchema = z.object({
  meta_title: z
    .string()
    .max(70, "Meta title must be 70 characters or less")
    .optional()
    .or(z.literal("")),
  meta_description: z
    .string()
    .max(160, "Meta description must be 160 characters or less")
    .optional()
    .or(z.literal("")),
  meta_keywords: z
    .string()
    .max(255, "Meta keywords must be 255 characters or less")
    .optional()
    .or(z.literal("")),
  og_image_key: z.string().optional().or(z.literal("")),
  is_indexable: z.boolean().optional(),
  faq: z.array(horoscopeFaqItemSchema).optional(),
});

export const horoscopeSeoFormFaqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const horoscopeSeoFormSchema = z.object({
  meta_title: z
    .string()
    .max(70, "Meta title must be 70 characters or less")
    .optional()
    .or(z.literal("")),
  meta_description: z
    .string()
    .max(160, "Meta description must be 160 characters or less")
    .optional()
    .or(z.literal("")),
  meta_keywords: z
    .string()
    .max(255, "Meta keywords must be 255 characters or less")
    .optional()
    .or(z.literal("")),
  og_image_key: z.string().optional().or(z.literal("")),
  is_indexable: z.boolean().default(true),
  faq: z.array(horoscopeSeoFormFaqItemSchema).default([]),
});

export type HoroscopeFaqItem = z.infer<typeof horoscopeFaqItemSchema>;
export type HoroscopeEntry = z.infer<typeof horoscopeEntrySchema>;
export type HoroscopeSeoPatchPayload = z.infer<typeof horoscopeSeoPatchSchema>;
export type HoroscopeSeoFormData = z.infer<typeof horoscopeSeoFormSchema>;

export const SIGN_LABELS: Record<ZodiacSign, string> = {
  aries: "Aries",
  taurus: "Taurus",
  gemini: "Gemini",
  cancer: "Cancer",
  leo: "Leo",
  virgo: "Virgo",
  libra: "Libra",
  scorpio: "Scorpio",
  sagittarius: "Sagittarius",
  capricorn: "Capricorn",
  aquarius: "Aquarius",
  pisces: "Pisces",
};

export const PERIOD_LABELS: Record<HoroscopePeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function isZodiacSign(value: string): value is ZodiacSign {
  return (ZODIAC_SIGNS as readonly string[]).includes(value);
}

export function isHoroscopePeriod(value: string): value is HoroscopePeriod {
  return (HOROSCOPE_PERIODS as readonly string[]).includes(value);
}
