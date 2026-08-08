'use client';

import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDistrictsListQuery } from '@/hooks/queries/useTerritoryQuery';

type Props = {
  stateId: string;
  value: string;
  onChange: (districtId: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * District dropdown — loads up to 50 districts in one request (`paginate=50`).
 * List is scrollable when taller than the panel.
 */
export function DistrictInfiniteSelect({
  stateId,
  value,
  onChange,
  disabled,
  placeholder = 'Select district',
}: Props) {
  const { data: districts = [], isLoading } = useDistrictsListQuery(stateId || null);

  const selectedName = useMemo(
    () => districts.find((d) => d.id === value)?.name,
    [districts, value]
  );

  const emptyLabel = !stateId
    ? 'Select state first'
    : isLoading
      ? 'Loading…'
      : placeholder;

  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val ?? '')}
      disabled={disabled || !stateId || isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={emptyLabel}>
          {selectedName || emptyLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-60 overflow-y-auto">
        {districts.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            {d.name}
          </SelectItem>
        ))}
        {!isLoading && districts.length === 0 && (
          <div className="px-3 py-2 text-sm text-slate-400">No districts found</div>
        )}
      </SelectContent>
    </Select>
  );
}
