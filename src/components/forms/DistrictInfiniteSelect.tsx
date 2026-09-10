'use client';

import { useMemo } from 'react';
import { MultiSelect } from '@/components/common/MultiSelect';
import {
  useDistrictsListQuery,
  useTerritoryCoverageDetailQuery,
} from '@/hooks/queries/useTerritoryQuery';

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
 *
 * Districts with no pincode routing cannot earn, so they stay visible but
 * disabled: picking one would only produce the backend 400.
 */
export function DistrictInfiniteSelect({
  stateId,
  value,
  onChange,
  disabled,
  placeholder = 'Select district',
}: Props) {
  const { data: districts = [], isLoading } = useDistrictsListQuery(stateId || null);
  const { data: coverage } = useTerritoryCoverageDetailQuery(stateId || null, !!stateId);

  const unreachableIds = useMemo(() => {
    const fromCoverage = new Set(
      (coverage?.districts ?? [])
        .filter((d) => d.pincode_linked === false)
        .map((d) => d.district_id),
    );
    for (const d of districts) {
      if (d.pincode_linked === false) fromCoverage.add(d.id);
    }
    return fromCoverage;
  }, [coverage?.districts, districts]);

  const options = useMemo(
    () =>
      districts.map((d) => {
        const unreachable = unreachableIds.has(d.id);
        return {
          value: d.id,
          label: d.name,
          disabled: unreachable,
          hint: unreachable ? 'Unreachable — fix pincode data' : undefined,
        };
      }),
    [districts, unreachableIds]
  );

  const emptyLabel = !stateId ? 'Select state first' : isLoading ? 'Loading…' : placeholder;
  const selectedUnreachable = Boolean(value && unreachableIds.has(value));

  return (
    <div className="space-y-1.5">
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
      {selectedUnreachable ? (
        <p className="text-sm text-danger">
          No pincode routes to this district, so a District President here would
          earn nothing. Link at least one pincode first.
        </p>
      ) : null}
    </div>
  );
}
