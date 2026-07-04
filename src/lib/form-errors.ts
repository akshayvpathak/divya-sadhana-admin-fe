import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/services/auth.service";

/**
 * Map backend field validation errors (ApiError.fieldErrors, parsed from a
 * 400/422 `data.errors` body) onto react-hook-form fields.
 *
 * @param alias maps backend field names to form field names when they differ,
 *   e.g. `{ primary_image_key: "image", category: "categoryId" }`.
 * @returns true if at least one error was applied to a known form field, so the
 *   caller can decide whether to also show a generic toast for unmapped errors.
 */
export function applyServerFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
  alias: Record<string, string> = {},
): boolean {
  if (!(error instanceof ApiError) || error.fieldErrors.length === 0) return false;
  let applied = false;
  for (const fe of error.fieldErrors) {
    const formField = alias[fe.field] ?? fe.field;
    if (knownFields.includes(formField)) {
      setError(formField as Path<T>, { type: "server", message: fe.message });
      applied = true;
    }
  }
  return applied;
}
