'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import {
  useTerritoryCoverageDetailQuery,
  useTerritoryCoverageListQuery,
} from '@/hooks/queries/useTerritoryQuery';
import type { CoverageStateRow } from '@/schemas/territory.schema';

function MemberCell({
  label,
  member,
}: {
  label: string;
  member: CoverageStateRow['trustee'];
}) {
  if (!member) {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-wide text-moon">{label}</p>
        <p className="text-sm text-warning">Vacant</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-moon">{label}</p>
      <p className="text-sm font-medium text-ink">{member.name || '—'}</p>
      <p className="text-xs text-moon">{member.email || member.referral_code || ''}</p>
    </div>
  );
}

function CoverageDetailPanel({ stateId }: { stateId: string }) {
  const { data, isLoading, error } = useTerritoryCoverageDetailQuery(stateId, true);
  const districts = data?.districts ?? [];

  if (isLoading) {
    return <p className="px-4 py-3 text-sm text-moon">Loading districts…</p>;
  }
  if (error) {
    return (
      <p className="px-4 py-3 text-sm text-danger">
        {error instanceof Error ? error.message : 'Failed to load districts'}
      </p>
    );
  }
  if (!districts.length) {
    return <p className="px-4 py-3 text-sm text-moon">No districts seeded for this state.</p>;
  }

  const presidentCell = (d: (typeof districts)[number]) =>
    d.president ? (
      <>
        {d.president.name || '—'}
        {d.president.referral_code ? (
          <span className="ml-2 text-xs text-moon">{d.president.referral_code}</span>
        ) : null}
      </>
    ) : (
      <span className="text-warning">Vacant → 8% to Admin</span>
    );

  const pincodeCell = (d: (typeof districts)[number]) =>
    d.pincode_linked === false ? (
      <span className="inline-flex items-center gap-1 text-warning-ink">
        <AlertTriangle className="h-3.5 w-3.5" />
        Unlinked
      </span>
    ) : (
      <span className="text-moon">Linked</span>
    );

  return (
    <div className="border-t border-line/60 bg-cream">
      {/* Three columns of prose do not survive a 320px viewport, so phones get a
          stacked block per district instead. */}
      <ul className="divide-y divide-line/60 sm:hidden">
        {districts.map((d) => (
          <li key={d.district_id} className="px-4 py-3 text-sm">
            <p className="font-medium text-ink">{d.district_name}</p>
            <p className="mt-1 text-charcoal">{presidentCell(d)}</p>
            <p className="mt-1">{pincodeCell(d)}</p>
          </li>
        ))}
      </ul>

      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-moon">
            <th className="px-4 py-2 font-semibold">District</th>
            <th className="px-4 py-2 font-semibold">President</th>
            <th className="px-4 py-2 font-semibold">Pincode link</th>
          </tr>
        </thead>
        <tbody>
          {districts.map((d) => (
            <tr key={d.district_id} className="border-t border-line/60">
              <td className="px-4 py-2 font-medium text-ink">{d.district_name}</td>
              <td className="px-4 py-2">{presidentCell(d)}</td>
              <td className="px-4 py-2">{pincodeCell(d)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * v2 Coverage tab: one row per state from GET /admin/territory/coverage/,
 * expandable to district detail (?detail=1).
 */
export function CoverageTerritory() {
  const { data, isLoading, error } = useTerritoryCoverageListQuery();
  const [expanded, setExpanded] = useState<string | null>(null);
  const rows = useMemo(() => data?.data?.results ?? [], [data]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-moon sm:p-8">
        Loading coverage…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/25 bg-danger-tint p-4 text-sm text-danger-ink sm:p-6">
        {error instanceof Error ? error.message : 'Failed to load coverage'}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-moon sm:p-8">
        <MapPin className="mx-auto mb-2 h-8 w-8 text-line" />
        No coverage data yet. Seed districts on the server first.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="border-b border-line bg-cream px-4 py-3">
        <p className="text-sm text-charcoal">
          Seat occupancy by state. Expand a row for district presidents. Unlinked pincodes cannot
          resolve delivery addresses to that district.
        </p>
      </div>
      <ul className="divide-y divide-line/60">
        {rows.map((row) => {
          const open = expanded === row.state_id;
          return (
            <li key={row.state_id}>
              <button
                type="button"
                onClick={() => setExpanded(open ? null : row.state_id)}
                className="flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-cream"
              >
                <span className="mt-1 text-moon">
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-ink">{row.state_name}</h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-cosmos px-2.5 py-1 text-charcoal">
                        Districts {row.districts_filled}/{row.districts_total}
                      </span>
                      <span className="rounded-full bg-warning-tint px-2.5 py-1 text-warning-ink">
                        Open seats {row.open_seats}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <MemberCell label="Trustee" member={row.trustee} />
                    <MemberCell label="State Executive" member={row.state_executive} />
                  </div>
                </div>
              </button>
              {open ? <CoverageDetailPanel stateId={row.state_id} /> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
