import { useState } from 'react';

/**
 * Filter state for a list page: the current values, an API-param projection
 * that maps the sentinel `'all'` to `undefined`, and a reset.
 *
 * The rendering half of this file is gone — filter controls now live in
 * <ListToolbar>, which draws them inline on desktop and inside a bottom sheet
 * below `lg`. Pages that already used this hook keep their state logic
 * unchanged and just hand the values to the toolbar.
 */
export function useFilterManager<T extends Record<string, string>>(
  initialFilters: T,
  onResetPage?: () => void
) {
  const [filters, setFilters] = useState<T>(initialFilters);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (onResetPage) {
      onResetPage();
    }
  };

  // Generate parameters for the API call (mapping 'all' to undefined)
  const getApiParams = () => {
    const params: Record<string, string | undefined> = {};
    for (const key in filters) {
      const val = filters[key];
      params[key] = val === 'all' ? undefined : val;
    }
    return params as Record<keyof T, string | undefined>;
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    if (onResetPage) {
      onResetPage();
    }
  };

  // Returns true if any filter value differs from its initial value
  const hasActiveFilters = (Object.keys(initialFilters) as (keyof T)[]).some(
    (key) => filters[key] !== initialFilters[key]
  );

  return {
    filters,
    handleFilterChange,
    getApiParams,
    resetFilters,
    setFilters,
    hasActiveFilters,
  };
}

/**
 * The same shape, backed by the page's `useListQueryState` instead of local
 * state, so the filters live in the URL and survive opening a record.
 *
 * One URL writer per page, deliberately: two hooks each serialising their own
 * keys would overwrite each other's half of the query string. The page owns the
 * single `useListQueryState`; this just presents the filter slice of it in the
 * shape the toolbars already expect.
 */
export function useUrlFilterManager<T extends Record<string, string>>(
  initialFilters: T,
  values: Record<string, string | number>,
  patch: (next: Record<string, string | number>) => void
) {
  const keys = Object.keys(initialFilters) as (keyof T)[];

  const filters = Object.fromEntries(
    keys.map((key) => [key, String(values[key as string] ?? initialFilters[key])])
  ) as T;

  /** Any filter change returns to page 1 — page 7 of the old result set is meaningless. */
  const handleFilterChange = (key: string, value: string) => patch({ [key]: value, page: 1 });

  const getApiParams = () => {
    const params: Record<string, string | undefined> = {};
    for (const key of keys) {
      const val = filters[key];
      params[key as string] = val === 'all' ? undefined : val;
    }
    return params as Record<keyof T, string | undefined>;
  };

  const resetFilters = () => patch({ ...initialFilters, page: 1 });

  const hasActiveFilters = keys.some((key) => filters[key] !== initialFilters[key]);

  return { filters, handleFilterChange, getApiParams, resetFilters, hasActiveFilters };
}
