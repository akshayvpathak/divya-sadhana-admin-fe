import {
  GenerateUploadUrlPayload,
  uploadUrlResponseSchema,
} from "@/schemas/image-upload.schema";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

export const generateUploadUrl = async (
  payload: GenerateUploadUrlPayload,
  accessToken: string
) => {
  const csrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="))
    ?.split("=")[1] || "";

  const response = await fetch(`${API_BASE_URL}/generate-upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": csrfToken,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to generate upload URL");
  }

  const json = await response.json();
  return uploadUrlResponseSchema.parse(json);
};

export const uploadFileToPresignedUrl = async (
  file: File,
  presignedUrl: string
) => {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  return response;
};
