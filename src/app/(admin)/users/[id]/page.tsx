'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { useUser, useUpdateUser } from '@/hooks/useUsers';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { UserForm } from '@/components/forms/UserForm';
import { UserFormData } from '@/schemas/user.schema';
import { PageHeader } from '@/components/common/PageHeader';
import { UserDetailView } from '@/components/users/UserDetailView';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const isEdit = searchParams.get('mode') === 'edit';

  const { data: user, isLoading } = useUser(id);
  const { mutateAsync: updateUser, isPending } = useUpdateUser();

  const onSubmit = async (formData: UserFormData) => {
    // Await so UserForm can catch a 400/422 and map field errors.
    await updateUser({ id, data: formData });
    router.push('/users');
  };

  const displayName = user?.name?.trim() || user?.email || null;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        backHref="/users"
        title={isEdit ? 'Edit User' : displayName || 'User'}
        description={isEdit ? 'Update user details and roles' : undefined}
        identifier={displayName}
        currentLabel={isEdit ? 'Edit' : undefined}
        loading={isLoading}
        actions={
          !isEdit && (
            <Link href={`/users/${id}?mode=edit`}>
              <Button>
                <Pencil className="h-4 w-4" /> Edit user
              </Button>
            </Link>
          )
        }
      />

      {isEdit ? (
        <Card padding="padded">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <UserForm userId={id} onSubmit={onSubmit} isPending={isPending} />
          )}
        </Card>
      ) : (
        <UserDetailView userId={id} />
      )}
    </div>
  );
}
