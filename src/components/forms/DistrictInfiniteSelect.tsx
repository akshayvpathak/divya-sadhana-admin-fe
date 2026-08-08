'use client';

import { useMemo } from 'react';
import { MultiSelect } from '@/components/common/MultiSelect';
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
 * Searchable, since a state can carry dozens of districts.
 */
export function DistrictInfiniteSelect({
  stateId,
  value,
  onChange,
  disabled,
  placeholder = 'Select district',
}: Props) {
  const { data: districts = [], isLoading } = useDistrictsListQuery(stateId || null);

  const options = useMemo(
    () => districts.map((d) => ({ value: d.id, label: d.name })),
    [districts]
  );

  const emptyLabel = !stateId ? 'Select state first' : isLoading ? 'Loading…' : placeholder;

  return (
    <MultiSelect
      multiple={false}
      options={options}
      value={value ? [value] : []}
      onChange={(values) => onChange(values[0] ?? '')}
      disabled={disabled || !stateId || isLoading}
      placeholder={emptyLabel}
      searchPlaceholder="Search districts..."
      emptyMessage="No districts found"
    />
  );
}
