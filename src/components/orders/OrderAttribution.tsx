'use client';

import Link from 'next/link';
import { useTrusteeQuery } from '@/hooks/queries/useTrusteesQuery';
import { formatPercent } from '@/lib/currency';
import type { Order } from '@/schemas/orders.schema';

/**
 * Who an order is attributed to.
 *
 * This is deliberately separate from the commission split. The backend stamps
 * attribution (`area_trustee` and friends) on every order at checkout, but it
 * computes `commission_breakdown` only once product-order commission is switched
 * on. So until that happens this is the only per-order network information that
 * exists, and it is worth showing on its own — it answers "who would earn on
 * this order" even when no rupees have been split yet.
 *
 * The order carries bare member UUIDs, so each row resolves its own name.
 */

type AttributionRole = {
  id: string | null | undefined;
  label: string;
  /** Rate captured on the order at checkout, not the member's current rate. */
  percent: string | number | null | undefined;
  hint: string;
};

function AttributionRow({ role }: { role: AttributionRole }) {
  const { data: member, isLoading, isError } = useTrusteeQuery(role.id);

  const name =
    member?.user_full_name?.trim() ||
    member?.name?.trim() ||
    [member?.first_name, member?.last_name].filter(Boolean).join(' ').trim() ||
    member?.user_email?.trim() ||
    '';

  const place = [member?.district, member?.state].filter(Boolean).join(', ');

  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-moon">{role.label}</p>
          {isLoading ? (
            <span className="mt-1 block h-4 w-32 animate-pulse rounded bg-cosmos" />
          ) : name ? (
            <Link
              href={`/trustees/${role.id}`}
              className="mt-0.5 block truncate font-semibold text-ink underline-offset-2 hover:underline"
            >
              {name}
            </Link>
          ) : (
            // A 404 here means the member was removed after the order was placed.
            <p className="mt-0.5 truncate font-semibold text-charcoal">
              {isError ? 'Member no longer on file' : 'Unknown member'}
            </p>
          )}
          <p className="mt-0.5 text-[11px] text-moon">
            {member?.role_display || role.hint}
            {place ? ` · ${place}` : ''}
          </p>
        </div>
        {role.percent != null && role.percent !== '' ? (
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-moon">Rate</p>
            <p className="tabular-nums font-semibold text-ink">{formatPercent(role.percent)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function OrderAttribution({ order }: { order: Order }) {
  const roles: AttributionRole[] = [
    {
      id: order.area_trustee,
      label: 'Area',
      percent: order.area_commission_percent_snapshot ?? order.commission_percent_snapshot,
      hint: 'Earns on the delivery area',
    },
    {
      id: order.referring_trustee,
      label: 'Referred by',
      percent: order.referral_commission_percent_snapshot,
      hint: 'Shared the referral link',
    },
    {
      id: order.referral_trustee,
      label: 'Referral credit',
      percent: order.referral_commission_percent_snapshot,
      hint: 'Credited for the referral',
    },
  ];

  // `referring_trustee` and `referral_trustee` are the same person on most
  // orders; showing the row twice would read as two separate earners.
  const seen = new Set<string>();
  const present = roles.filter((r) => {
    if (!r.id || seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  if (present.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-cream px-3 py-2 text-xs text-charcoal">
        This order is not attributed to anyone in the network — no area member covers the delivery
        pincode and it did not come through a referral link.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {present.map((role) => (
        <AttributionRow key={`${role.label}-${role.id}`} role={role} />
      ))}
    </div>
  );
}
