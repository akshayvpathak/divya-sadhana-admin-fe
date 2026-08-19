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
