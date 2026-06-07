'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserFormData } from '@/schemas/user.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
    first_name: fetchedUser.first_name || '',
    last_name: fetchedUser.last_name || '',
    email: fetchedUser.email,
    is_active: fetchedUser.is_active ?? true,
  } : propsInitialData, [fetchedUser, propsInitialData]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      is_active: true,
      ...initialData,
    },
  });

  const isActiveValue = watch('is_active');

  useEffect(() => {
    register('is_active');
  }, [register]);

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
          <Label htmlFor="first_name">First Name <span className="text-rose-500">*</span></Label>
          <Input 
            id="first_name" 
            placeholder="John" 
            {...register('first_name')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.first_name && <p className="text-sm text-rose-500">{errors.first_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name <span className="text-rose-500">*</span></Label>
          <Input 
            id="last_name" 
            placeholder="Doe" 
            {...register('last_name')} 
            disabled={readOnly}
            className={readOnly ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0" : ""}
          />
          {errors.last_name && <p className="text-sm text-rose-500">{errors.last_name.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address <span className="text-rose-500">*</span></Label>
          <Input 
            id="email" 
            type="email"
            placeholder="john@example.com" 
            {...register('email')} 
            readOnly={readOnly || !!userId}
            className={readOnly || !!userId ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0 select-none" : ""}
          />
          {errors.email && <p className="text-sm text-rose-500">{errors.email.message}</p>}
        </div>

        <div className="flex items-center gap-2 pt-8">
          <Switch 
            id="is_active" 
            checked={!!isActiveValue} 
            onCheckedChange={(val) => setValue('is_active', val)}
            disabled={readOnly}
          />
          <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
          {errors.is_active && <p className="text-sm text-rose-500">{errors.is_active.message}</p>}
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
