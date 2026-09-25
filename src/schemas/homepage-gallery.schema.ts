import { z } from "zod";

export const homepageGalleryLinkTypeSchema = z.enum(["none", "youtube", "event"]);

export const homepageGalleryItemSchema = z.object({
  id: z.string().uuid(),
  image_url: z.string().nullable().optional(),
  title: z.string().default(""),
  caption: z.string().default(""),
  link_url: z.string().default(""),
  link_type: homepageGalleryLinkTypeSchema.default("none"),
  display_order: z.number().int().nonnegative().default(0),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

export const homepageGalleryListSchema = z.object({
  data: z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(homepageGalleryItemSchema),
  }).passthrough(),
  message: z.string().optional(),
}).passthrough();

export const homepageGalleryFormSchema = z.object({
  image_key: z.string().optional().default(""),
  title: z.string().max(200, "Title must be 200 characters or fewer").default(""),
  caption: z.string().default(""),
  link_url: z.string().default(""),
  link_type: homepageGalleryLinkTypeSchema.default("none"),
  display_order: z.coerce.number().int().min(0, "Display order cannot be negative").default(0),
  is_active: z.boolean().default(true),
}).superRefine((value, ctx) => {
  if (value.link_type !== "none" && !value.link_url.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["link_url"],
      message: "Link URL is required for linked gallery items",
    });
  }

  if (value.link_url.trim()) {
    try {
      new URL(value.link_url);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["link_url"],
        message: "Enter a valid absolute URL",
      });
    }
  }
});

export type HomepageGalleryItem = z.infer<typeof homepageGalleryItemSchema>;
export type HomepageGalleryFormValues = z.infer<typeof homepageGalleryFormSchema>;
export type HomepageGalleryLinkType = z.infer<typeof homepageGalleryLinkTypeSchema>;
