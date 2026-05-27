import {
  LoginPayload,
  LoginResponse,
  loginPayloadSchema,
  loginResponseSchema,
  RefreshTokenResponse,
  refreshTokenResponseSchema,
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
