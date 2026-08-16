'use client';

import { Mail, ShieldCheck } from 'lucide-react';
import { Card, CardSection } from '@/components/ui/card';
import { Field, NAValue, SectionHeading } from '@/components/common/DetailCard';
import { TableAvatar } from '@/components/common/TableAvatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/useUsers';

/** Read-only user view. */
export function UserDetailView({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId);

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-2xl" />;
  }
  if (!user) return null;

  const displayName = user.name?.trim();

  return (
    <Card divided>
      <div className="flex flex-wrap items-center gap-4 p-6">
        <TableAvatar
          name={displayName || user.email || '?'}
          className="h-14 w-14 text-base"
        />
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold tracking-tight text-ink">
            {displayName || <NAValue />}
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-moon">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {user.email}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <StatusBadge status={user.role} type="role" />
          <StatusBadge status={user.is_active} type="active" />
        </div>
      </div>

      <CardSection>
        <SectionHeading icon={<ShieldCheck className="h-3.5 w-3.5" />}>
          Account
        </SectionHeading>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name">{user.first_name}</Field>
          <Field label="Last name">{user.last_name}</Field>
          <Field label="Email">{user.email}</Field>
          <Field label="Role">
            <StatusBadge status={user.role} type="role" />
          </Field>
          <Field label="Status">
            <StatusBadge status={user.is_active} type="active" />
          </Field>
        </div>
      </CardSection>
    </Card>
  );
}
