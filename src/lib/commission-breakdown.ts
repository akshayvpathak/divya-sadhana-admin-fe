import type { CommissionBreakdownSlice } from '@/schemas/orders.schema';

export const BREAKDOWN_ROLE_ORDER = [
  'trustee',
  'state_executive',
  'district_president',
  'admin',
  'referral',
] as const;

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  trustee: 'Trustee',
  state_executive: 'Pradesh Karyavahak',
  district_president: 'Jilla President',
  referral: 'Referral',
};

const RETENTION_REASON_LABEL: Record<string, string> = {
  seat_vacant: 'No one appointed',
  holder_inactive: 'Appointed person is inactive',
  territory_unresolved: 'Place not identified',
  territory_exempt: 'This area is exempt',
  self_purchase: 'Member bought it themselves',
  zero_rate: 'No commission on this sale',
  no_referral_link: 'No referral link',
  referrer_inactive: 'Referrer is inactive',
  not_eligible: 'This purchase type does not earn commission',
  unspecified: 'Unspecified',
  paid_to_member: 'Paid to member',
};

export function breakdownRoleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role.replace(/_/g, ' ');
}

export function retentionReasonLabel(reason: string | null | undefined): string {
  if (!reason) return '';
  return RETENTION_REASON_LABEL[reason] ?? reason.replace(/_/g, ' ');
}

export function sortBreakdownSlices(
  slices: CommissionBreakdownSlice[],
): CommissionBreakdownSlice[] {
  const rank = (role: string) => {
    const i = (BREAKDOWN_ROLE_ORDER as readonly string[]).indexOf(role);
    return i === -1 ? BREAKDOWN_ROLE_ORDER.length : i;
  };
  return [...slices].sort((a, b) => {
    const diff = rank(a.role) - rank(b.role);
    if (diff !== 0) return diff;
    return a.role.localeCompare(b.role);
  });
}

export function isNetworkRole(role: string): boolean {
  return role === 'trustee' || role === 'state_executive' || role === 'district_president';
}
