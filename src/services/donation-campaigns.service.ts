import {
  CreateDonationCampaignPayload,
  DonationCampaign,
  DonationCampaignsList,
  UpdateDonationCampaignPayload,
  donationCampaignSchema,
  donationCampaignsListSchema,
} from "@/schemas/donation-campaigns.schema";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

interface FetchOptions {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  is_active?: string;
  target_amount_min?: string;
  target_amount_max?: string;
  ends_at?: string;
  sort?: string;
}

function getCsrfToken(): string {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1] || ""
  );
}

export const getDonationCampaignsList = async (
  accessToken: string,
  options: FetchOptions = {}
): Promise<DonationCampaignsList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.page_size) params.append("page_size", String(options.page_size));
  if (options.search) params.append("search", options.search);
  if (options.status) params.append("status", options.status);
  if (options.is_active) params.append("is_active", options.is_active);
  if (options.target_amount_min) params.append("target_amount_min", options.target_amount_min);
  if (options.target_amount_max) params.append("target_amount_max", options.target_amount_max);
  if (options.ends_at) params.append("ends_at", options.ends_at);
  if (options.sort) params.append("sort", options.sort);

  const response = await fetch(`${API_BASE_URL}/donation-campaigns/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch donation campaigns");
  }

  const json = await response.json();
  return donationCampaignsListSchema.parse(json);
};

export const getDonationCampaign = async (
  id: string,
  accessToken: string
): Promise<DonationCampaign> => {
  const response = await fetch(`${API_BASE_URL}/donation-campaigns/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch donation campaign");
  }

  const json = await response.json();
  return donationCampaignSchema.parse(json.data || json);
};

export const createDonationCampaign = async (
  payload: CreateDonationCampaignPayload,
  accessToken: string
): Promise<DonationCampaign> => {
  const response = await fetch(`${API_BASE_URL}/donation-campaigns/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to create donation campaign");
  }

  const json = await response.json();
  return donationCampaignSchema.parse(json.data || json);
};

export const updateDonationCampaign = async (
  id: string,
  payload: UpdateDonationCampaignPayload,
  accessToken: string
): Promise<DonationCampaign> => {
  const response = await fetch(`${API_BASE_URL}/donation-campaigns/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to update donation campaign");
  }

  const json = await response.json();
  return donationCampaignSchema.parse(json.data || json);
};

export const deleteDonationCampaign = async (id: string, accessToken: string) => {
  const response = await fetch(`${API_BASE_URL}/donation-campaigns/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to delete donation campaign");
  }
};