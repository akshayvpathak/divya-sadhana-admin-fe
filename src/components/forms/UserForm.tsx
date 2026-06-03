'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserFormData } from '@/schemas/user.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

import { useUser } from '@/hooks/useUsers';

interface UserFormProps {
  userId?: string;
  initialData?: UserFormData;
  onSubmit?: (data: UserFormData) => void;
  isPending?: boolean;
  readOnly?: boolean;
}

export function UserForm({ userId, initialData: propsInitialData, onSubmit, isPending, readOnly = false }: UserFormProps) {
  const { data: fetchedUser, isLoading: isFetching } = useUser(userId || null);
  
  const initialData = useMemo(() => fetchedUser ? {
    name: fetchedUser.name,
    email: fetchedUser.email,
    role: fetchedUser.role as 'admin' | 'user',
  } : propsInitialData, [fetchedUser, propsInitialData]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData,
  });

  const roleValue = watch('role');

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: UserFormData) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  if (userId && isFetching) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-100 animate-pulse rounded" />
            <div className="h-10 w-full bg-slate-50 animate-pulse rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-100 animate-pulse rounded" />
            <div className="h-10 w-full bg-slate-50 animate-pulse rounded-lg" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-slate-100 animate-pulse rounded" />
          <div className="h-10 w-64 bg-slate-50 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name <span className="text-rose-500">*</span></Label>
          <Input 
            id="name" 
            placeholder="John Doe" 
            {...register('name')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.name && <p className="text-sm text-rose-500">{errors.name.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address <span className="text-rose-500">*</span></Label>
          <Input 
            id="email" 
            type="email"
            placeholder="john@example.com" 
            {...register('email')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.email && <p className="text-sm text-rose-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role <span className="text-rose-500">*</span></Label>
          <Select 
            value={roleValue || ""} 
            onValueChange={(val) => setValue('role', val as 'admin' | 'user')}
            disabled={readOnly}
          >
            <SelectTrigger id="role" className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default" : "bg-white"}>
              <SelectValue placeholder="Select a role">
                {roleValue === 'admin' ? 'Admin' : roleValue === 'user' ? 'User' : 'Select a role'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-rose-500">{errors.role.message}</p>}
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Link href="/users">
          <Button type="button" variant="outline">
            {readOnly ? 'Back' : 'Cancel'}
          </Button>
        </Link>
        {!readOnly && (
          <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
            {isPending ? 'Processing...' : (initialData ? 'Edit User' : 'Create User')}
          </Button>
        )}
      </div>
    </form>
  );
}
