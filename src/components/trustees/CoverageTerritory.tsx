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
        <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm text-amber-600">Vacant</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800">{member.name || '—'}</p>
      <p className="text-xs text-slate-500">{member.email || member.referral_code || ''}</p>
    </div>
  );
}

function CoverageDetailPanel({ stateId }: { stateId: string }) {
  const { data, isLoading, error } = useTerritoryCoverageDetailQuery(stateId, true);
  const districts = data?.districts ?? [];

  if (isLoading) {
    return <p className="px-4 py-3 text-sm text-slate-500">Loading districts…</p>;
  }
  if (error) {
    return (
      <p className="px-4 py-3 text-sm text-rose-600">
        {error instanceof Error ? error.message : 'Failed to load districts'}
      </p>
    );
  }
  if (!districts.length) {
    return <p className="px-4 py-3 text-sm text-slate-500">No districts seeded for this state.</p>;
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/80">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-2 font-semibold">District</th>
            <th className="px-4 py-2 font-semibold">President</th>
            <th className="px-4 py-2 font-semibold">Pincode link</th>
          </tr>
        </thead>
        <tbody>
          {districts.map((d) => (
            <tr key={d.district_id} className="border-t border-slate-100">
              <td className="px-4 py-2 font-medium text-slate-800">{d.district_name}</td>
              <td className="px-4 py-2">
                {d.president ? (
                  <span>
                    {d.president.name || '—'}
                    {d.president.referral_code ? (
                      <span className="ml-2 text-xs text-slate-400">{d.president.referral_code}</span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-amber-600">Vacant → 8% to Admin</span>
                )}
              </td>
              <td className="px-4 py-2">
                {d.pincode_linked === false ? (
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Unlinked
                  </span>
                ) : (
                  <span className="text-slate-500">Linked</span>
                )}
              </td>
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
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading coverage…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error instanceof Error ? error.message : 'Failed to load coverage'}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-300" />
        No coverage data yet. Seed districts on the server first.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm text-slate-600">
          Seat occupancy by state. Expand a row for district presidents. Unlinked pincodes cannot
          resolve delivery addresses to that district.
        </p>
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.map((row) => {
          const open = expanded === row.state_id;
          return (
            <li key={row.state_id}>
              <button
                type="button"
                onClick={() => setExpanded(open ? null : row.state_id)}
                className="flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-slate-50"
              >
                <span className="mt-1 text-slate-400">
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{row.state_name}</h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                        Districts {row.districts_filled}/{row.districts_total}
                      </span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
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
