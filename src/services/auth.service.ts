import {
  LoginPayload,
  LoginResponse,
  loginPayloadSchema,
  loginResponseSchema,
  RefreshTokenResponse,
  refreshTokenResponseSchema,
  ForgotPasswordPayload,
  forgotPasswordSchema,
  ChangePasswordPayload,
  changePasswordSchema,
} from "@/schemas/auth.schema";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";
const CSRF_TOKEN =
  process.env.NEXT_PUBLIC_CSRF_TOKEN ??
  "l59ukUNwIUBIGGsWkMgPIHsDUdkWbEPMYrCb9sWvlUOaq1eH5lBRq8kXkwizAmuP";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function formatApiError(json: any, defaultMessage: string): string {
  if (json?.data?.errors && Array.isArray(json.data.errors) && json.data.errors.length > 0) {
    return json.data.errors
      .map((e: any) => e.message || `${e.label}: ${e.code}`)
      .join(', ');
  }
  return json?.message || defaultMessage;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const parsedPayload = loginPayloadSchema.parse(payload);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRFTOKEN": CSRF_TOKEN,
    },
    body: JSON.stringify(parsedPayload),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json?.message || "Login failed. Please check your credentials.",
      response.status
    );
  }

  return loginResponseSchema.parse(json);
}

export async function refreshToken(refreshTokenValue: string): Promise<RefreshTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRFTOKEN": CSRF_TOKEN,
    },
    body: JSON.stringify({ refresh: refreshTokenValue }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json?.message || "Token refresh failed. Please login again.",
      response.status
    );
  }

  return refreshTokenResponseSchema.parse(json);
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
  const parsedPayload = forgotPasswordSchema.parse(payload);

  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRFTOKEN": CSRF_TOKEN,
    },
    body: JSON.stringify(parsedPayload),
  });

  let json: any = null;
  const text = await response.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (e) {
      // ignore parsing error
    }
  }

  if (!response.ok) {
    throw new ApiError(
      json?.message || "Failed to submit request. Please try again.",
      response.status
    );
  }

  return json || { message: "Success" };
}

export async function changePassword(
  payload: ChangePasswordPayload,
  accessToken: string
): Promise<{ message: string }> {
  // Validate request schema before posting
  const parsedPayload = changePasswordSchema.parse(payload);

  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRFTOKEN": CSRF_TOKEN,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      old_password: parsedPayload.old_password,
      new_password: parsedPayload.new_password,
    }),
  });

  let json: any = null;
  const text = await response.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (e) {
      // ignore parsing error
    }
  }

  if (!response.ok) {
    throw new ApiError(
      json?.message || "Failed to change password. Please check your credentials.",
      response.status
    );
  }

  return json || { message: "Success" };
}
