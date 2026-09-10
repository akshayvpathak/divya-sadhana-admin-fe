'use client';

import Link from 'next/link';
import { useTrusteeQuery } from '@/hooks/queries/useTrusteesQuery';
import type { Order } from '@/schemas/orders.schema';

/**
 * Who an order is attributed to — the members stamped on it at checkout.
 *
 * Deliberately carries no money. The confirmed amounts live in
 * `commission_breakdown`, and the caller shows this block only when there is no
 * split to display, where it still answers "who would have earned on this".
 * Deriving amounts here from a member's current rate was wrong twice over: the
 * rate can change after the order, and the order's pool snapshot is stale.
 *
 * The order carries bare member UUIDs, so each row resolves its own name.
 */

type AttributionRole = {
  id: string | null | undefined;
  label: string;
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
    <div className="rounded-xl border border-line bg-surface px-3.5 py-3">
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

      </div>
    </div>
  );
}

export default function OrderAttribution({ order }: { order: Order }) {
  const roles: AttributionRole[] = [
    { id: order.area_trustee, label: 'Area', hint: 'Covers the delivery area' },
    { id: order.referring_trustee, label: 'Referred by', hint: 'Shared the referral link' },
    { id: order.referral_trustee, label: 'Referral credit', hint: 'Credited for the referral' },
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
