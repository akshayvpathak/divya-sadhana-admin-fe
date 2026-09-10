'use client';

import Link from 'next/link';
import { useTrusteeQuery } from '@/hooks/queries/useTrusteesQuery';
import { formatINR, formatPercent } from '@/lib/currency';
import { shareAmount } from '@/lib/order-commission';
import type { Order } from '@/schemas/orders.schema';

/**
 * Who earns on an order, and roughly how much.
 *
 * The order stamps attribution (`area_trustee` and friends) at checkout but
 * carries no per-person amount, so each row resolves its member and works the
 * share out from that member's own rate against the order's commission base.
 *
 * The rate used is the member's rate *now*, which is why the amount is labelled
 * an estimate: if their rate changed after the order was placed, the figure
 * drifts. The confirmed number lives in the commission ledger and arrives on the
 * order as `commission_breakdown`; once that is present the caller shows it
 * instead and none of this is rendered.
 */

type AttributionRole = {
  id: string | null | undefined;
  label: string;
  /** Read the referral rate for referral rows, the standard rate otherwise. */
  useReferralRate?: boolean;
  hint: string;
};

function AttributionRow({ role, base }: { role: AttributionRole; base: number }) {
  const { data: member, isLoading, isError } = useTrusteeQuery(role.id);

  const name =
    member?.user_full_name?.trim() ||
    member?.name?.trim() ||
    [member?.first_name, member?.last_name].filter(Boolean).join(' ').trim() ||
    member?.user_email?.trim() ||
    '';

  const place = [member?.district, member?.state].filter(Boolean).join(', ');
  const rate = role.useReferralRate
    ? member?.commission_percent_referral
    : member?.commission_percent;
  const amount = shareAmount(base, rate);

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

        {amount > 0 ? (
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-moon">
              Estimated earning
            </p>
            <p className="tabular-nums text-base font-bold text-ink">{formatINR(amount)}</p>
            <p className="text-[11px] text-moon">{formatPercent(rate)} of base</p>
          </div>
        ) : (
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-moon">
              Estimated earning
            </p>
            <p className="text-sm text-moon">{isLoading ? '—' : 'Rate not set'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderAttribution({ order, base }: { order: Order; base: number }) {
  const roles: AttributionRole[] = [
    { id: order.area_trustee, label: 'Area', hint: 'Earns on the delivery area' },
    {
      id: order.referring_trustee,
      label: 'Referred by',
      useReferralRate: true,
      hint: 'Shared the referral link',
    },
    {
      id: order.referral_trustee,
      label: 'Referral credit',
      useReferralRate: true,
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
        <AttributionRow key={`${role.label}-${role.id}`} role={role} base={base} />
      ))}
    </div>
  );
}
