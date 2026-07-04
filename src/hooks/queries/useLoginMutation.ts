import { login, forgotPassword } from "@/services/auth.service";
import { LoginPayload, ForgotPasswordPayload } from "@/schemas/auth.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { createUser, updateUser, deleteUser } from "@/services/users.service";
import { CreateUserPayload, UpdateUserPayload } from "@/schemas/users.schema";
import { useAuth } from "@/context/AuthContext";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => forgotPassword(payload),
    onSuccess: (data) => {
      toast.success(data.message || "Reset password instructions sent to your email!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Something went wrong.");
    },
  });
}

export function useCreateUserMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => {
      if (!accessToken) throw new Error("Access token not found");
      return createUser(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => {
      if (!accessToken) throw new Error("Access token not found");
      return updateUser(id, payload, accessToken);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
  });
}

export function useDeleteUserMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!accessToken) throw new Error("Access token not found");
      return deleteUser(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
