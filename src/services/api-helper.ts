export class ApiError extends Error {
  status: number;
  errors?: any[];

  constructor(message: string, status: number, errors?: any[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export async function handleResponseError(response: Response, defaultMessage: string): Promise<never> {
  let message = defaultMessage;
  let errors: any[] = [];
  try {
    const errorData = await response.json();
    if (errorData.data && Array.isArray(errorData.data.errors) && errorData.data.errors.length > 0) {
      errors = errorData.data.errors;
      message = errorData.data.errors
        .map((e: any) => e.message || `${e.label}: ${e.code}`)
        .join(', ');
    } else if (errorData.message) {
      message = errorData.message;
    }
  } catch (e) {
    // Ignore parsing issues and use default
  }
  throw new ApiError(message, response.status, errors);
}
