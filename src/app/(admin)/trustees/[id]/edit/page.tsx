'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';
import { PromoteTrusteeForm, type TrusteeFormInitial } from '@/components/forms/PromoteTrusteeForm';
import { useTrusteeDashboardQuery } from '@/hooks/queries/useTrusteesQuery';
import { useAssignmentsListQuery } from '@/hooks/queries/useTerritoryQuery';

const NETWORK_ROLES = ['trustee', 'state_executive', 'district_president'] as const;

type Loose = Record<string, unknown>;

/** The dashboard payload is not fully specced, so every read is defensive. */
const asObject = (value: unknown): Loose =>
  value && typeof value === 'object' ? (value as Loose) : {};

const asText = (value: unknown): string =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';

function toNetworkRole(value: unknown): TrusteeFormInitial['role'] {
  return NETWORK_ROLES.includes(value as (typeof NETWORK_ROLES)[number])
    ? (value as TrusteeFormInitial['role'])
    : 'trustee';
}

export default function EditTrusteePage() {
  const params = useParams();
  const id = params.id as string;

  const { data: dashboard, isLoading: dashboardLoading } = useTrusteeDashboardQuery(id);
  const { data: assignmentsData, isLoading: assignmentsLoading } = useAssignmentsListQuery({
    member: id,
    page_size: 100,
  });

  const initial = useMemo<TrusteeFormInitial | null>(() => {
    if (dashboardLoading || assignmentsLoading) return null;

    // Meta may be nested under `trustee` or sit top-level — accept both.
    const d = asObject(dashboard);
    const meta = d.trustee && typeof d.trustee === 'object' ? asObject(d.trustee) : d;
    const attribution = asObject(d.attribution);
    const code = asText(meta.referral_code) || asText(d.referral_code);

    // Prefer the server filter (`member=`), then drop any leaked rows.
    const rows = (assignmentsData?.data?.results ?? []).filter((a) => {
      const holder = a.member || a.trustee || '';
      const holderCode = a.member_referral_code || a.trustee_referral_code || '';
      if (!holder && !holderCode) return true;
      return holder === id || (!!code && holderCode === code);
    });

    const fullName = [asText(meta.first_name), asText(meta.last_name)]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      userName:
        asText(meta.name) ||
        asText(meta.user_full_name) ||
        fullName ||
        asText(meta.email) ||
        asText(meta.user_email) ||
        'Member',
      userEmail: asText(meta.email) || asText(meta.user_email),
      role: toNetworkRole(meta.role ?? attribution.role ?? d.role),
      notes: asText(meta.notes) || asText(d.notes),
      isActive: meta.is_active !== false,
      assignments: rows.map((a) => ({
        id: a.id,
        state_id: a.state ?? '',
        district_id: a.district ?? null,
      })),
    };
  }, [dashboard, dashboardLoading, assignmentsLoading, assignmentsData, id]);

  return (
    <div className="space-y-6 pb-8">
      {/* The member's name rides in the breadcrumb trail via `identifier`, which
          is where it lives on every other detail route. */}
      <PageHeader
        backHref="/trustees"
        title="Edit network member"
        identifier={initial?.userName}
        loading={!initial}
      />

      <Card padding="padded">
        {initial ? (
          // Keyed on the record so the form remounts — and re-seeds its
          // defaults — if the underlying member changes.
          <PromoteTrusteeForm key={id} mode="edit" trusteeId={id} initial={initial} />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
            <Skeleton className="h-24 max-w-2xl rounded-lg" />
            <Skeleton className="h-24 max-w-2xl rounded-lg" />
          </div>
        )}
      </Card>
    </div>
  );
}
