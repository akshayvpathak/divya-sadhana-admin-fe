'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { UserCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUpdateProfile, useChangePassword } from '@/hooks/useProfile';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, ChangePasswordPayload } from '@/schemas/auth.schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileFormData {
  firstName: string;
  lastName: string;
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

  return (
    <div className="space-y-6  pb-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Profile</h1>
          <p className="text-moon mt-1">Manage your account settings</p>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
        <div className="p-8 border-b border-line flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-tint flex items-center justify-center text-gold-press">
            <UserCircle className="h-16 w-16" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink">{user?.first_name} {user?.last_name}</h2>
            <p className="text-moon">{user?.email}</p>
            <div className="mt-2 flex gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-tint text-gold-press">
                {user?.is_superuser ? 'Admin' : 'User'}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user?.is_active ? 'bg-success-tint text-success-ink' : 'bg-cosmos text-charcoal'
                }`}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <h3 className="text-lg font-semibold text-ink mb-6">Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              {isEditing ? (
                <>
                  <Input
                    id="firstName"
                    {...register('firstName', { required: 'First name is required' })}
                    className="bg-surface"
                  />
                  {errors.firstName && <p className="text-sm text-danger">{errors.firstName.message}</p>}
                </>
              ) : (
                <p className="text-base text-ink py-2 border-b border-transparent">{user?.first_name || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              {isEditing ? (
                <>
                  <Input
                    id="lastName"
                    {...register('lastName', { required: 'Last name is required' })}
                    className="bg-surface"
                  />
                  {errors.lastName && <p className="text-sm text-danger">{errors.lastName.message}</p>}
                </>
              ) : (
                <p className="text-base text-ink py-2 border-b border-transparent">{user?.last_name || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <p className="text-base text-moon py-2 border-b border-transparent bg-cream px-3 rounded-lg border border-line cursor-default">{user?.email}</p>
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <p className="text-base text-moon py-2 border-b border-transparent bg-cream px-3 rounded-lg border border-line cursor-default">{user?.phone_number || '-'}</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-line flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    reset();
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
        <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="p-8">
          <h3 className="text-lg font-semibold text-ink mb-6">Change Password</h3>

          <div className="max-w-xl space-y-6">
            <div className="space-y-2">
              <Label htmlFor="old_password">Old Password</Label>
              <div className="relative">
                <Input
                  id="old_password"
                  type={showOldPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-surface pr-10"
                  {...registerPassword("old_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-moon hover:text-charcoal focus:outline-none transition-colors"
                  title={showOldPassword ? "Hide password" : "Show password"}
                >
                  {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordErrors.old_password && (
                <p className="text-sm text-danger">{passwordErrors.old_password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-surface pr-10"
                  {...registerPassword("new_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-moon hover:text-charcoal focus:outline-none transition-colors"
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordErrors.new_password && (
                <p className="text-sm text-danger">{passwordErrors.new_password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-surface pr-10"
                  {...registerPassword("confirm_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-moon hover:text-charcoal focus:outline-none transition-colors"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordErrors.confirm_password && (
                <p className="text-sm text-danger">{passwordErrors.confirm_password.message}</p>
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-line flex justify-end">
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
