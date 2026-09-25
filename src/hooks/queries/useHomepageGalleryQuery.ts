import { useAuth } from "@/context/AuthContext";
import { HomepageGalleryFormValues } from "@/schemas/homepage-gallery.schema";
import {
  createHomepageGalleryItem,
  deleteHomepageGalleryItem,
  getHomepageGallery,
  getHomepageGalleryItem,
  updateHomepageGalleryItem,
} from "@/services/homepage-gallery.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const GALLERY_KEY = ["homepage-gallery"];

const notifyError = (fallback: string) => (error: unknown) => {
  toast.error(error instanceof Error ? error.message : fallback);
};

export function useHomepageGalleryQuery() {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: GALLERY_KEY,
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getHomepageGallery(accessToken);
    },
    enabled: !!accessToken,
  });
}

export function useHomepageGalleryItemQuery(id: string | null) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: [...GALLERY_KEY, id],
    queryFn: async () => {
      if (!accessToken || !id) throw new Error("Missing required data");
      return getHomepageGalleryItem(id, accessToken);
    },
    enabled: !!accessToken && !!id,
  });
}

export function useCreateHomepageGalleryMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: HomepageGalleryFormValues & { image_key: string }
    ) => {
      if (!accessToken) throw new Error("No access token");
      return createHomepageGalleryItem(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GALLERY_KEY });
      toast.success("Gallery item created");
    },
    onError: notifyError("Failed to create gallery item"),
  });
}

export function useUpdateHomepageGalleryMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<HomepageGalleryFormValues>;
    }) => {
      if (!accessToken) throw new Error("No access token");
      return updateHomepageGalleryItem(id, payload, accessToken);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GALLERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...GALLERY_KEY, variables.id] });
      toast.success("Gallery item updated");
    },
    onError: notifyError("Failed to update gallery item"),
  });
}

export function useDeleteHomepageGalleryMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) throw new Error("No access token");
      return deleteHomepageGalleryItem(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GALLERY_KEY });
      toast.success("Gallery item deleted");
    },
    onError: notifyError("Failed to delete gallery item"),
  });
}
