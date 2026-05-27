import { z } from "zod";

export const generateUploadUrlSchema = z.object({
  files: z.array(
    z.object({
      upload_type: z.string(),
      file_name: z.string(),
      file_size_bytes: z.number(),
    })
  ),
  user_id: z.string().uuid(),
});

const legacyUploadUrlItemSchema = z.object({
  file_key: z.string(),
  upload_url: z.string(),
  file_name: z.string(),
});

const currentUploadUrlItemSchema = z.object({
  file_name: z.string(),
  url: z.string(),
  object_key: z.string(),
});

export const uploadUrlResponseSchema = z
  .union([
    z.object({
      data: z.object({
        upload_urls: z.array(legacyUploadUrlItemSchema),
      }),
    }),
    z.object({
      message: z.string().optional(),
      data: z.array(currentUploadUrlItemSchema),
    }),
  ])
  .transform((response) => {
    if (Array.isArray(response.data)) {
      return {
        upload_urls: response.data.map((item) => ({
          file_name: item.file_name,
          upload_url: item.url,
          object_key: item.object_key,
        })),
      };
    }

    return {
      upload_urls: response.data.upload_urls.map((item) => ({
        file_name: item.file_name,
        upload_url: item.upload_url,
        object_key: item.file_key,
      })),
    };
  });

export type GenerateUploadUrlPayload = z.infer<
  typeof generateUploadUrlSchema
>;
export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;
