'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserFormData } from '@/schemas/user.schema';
import { useCreateUser } from '@/hooks/useUsers';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { UserForm } from '@/components/forms/UserForm';
import { PageHeader } from '@/components/common/PageHeader';

export default function CreateUserPage() {
  const router = useRouter();
  const { mutateAsync: createUser, isPending } = useCreateUser();

  const onSubmit = async (formData: UserFormData) => {
    // Await so the form can catch a 400/422 and map field errors; the hook's
    // onError toast still fires for the general message.
    await createUser(formData);
    router.push('/users');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/users"
        title="Create New User"
        description="Add a new user to the platform"
      />

      <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
        <UserForm 
          onSubmit={onSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
