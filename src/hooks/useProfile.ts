import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { updateProfile } from '../services/profile.service';
import { useAuth } from '../context/AuthContext';
import { UpdateProfilePayload } from '../schemas/profile.schema';
import { changePassword } from '../services/auth.service';
import { ChangePasswordPayload } from '../schemas/auth.schema';

export const useUpdateProfile = () => {
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProfilePayload }) => {
      if (!accessToken) throw new Error('No access token');
      return updateProfile(id, data, accessToken);
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useChangePassword = () => {
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      if (!accessToken) throw new Error('No access token');
      return changePassword(payload, accessToken);
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Password changed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
