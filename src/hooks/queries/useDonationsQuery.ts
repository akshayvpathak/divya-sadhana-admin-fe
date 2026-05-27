import { useAuth } from "@/context/AuthContext";
import { getDonation, getDonationReceipt, getDonationReceiptPdf, getDonationsList } from "@/services/donations.service";
import { useQuery } from "@tanstack/react-query";

export const useDonationsListQuery = (filters: {
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
}) => {
  const { accessToken } = useAuth();

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
    enabled: !!accessToken,
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