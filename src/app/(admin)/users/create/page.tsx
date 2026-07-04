'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserFormData } from '@/schemas/user.schema';
import { useCreateUser } from '@/hooks/useUsers';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { UserForm } from '@/components/forms/UserForm';

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
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create New User</h1>
          <p className="text-slate-500 mt-1">Add a new user to the platform</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <UserForm 
          onSubmit={onSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
