import { login } from "@/services/auth.service";
import { LoginPayload } from "@/schemas/auth.schema";
import { useMutation } from "@tanstack/react-query";
import { createUser, updateUser, deleteUser } from "@/services/users.service";
import { CreateUserPayload, UpdateUserPayload } from "@/schemas/users.schema";
import { useAuth } from "@/context/AuthContext";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
  });
}

export function useCreateUserMutation() {
  const { accessToken } = useAuth();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => {
      if (!accessToken) throw new Error("Access token not found");
      return createUser(payload, accessToken);
    },
  });
}

export function useUpdateUserMutation() {
  const { accessToken } = useAuth();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => {
      if (!accessToken) throw new Error("Access token not found");
      return updateUser(id, payload, accessToken);
    },
  });
}

export function useDeleteUserMutation() {
  const { accessToken } = useAuth();
  return useMutation({
    mutationFn: (id: string) => {
      if (!accessToken) throw new Error("Access token not found");
      return deleteUser(id, accessToken);
    },
  });
}
