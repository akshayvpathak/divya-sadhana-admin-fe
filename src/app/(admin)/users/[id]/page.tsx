'use client';

import { useUser, useUpdateUser } from '@/hooks/useUsers';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { UserForm } from '@/components/forms/UserForm';
import { UserFormData } from '@/schemas/user.schema';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  
  const mode = searchParams.get('mode') || 'view';
  const isEdit = mode === 'edit';

  const { data: user, isLoading } = useUser(id);
  const { mutateAsync: updateUser, isPending } = useUpdateUser();

  const onSubmit = async (formData: UserFormData) => {
    // Await so UserForm can catch a 400/422 and map field errors.
    await updateUser({ id, data: formData });
    router.push('/users');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isEdit ? 'Edit User' : 'View User'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEdit ? 'Update user details and roles' : 'Detailed information about the user'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <UserForm 
            userId={id}
            onSubmit={isEdit ? onSubmit : undefined}
            isPending={isEdit ? isPending : undefined}
            readOnly={!isEdit}
          />
        )}
      </div>
    </div>
  );
}
