import { z } from "zod";

const nullableCapacity = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === "" || value == null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  });

export const createServiceBatchSchema = z.object({
  service: z.string().min(1, "Service is required"),
  title: z.string().min(1, "Title is required"),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  capacity: nullableCapacity,
  meet_link: z.string().optional().default(""),
  is_open: z.boolean().default(true),
});

export const updateServiceBatchSchema = createServiceBatchSchema.partial();

export const serviceBatchSchema = z
  .object({
    id: z.string(),
    service: z.string().nullable().optional(),
    service_name: z.string().nullable().optional(),
    title: z.string(),
    starts_at: z.string().nullable().optional(),
    ends_at: z.string().nullable().optional(),
    capacity: z.number().nullable().optional(),
    meet_link: z.string().nullable().optional(),
    is_open: z.boolean(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const serviceBatchesListSchema = z
  .object({
    message: z.string().optional(),
    data: z
      .object({
        count: z.number(),
        next: z.string().nullable(),
        previous: z.string().nullable(),
        results: z.array(serviceBatchSchema),
      })
      .passthrough(),
  })
  .passthrough();

export type CreateServiceBatchPayload = z.infer<typeof createServiceBatchSchema>;
export type UpdateServiceBatchPayload = z.infer<typeof updateServiceBatchSchema>;
export type ServiceBatch = z.infer<typeof serviceBatchSchema>;
export type ServiceBatchesList = z.infer<typeof serviceBatchesListSchema>;
