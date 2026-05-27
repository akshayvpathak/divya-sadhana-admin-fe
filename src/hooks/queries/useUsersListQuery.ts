import { getUsersList } from "@/services/users.service";
import { UsersListParams } from "@/schemas/users.schema";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export function useUsersListQuery(params: UsersListParams) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["users", params],
    queryFn: () => {
      if (!accessToken) {
        throw new Error("Access token not found");
      }
      return getUsersList(params, accessToken);
    },
    enabled: !!accessToken,
  });
}
