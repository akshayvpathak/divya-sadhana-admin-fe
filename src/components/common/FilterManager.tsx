import React from 'react';
import { Filter } from 'lucide-react';
import { TableFilter } from './TableFilter';
import { useState } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  options: FilterOption[];
  placeholder: string;
  widthClass?: string;
}

// Custom hook to manage table filter states and formatting parameters for API calls
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

  return {
    filters,
    handleFilterChange,
    getApiParams,
    resetFilters,
    setFilters,
  };
}

interface FilterManagerProps {
  configs: FilterConfig[];
  values: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  className?: string;
}

export function FilterManager({
  configs,
  values,
  onFilterChange,
  className = "",
}: FilterManagerProps) {
  if (!configs || configs.length === 0) return null;

  return (
    <div className={`flex flex-wrap sm:flex-nowrap gap-2 items-center w-full sm:w-auto justify-end ${className}`}>
      <Filter className="h-4 w-4 text-slate-400 shrink-0" />
      {configs.map((config) => (
        <TableFilter
          key={config.key}
          value={values[config.key] || 'all'}
          onValueChange={(val) => onFilterChange(config.key, val)}
          options={config.options}
          placeholder={config.placeholder}
          widthClass={config.widthClass}
        />
      ))}
    </div>
  );
}
