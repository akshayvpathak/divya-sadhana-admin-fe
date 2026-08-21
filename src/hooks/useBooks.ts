import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { useInfiniteListQuery } from "./queries/useInfiniteListQuery";
import {
  BooksListOptions,
  createBook,
  deleteBook,
  getBook,
  getBooksList,
  registerDigitalAsset,
  updateBook,
} from "@/services/books.service";
import type { BookPayload } from "@/schemas/books.schema";
import {
  generateUploadUrl,
  uploadFileToPresignedUrl,
} from "@/services/image-upload.service";

const BOOKS_PAGE_SIZE = 10;

/** Ceiling enforced by the backend for `upload_type: "ebook_file"`. */
export const EBOOK_MAX_BYTES = 100 * 1024 * 1024;

const notifyError = (fallback: string) => (error: unknown) => {
  toast.error(error instanceof Error ? error.message : fallback);
};

export interface BooksFilters {
  search?: string;
  sort?: string;
  is_active?: string;
  is_published?: string;
}

function listOptions(filters: BooksFilters, page: number): BooksListOptions {
  return {
    page,
    page_size: BOOKS_PAGE_SIZE,
    search: filters.search || undefined,
    sort: filters.sort || undefined,
    is_active: filters.is_active,
    is_published: filters.is_published,
  };
}

export const useBooks = (
  page: number,
  filters: BooksFilters,
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["books", { ...filters, page }],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");
      return getBooksList(accessToken, listOptions(filters, page));
    },
    enabled: !!accessToken && enabled,
    placeholderData: keepPreviousData,
  });
};

export const useBooksInfinite = (
  filters: BooksFilters,
  options: { enabled?: boolean } = {}
) => {
  const { accessToken } = useAuth();
  const { enabled = true } = options;

  return useInfiniteListQuery({
    queryKey: ["books", "infinite", filters],
    pageSize: BOOKS_PAGE_SIZE,
    enabled: !!accessToken && enabled,
    fetchPage: async (page) => {
      if (!accessToken) throw new Error("No access token");
      const response = await getBooksList(accessToken, listOptions(filters, page));
      return response.data;
    },
  });
};

export const useBook = (bookId: string | null) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      if (!accessToken || !bookId) throw new Error("Missing required data");
      return getBook(bookId, accessToken);
    },
    enabled: !!accessToken && !!bookId,
  });
};

export const useCreateBook = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BookPayload) => {
      if (!accessToken) throw new Error("No access token");
      return createBook(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      // A book is a product; the products list shows it too.
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Book saved");
    },
    onError: notifyError("Failed to create book. Please try again."),
  });
};

export const useUpdateBook = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<BookPayload> }) => {
      if (!accessToken) throw new Error("No access token");
      return updateBook(id, payload, accessToken);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["book", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Book updated");
    },
    onError: notifyError("Failed to update book. Please try again."),
  });
};

export const useDeleteBook = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) throw new Error("No access token");
      return deleteBook(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Book deleted");
    },
    // Deleting an owned title is refused with the backend's own message — show it rather
    // than a generic failure, because the answer is "unpublish instead", not "retry".
    onError: notifyError("Failed to delete book."),
  });
};

/**
 * Upload a PDF and register it as a DigitalAsset, in that order.
 *
 * The returned `page_count` is measured server-side from the object. Show it back to the
 * admin — a 400-page title that registers as 1 page means the upload failed, and catching
 * that here is far cheaper than catching it in a support ticket six weeks later.
 */
export const useUploadEbookMutation = () => {
  const { accessToken, user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!accessToken || !user?.id) throw new Error("Missing auth information");

      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) throw new Error("Only PDF files are accepted.");
      if (file.size > EBOOK_MAX_BYTES) {
        throw new Error("That file is over the 100 MB limit.");
      }

      const urlResponse = await generateUploadUrl(
        {
          files: [
            {
              // Superuser-only upload type; the bucket is private and every read is signed.
              upload_type: "ebook_file",
              file_name: file.name,
              file_size_bytes: file.size,
            },
          ],
          user_id: user.id,
        },
        accessToken
      );

      const target = urlResponse.upload_urls[0];
      if (!target) throw new Error("Could not get an upload URL for this file.");

      await uploadFileToPresignedUrl(file, target.upload_url);
      return registerDigitalAsset(target.object_key, accessToken);
    },
    onError: notifyError("Upload failed. Please try again."),
  });
};
