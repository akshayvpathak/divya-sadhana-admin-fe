'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, EyeOff, KeyRound, UserPen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUpdateProfile, useChangePassword } from '@/hooks/useProfile';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, ChangePasswordPayload } from '@/schemas/auth.schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { NAValue } from '@/components/common/DetailCard';
import { initialsFromName, avatarTone } from '@/components/common/TableAvatar';
import { cn } from '@/lib/utils';

interface ProfileFormData {
  firstName: string;
  lastName: string;
}

/**
 * A field the API does not accept edits for. Sized to match <Input> so a row
 * stays aligned when its neighbour swaps to a real input in edit mode, and
 * tinted --ivory, the token reserved for read-only inputs.
 */
function ReadOnlyValue({ children }: { children?: React.ReactNode }) {
  const isEmpty =
    children === null ||
    children === undefined ||
    (typeof children === 'string' && children.trim() === '');

  return (
    <div className="flex min-h-8 items-center rounded-lg border border-line bg-ivory px-2.5 py-1 text-sm text-charcoal">
      {isEmpty ? <NAValue /> : children}
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser: updateAuthUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const { mutate: updateProfileMutation, isPending } = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Personal info form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
    }
  });

  // Change password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordPayload>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
      });
    }
  }, [user, reset]);

  const onSubmit = (data: ProfileFormData) => {
    if (!user) return;

    updateProfileMutation({
      id: user.id,
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
      }
    }, {
      onSuccess: (updatedUser) => {
        updateAuthUser({
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
        });
        setIsEditing(false);
      }
    });
  };

  const onSubmitPassword = (data: ChangePasswordPayload) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        resetPassword();
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      }
    });
  };

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  const avatarSeed = fullName || user?.email || '?';

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Profile" />

      {/* Identity beside the name form. No `h-fit` on either card: grid items
          stretch by default, so the two share the row's height. The identity
          content then centres itself in whatever height the form dictates. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center sm:px-6">
            <div
              className={cn(
                'flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold',
                avatarTone(avatarSeed)
              )}
              aria-hidden
            >
              {initialsFromName(avatarSeed)}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-ink">
                {fullName || 'Unnamed user'}
              </h2>
              <p className="mt-0.5 break-all text-sm text-moon">{user?.email}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <StatusBadge status={user?.is_superuser ? 'admin' : 'user'} type="role" />
              <StatusBadge status={user?.is_active} type="active" />
            </div>
          </div>
        </Card>

        {/* Personal information */}
        <Card className="lg:col-span-2">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-1 flex-col divide-y divide-line/70"
          >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPen className="h-4 w-4 text-moon" aria-hidden />
                  Personal information
                </CardTitle>
              </CardHeader>

              {/* flex-1 so the footer stays pinned to the bottom of the card if
                  the identity card beside it ever turns out to be the taller. */}
              <CardContent className="grid flex-1 grid-cols-1 content-start gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="firstName"
                        {...register('firstName', { required: 'First name is required' })}
                        className="bg-surface"
                      />
                      {errors.firstName && (
                        <p className="text-sm text-danger">{errors.firstName.message}</p>
                      )}
                    </>
                  ) : (
                    <ReadOnlyValue>{user?.first_name}</ReadOnlyValue>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="lastName"
                        {...register('lastName', { required: 'Last name is required' })}
                        className="bg-surface"
                      />
                      {errors.lastName && (
                        <p className="text-sm text-danger">{errors.lastName.message}</p>
                      )}
                    </>
                  ) : (
                    <ReadOnlyValue>{user?.last_name}</ReadOnlyValue>
                  )}
                </div>

                {/* Neither is editable here — the update payload only carries the
                    name fields — so they stay read-only in both modes. */}
                <div className="space-y-2">
                  <Label>Email address</Label>
                  <ReadOnlyValue>{user?.email}</ReadOnlyValue>
                </div>

                <div className="space-y-2">
                  <Label>Phone number</Label>
                  <ReadOnlyValue>{user?.phone_number}</ReadOnlyValue>
                </div>

                {isEditing && (
                  <p className="text-xs text-moon sm:col-span-2">
                    Email and phone number can only be changed by an administrator.
                  </p>
                )}
              </CardContent>

              <CardFooter>
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        reset();
                      }}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isPending}>
                      {isPending ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        'Save changes'
                      )}
                    </Button>
                  </>
                ) : (
                  <Button type="button" size="sm" onClick={() => setIsEditing(true)}>
                    Edit profile
                  </Button>
                )}
              </CardFooter>
          </form>
        </Card>
      </div>

      {/* Change password — full width, outside the grid above. */}
      <Card>
        <form
          onSubmit={handleSubmitPassword(onSubmitPassword)}
          className="divide-y divide-line/70"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-moon" aria-hidden />
              Change password
            </CardTitle>
          </CardHeader>

          {/* Three across on desktop: the card is full width now, so a single
              max-w-md column would have stranded most of it. */}
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {([
              {
                id: 'old_password' as const,
                label: 'Old password',
                shown: showOldPassword,
                toggle: () => setShowOldPassword((v) => !v),
              },
              {
                id: 'new_password' as const,
                label: 'New password',
                shown: showNewPassword,
                toggle: () => setShowNewPassword((v) => !v),
              },
              {
                id: 'confirm_password' as const,
                label: 'Confirm new password',
                shown: showConfirmPassword,
                toggle: () => setShowConfirmPassword((v) => !v),
              },
            ]).map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <div className="relative">
                  <Input
                    id={field.id}
                    type={field.shown ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="bg-surface pr-9"
                    {...registerPassword(field.id)}
                  />
                  <button
                    type="button"
                    onClick={field.toggle}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-moon transition-colors hover:text-ink focus-visible:outline-none"
                    title={field.shown ? 'Hide password' : 'Show password'}
                  >
                    {field.shown ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors[field.id] && (
                  <p className="text-sm text-danger">
                    {passwordErrors[field.id]?.message}
                  </p>
                )}
              </div>
            ))}
          </CardContent>

          <CardFooter>
            <Button type="submit" size="sm" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating…
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
