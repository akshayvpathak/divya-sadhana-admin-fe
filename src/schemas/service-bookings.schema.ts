import { z } from "zod";

const numberish = z.union([z.number(), z.string()]).transform((value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
});

export const serviceBookingStatusEnum = z.enum([
  "application_review",
  "pending",
  "paid",
  "scheduled",
  "completed",
  "cancelled",
]);

export const serviceBookingPaymentSchema = z
  .object({
    internal_payment_ref: z.string().optional(),
    provider: z.string().optional(),
    status: z.string().optional(),
    amount: z.union([z.number(), z.string()]).optional(),
    currency: z.string().optional(),
    provider_payment_id: z.string().nullable().optional(),
    created_at: z.string().optional(),
  })
  .passthrough();

export const serviceBookingSchema = z
  .object({
    id: z.string(),
    booking_number: z.string(),
    service: z.string().nullable().optional(),
    service_name: z.string().nullable().optional(),
    service_slug: z.string().nullable().optional(),
    service_category: z.string().nullable().optional(),
    selected_option_key: z.string().nullable().optional().default(""),
    amount: numberish,
    currency: z.string().optional().default("INR"),
    status: z.string(),
    answers: z.record(z.string(), z.unknown()).optional().default({}),
    input_image_key: z.string().nullable().optional(),
    input_image_url: z.string().nullable().optional(),
    booker_name: z.string().nullable().optional(),
    booker_email: z.string().nullable().optional(),
    contact_phone: z.string().nullable().optional(),
    scheduled_at: z.string().nullable().optional(),
    subscription_start: z.string().nullable().optional(),
    subscription_end: z.string().nullable().optional(),
    batch: z.string().nullable().optional(),
    admin_notes: z.string().nullable().optional(),
    paid_at: z.string().nullable().optional(),
    payments: z.array(serviceBookingPaymentSchema).optional().default([]),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const serviceBookingsListSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        count: z.number(),
        next: z.string().nullable(),
        previous: z.string().nullable(),
        results: z.array(serviceBookingSchema),
      })
      .passthrough(),
  })
  .passthrough();

export const updateServiceBookingSchema = z.object({
  status: serviceBookingStatusEnum.optional(),
  scheduled_at: z.string().nullable().optional(),
  batch_id: z.string().nullable().optional(),
  admin_notes: z.string().optional(),
  subscription_start: z.string().nullable().optional(),
  subscription_end: z.string().nullable().optional(),
});

export type ServiceBooking = z.infer<typeof serviceBookingSchema>;
export type ServiceBookingsList = z.infer<typeof serviceBookingsListSchema>;
export type UpdateServiceBookingPayload = z.infer<typeof updateServiceBookingSchema>;
export type ServiceBookingStatus = z.infer<typeof serviceBookingStatusEnum>;
