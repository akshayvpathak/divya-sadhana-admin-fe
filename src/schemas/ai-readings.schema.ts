import { z } from "zod";

export const aiReadingUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  full_name: z.string(),
  phone_number: z.string().nullable().optional(),
  is_active: z.boolean(),
}).passthrough();

export const aiReadingProviderSnapshotSchema = z.object({
  provider_key: z.string().nullable().optional(),
  model_id: z.string().nullable().optional(),
  prompt_template_key: z.string().nullable().optional(),
}).passthrough().nullable().optional();

export const aiReadingUnlockSchema = z.object({
  id: z.string(),
  internal_payment_ref: z.string(),
  user: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  provider_order_id: z.string().nullable().optional(),
  provider_payment_id: z.string().nullable().optional(),
  amount: z.string(),
  wallet_paid_amount: z.string().nullable().optional(),
  currency: z.string(),
  status: z.string(),
  failure_code: z.string().nullable().optional(),
  failure_reason: z.string().nullable().optional(),
  captured_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

export const aiReadingReportSchema = z.object({
  id: z.string(),
  summary: z.string().nullable().optional(),
  teaser_payload: z.record(z.string(), z.any()).nullable().optional(),
  html_teaser: z.string().nullable().optional(),
  full_payload: z.record(z.string(), z.any()).nullable().optional(),
  html_full: z.string().nullable().optional(),
  pdf_object_key: z.string().nullable().optional(),
  pdf_download_url: z.string().nullable().optional(),
  is_unlocked: z.boolean(),
  unlocked_at: z.string().nullable().optional(),
  provider_request_id: z.string().nullable().optional(),
  tokens_input: z.number().nullable().optional(),
  tokens_output: z.number().nullable().optional(),
  unlocks: z.array(aiReadingUnlockSchema).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

export const aiReadingSchema = z.object({
  id: z.string(),
  request_number: z.string(),
  service: z.string().nullable().optional(),
  service_name: z.string(),
  service_slug: z.string(),
  service_kind: z.string(),
  report_unlock_price: z.string(),
  currency: z.string(),
  user: aiReadingUserSchema,
  status: z.enum(["pending", "processing", "succeeded", "failed", "cancelled"]),
  input_image_key: z.string().nullable().optional(),
  input_answers: z.record(z.string(), z.any()).nullable().optional(),
  failure_code: z.string().nullable().optional(),
  failure_reason: z.string().nullable().optional(),
  is_cache_hit: z.boolean(),
  cached_from: z.string().nullable().optional(),
  provider_snapshot: aiReadingProviderSnapshotSchema,
  processing_started_at: z.string().nullable().optional(),
  processing_completed_at: z.string().nullable().optional(),
  report: aiReadingReportSchema.nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

export const aiReadingsListSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(aiReadingSchema),
  }).passthrough(),
}).passthrough();

export type AiReadingUser = z.infer<typeof aiReadingUserSchema>;
export type AiReadingProviderSnapshot = z.infer<typeof aiReadingProviderSnapshotSchema>;
export type AiReadingUnlock = z.infer<typeof aiReadingUnlockSchema>;
export type AiReadingReport = z.infer<typeof aiReadingReportSchema>;
export type AiReading = z.infer<typeof aiReadingSchema>;
export type AiReadingsList = z.infer<typeof aiReadingsListSchema>;
