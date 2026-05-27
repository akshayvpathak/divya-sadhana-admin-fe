import { z } from "zod";

const moneyNumberSchema = z.union([z.number(), z.string()]).transform((value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
});

export const donationPaymentSchema = z
  .object({
    id: z.string().uuid().optional(),
    provider: z.string().optional(),
    internal_payment_ref: z.string().optional(),
    provider_order_id: z.string().nullable().optional(),
    provider_payment_id: z.string().nullable().optional(),
    provider_signature: z.string().nullable().optional(),
    currency: z.string().optional(),
    amount: z.union([z.number(), z.string()]).optional(),
    status: z.string().optional(),
    idempotency_key: z.string().optional(),
    captured_at: z.string().nullable().optional(),
    failure_code: z.string().nullable().optional(),
    failure_reason: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const donationSchema = z
  .object({
    id: z.string().uuid(),
    donation_number: z.string().optional(),
    donor_name: z.string().nullable().optional(),
    donor_email: z.string().nullable().optional(),
    donor_phone: z.string().nullable().optional(),
    amount: moneyNumberSchema,
    currency: z.string().optional().default("INR"),
    status: z.string().optional(),
    campaign: z.union([z.string(), z.object({ id: z.string().uuid().optional(), title: z.string().optional() }).passthrough()]).nullable().optional(),
    campaign_title: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    district: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
    is_anonymous: z.boolean().optional(),
    receipt_number: z.string().nullable().optional(),
    paid_at: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    payments: z.array(donationPaymentSchema).optional().default([]),
  })
  .passthrough();

export const donationsListSchema = z
  .object({
    message: z.string().optional(),
    data: z.object({
      count: z.number(),
      next: z.string().nullable(),
      previous: z.string().nullable(),
      results: z.array(donationSchema),
    }).passthrough(),
  })
  .passthrough();

export const receiptResponseSchema = z
  .object({
    message: z.string().optional(),
    data: z.union([
      z.object({ html: z.string() }).passthrough(),
      z.object({ receipt_html: z.string().optional(), html: z.string().optional() }).passthrough(),
      z.string(),
    ]),
  })
  .passthrough();

export const receiptPdfResponseSchema = z
  .object({
    message: z.string().optional(),
    data: z.object({ download_url: z.string().url() }).passthrough(),
  })
  .passthrough();

export type Donation = z.infer<typeof donationSchema>;
export type DonationsList = z.infer<typeof donationsListSchema>;
export type DonationReceiptResponse = z.infer<typeof receiptResponseSchema>;
export type DonationReceiptPdfResponse = z.infer<typeof receiptPdfResponseSchema>;