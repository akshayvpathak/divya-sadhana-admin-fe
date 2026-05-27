import {
  Donation,
  DonationReceiptPdfResponse,
  DonationReceiptResponse,
  DonationsList,
  donationSchema,
  receiptPdfResponseSchema,
  receiptResponseSchema,
  donationsListSchema,
} from "@/schemas/donations.schema";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

interface FetchOptions {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  campaign?: string;
  state?: string;
  district?: string;
  amount_min?: string;
  amount_max?: string;
  paid_at_from?: string;
  paid_at_to?: string;
  sort?: string;
}

function buildParams(options: FetchOptions = {}) {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.page_size) params.append("page_size", String(options.page_size));
  if (options.search) params.append("search", options.search);
  if (options.status) params.append("status", options.status);
  if (options.campaign) params.append("campaign", options.campaign);
  if (options.state) params.append("state", options.state);
  if (options.district) params.append("district", options.district);
  if (options.amount_min) params.append("amount_min", options.amount_min);
  if (options.amount_max) params.append("amount_max", options.amount_max);
  if (options.paid_at_from) params.append("paid_at_from", options.paid_at_from);
  if (options.paid_at_to) params.append("paid_at_to", options.paid_at_to);
  if (options.sort) params.append("sort", options.sort);
  return params;
}

export const getDonationsList = async (
  accessToken: string,
  options: FetchOptions = {}
): Promise<DonationsList> => {
  const response = await fetch(`${API_BASE_URL}/donations/?${buildParams(options).toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch donations");
  }

  const json = await response.json();
  return donationsListSchema.parse(json);
};

export const getDonation = async (
  id: string,
  accessToken: string
): Promise<Donation> => {
  const response = await fetch(`${API_BASE_URL}/donations/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch donation");
  }

  const json = await response.json();
  return donationSchema.parse(json.data || json);
};

export const getDonationReceipt = async (
  id: string,
  accessToken: string
): Promise<DonationReceiptResponse> => {
  const response = await fetch(`${API_BASE_URL}/donations/${id}/receipt/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.message || "Receipt is only available for paid donations.");
  }

  return receiptResponseSchema.parse(json);
};

export const getDonationReceiptPdf = async (
  id: string,
  accessToken: string
): Promise<DonationReceiptPdfResponse> => {
  const response = await fetch(`${API_BASE_URL}/donations/${id}/receipt/pdf/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.message || "Receipt is only available for paid donations.");
  }

  return receiptPdfResponseSchema.parse(json);
};