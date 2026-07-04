import { useAuth } from "@/context/AuthContext";
import { GenerateUploadUrlPayload } from "@/schemas/image-upload.schema";
import {
  generateUploadUrl,
  uploadFileToPresignedUrl,
} from "@/services/image-upload.service";
import { useMutation } from "@tanstack/react-query";

/**
 * @param uploadType Categorizes the asset server-side (free-form string, maxLength 100
 * per the spec's UploadFileItem). Pass a context-appropriate value, e.g.
 * "product_gallery" for product images or "campaign_cover" for donation-campaign covers,
 * instead of mislabeling everything as "product_gallery".
 */
export const useUploadImageMutation = (uploadType: string = "product_gallery") => {
  const { accessToken, user } = useAuth();

  return useMutation({
    mutationFn: async (files: File[]) => {
      if (!accessToken || !user?.id) {
        throw new Error("Missing auth information");
      }

      const uploadPayload: GenerateUploadUrlPayload = {
        files: files.map((file) => ({
          upload_type: uploadType,
          file_name: file.name,
          file_size_bytes: file.size,
        })),
        user_id: user.id,
      };

      const urlResponse = await generateUploadUrl(uploadPayload, accessToken);
      const uploadUrls = urlResponse.upload_urls;

      if (uploadUrls.length !== files.length) {
        throw new Error("Upload URL count does not match selected files");
      }

      const uploadPromises = files.map((file, index) => {
        const uploadUrl = uploadUrls[index];
        return uploadFileToPresignedUrl(file, uploadUrl.upload_url).then(
          () => uploadUrl.object_key
        );
      });

      const uploadedKeys = await Promise.all(uploadPromises);
      return uploadedKeys;
    },
  });
};
