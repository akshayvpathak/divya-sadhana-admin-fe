import {
  Withdrawal,
  WithdrawalsList,
  withdrawalSchema,
  withdrawalsListSchema,
} from "@/schemas/withdrawals.schema";
import { apiErrorFrom } from "@/services/auth.service";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

const WITHDRAWALS_PATH = `${API_BASE_URL}/wallet/withdrawals`;

function getCsrfToken(): string {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1] || ""
  );
}

export interface WithdrawalsListOptions {
  page?: number;
  page_size?: number;
  status?: string;
}

/**
 * Fetch the admin withdrawal-requests list. Admin auth is assumed to return
 * every trustee's requests (VERIFY post-deploy — see the module header notes).
 *
 * The response envelope shape is not fully specced, so this normalizes three
 * possible shapes into the standard `{ message, data: { count, next, previous,
 * results } }` before validation: a paginated `data` object, a bare array in
 * `data`, or a bare array as the whole body.
 */
export const getWithdrawalsList = async (
  accessToken: string,
  options: WithdrawalsListOptions = {}
): Promise<WithdrawalsList> => {
  const params = new URLSearchParams();
  if (options.page) params.append("page", String(options.page));
  if (options.page_size) params.append("page_size", String(options.page_size));
  if (options.status) params.append("status", options.status);

  const response = await fetch(`${WITHDRAWALS_PATH}/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || "Failed to fetch withdrawals");
  }

  const json = await response.json();

  // Normalize defensively: `data` may be a paginated object or a bare array,
  // and the whole body may itself be a bare array with no envelope.
  const raw = json?.data ?? json;
  const isArray = Array.isArray(raw);
  const results = isArray ? raw : raw?.results ?? [];
  const normalized = {
    message: typeof json?.message === "string" ? json.message : undefined,
    data: {
      count: isArray ? results.length : raw?.count,
      next: isArray ? null : raw?.next,
      previous: isArray ? null : raw?.previous,
      results,
    },
  };

  return withdrawalsListSchema.parse(normalized);
};

/** POST a lifecycle action for a withdrawal, tolerating varied response bodies. */
const postWithdrawalAction = async (
  id: string,
  action: "approve" | "reject" | "mark-paid" | "mark-failed",
  accessToken: string,
  body?: Record<string, unknown>
): Promise<Withdrawal> => {
  const response = await fetch(`${WITHDRAWALS_PATH}/${id}/${action}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFTOKEN": getCsrfToken(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw apiErrorFrom(
      json,
      `Failed to ${action.replace("-", " ")} withdrawal`,
      response.status
    );
  }

  // The action response may return the updated withdrawal, an envelope, or just
  // a message. Parse defensively and fall back to the raw payload.
  const json = await response.json().catch(() => ({}));
  const candidate = json?.data ?? json;
  const parsed = withdrawalSchema.safeParse(candidate);
  return parsed.success ? parsed.data : (candidate as Withdrawal);
};

export const approveWithdrawal = (
  id: string,
  accessToken: string
): Promise<Withdrawal> => postWithdrawalAction(id, "approve", accessToken);

export const rejectWithdrawal = (
  id: string,
  reason: string,
  accessToken: string
): Promise<Withdrawal> =>
  postWithdrawalAction(id, "reject", accessToken, { reason });

export const markWithdrawalPaid = (
  id: string,
  accessToken: string
): Promise<Withdrawal> => postWithdrawalAction(id, "mark-paid", accessToken);

export const markWithdrawalFailed = (
  id: string,
  reason: string,
  accessToken: string
): Promise<Withdrawal> =>
  postWithdrawalAction(id, "mark-failed", accessToken, { reason });
