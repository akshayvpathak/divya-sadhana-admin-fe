export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";

interface RequestOptions extends RequestInit {
  accessToken?: string;
}

export const fetchApi = async <T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { accessToken, headers, ...customConfig } = options;

  const csrfToken =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("csrftoken="))
          ?.split("=")[1] || ""
      : "";

  const config: RequestInit = {
    ...customConfig,
    headers: {
      "Content-Type": "application/json",
      "X-CSRFTOKEN": csrfToken,
      ...headers,
    },
  };

  let finalAccessToken = accessToken;
  if (!finalAccessToken && typeof window !== "undefined") {
    finalAccessToken = localStorage.getItem("accessToken") || undefined;
  }

  if (finalAccessToken) {
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${finalAccessToken}`;
  }

  // Handle full URLs or relative paths
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "" }));
    throw new Error(error.message || `API request failed with status ${response.status}`);
  }

  return response.json();
};

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "GET" }),
  
  post: <T>(endpoint: string, body: any, options?: RequestOptions) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),
  
  put: <T>(endpoint: string, body: any, options?: RequestOptions) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),
  
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "DELETE" }),
};
