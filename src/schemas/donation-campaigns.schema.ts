import { z } from "zod";

const statusSchema = z.enum(["draft", "active", "paused", "closed"]);

const moneyNumberSchema = z.union([z.number(), z.string()]).transform((value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
});

export const createDonationCampaignSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  target_amount: moneyNumberSchema,
  status: statusSchema,
  is_active: z.boolean().default(true),
  starts_at: z.string().min(1, "Start date is required"),
  ends_at: z.string().min(1, "End date is required"),
  cover_image_key: z.string().optional().default(""),
});

export const updateDonationCampaignSchema = createDonationCampaignSchema.partial();

export const donationCampaignSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    target_amount: z.union([z.number(), z.string()]).transform((value) => {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }),
    raised_amount: z.union([z.number(), z.string()]).transform((value) => {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }),
    progress_percent: z.union([z.number(), z.string()]).transform((value) => {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }),
    currency: z.string(),
    status: statusSchema,
    is_active: z.boolean(),
    starts_at: z.string(),
    ends_at: z.string(),
    cover_image_key: z.string().nullable().optional().default(""),
    cover_image_url: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .passthrough();

export const donationCampaignsListSchema = z
  .object({
    message: z.string().optional(),
    data: z.object({
      count: z.number(),
      next: z.string().nullable(),
      previous: z.string().nullable(),
      results: z.array(donationCampaignSchema),
    }).passthrough(),
  })
  .passthrough();

export type CreateDonationCampaignPayload = z.infer<typeof createDonationCampaignSchema>;
export type UpdateDonationCampaignPayload = z.infer<typeof updateDonationCampaignSchema>;
export type DonationCampaign = z.infer<typeof donationCampaignSchema>;
export type DonationCampaignsList = z.infer<typeof donationCampaignsListSchema>;