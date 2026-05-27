import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  full_name: z.string(),
  phone_number: z.string().nullable().optional(),
  is_active: z.boolean(),
}).passthrough();

export const paymentSchema = z.object({
  id: z.string().uuid(),
  is_deleted: z.boolean().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  provider: z.string().optional(),
  internal_payment_ref: z.string().optional(),
  provider_order_id: z.string().nullable().optional(),
  provider_payment_id: z.string().nullable().optional(),
  provider_signature: z.string().nullable().optional(),
  currency: z.string().optional(),
  amount: z.string().optional(),
  status: z.string().optional(),
  idempotency_key: z.string().optional(),
  failure_code: z.string().nullable().optional(),
  failure_reason: z.string().nullable().optional(),
  raw_payload_json: z.unknown().optional(),
  captured_at: z.string().nullable().optional(),
  user: z.union([z.string(), userSchema]).nullable().optional(),
  order: z.string().nullable().optional(),
}).passthrough();

export const paymentsListSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(paymentSchema),
  }).passthrough(),
}).passthrough();

export type Payment = z.infer<typeof paymentSchema>;
export type PaymentsList = z.infer<typeof paymentsListSchema>;
