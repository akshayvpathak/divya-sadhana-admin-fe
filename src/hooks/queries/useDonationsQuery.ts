import { useAuth } from "@/context/AuthContext";
import { getDonation, getDonationReceipt, getDonationReceiptPdf, getDonationsList } from "@/services/donations.service";
import { useQuery } from "@tanstack/react-query";
import { useInfiniteListQuery } from "./useInfiniteListQuery";

const DONATIONS_PAGE_SIZE = 10;

export interface DonationsListFilters {
  page?: number;
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

export const useDonationsListQuery = (
  filters: DonationsListFilters,
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["donations", filters],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getDonationsList(accessToken, {
        page: filters.page ?? 1,
        page_size: 10,
        search: filters.search ?? "",
        status: filters.status,
        campaign: filters.campaign,
        state: filters.state,
        district: filters.district,
        amount_min: filters.amount_min,
        amount_max: filters.amount_max,
        paid_at_from: filters.paid_at_from,
        paid_at_to: filters.paid_at_to,
        sort: filters.sort ?? "-paid_at",
      });
    },
    enabled: !!accessToken && enabled,
  });
};

/** Mobile card list: same endpoint and filters, appended page by page. */
export const useDonationsInfiniteQuery = (
  filters: DonationsListFilters,
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

  return useInfiniteListQuery({
    queryKey: ["donations", "infinite", { ...filters, page: undefined }],
    pageSize: DONATIONS_PAGE_SIZE,
    enabled: !!accessToken && enabled,
    fetchPage: async (page) => {
      if (!accessToken) throw new Error("No access token");
      const response = await getDonationsList(accessToken, {
        page,
        page_size: DONATIONS_PAGE_SIZE,
        search: filters.search ?? "",
        status: filters.status,
        campaign: filters.campaign,
        state: filters.state,
        district: filters.district,
        amount_min: filters.amount_min,
        amount_max: filters.amount_max,
        paid_at_from: filters.paid_at_from,
        paid_at_to: filters.paid_at_to,
        sort: filters.sort ?? "-paid_at",
      });
      return response.data;
    },
  });
};

export const useDonationQuery = (donationId: string | null) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["donation", donationId],
    queryFn: async () => {
      if (!accessToken || !donationId) throw new Error("Missing required data");
      return getDonation(donationId, accessToken);
    },
    enabled: !!accessToken && !!donationId,
  });
};

export const useDonationReceiptQuery = (donationId: string | null, enabled: boolean) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["donation-receipt", donationId],
    queryFn: async () => {
      if (!accessToken || !donationId) throw new Error("Missing required data");
      return getDonationReceipt(donationId, accessToken);
    },
    enabled: !!accessToken && !!donationId && enabled,
  });
};

export const useDonationReceiptPdfQuery = (donationId: string | null, enabled: boolean) => {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["donation-receipt-pdf", donationId],
    queryFn: async () => {
      if (!accessToken || !donationId) throw new Error("Missing required data");
      return getDonationReceiptPdf(donationId, accessToken);
    },
    enabled: !!accessToken && !!donationId && enabled,
  });
};