import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/** The DRF envelope every list endpoint in this API returns. */
export interface PagedPayload<T> {
  count?: number;
  results?: T[];
  next?: string | null;
  /**
   * Rows the server returned, when the fetcher drops some before handing them
   * over (products apply a client-side category fallback). Without it a filtered
   * page looks short and pagination would stop early.
   */
  rawLength?: number;
}

/**
 * The slice of an infinite query the mobile card list needs. Pages hand this to
 * <ResponsiveDataView>, so the view never has to know which resource it renders.
 */
export interface MobileListState<T> {
  rows: T[];
  /** First page in flight (or the query has not been enabled yet). */
  isLoading: boolean;
  /** The first page failed — the list is empty and needs a retry affordance. */
  isError: boolean;
  error: unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** A *subsequent* page failed; earlier rows are still on screen. */
  isNextPageError: boolean;
  fetchNextPage: () => void;
  retry: () => void;
  totalCount?: number;
  /** Rows arrived with the parent record; there was never a request to wait on. */
  isStatic?: boolean;
}

/**
 * Adapter for tables whose rows arrive with their parent record — order items,
 * product variants — so those can use <ResponsiveDataView> too. There is nothing
 * to page through here: the parent request already carried every row.
 */
export function staticListState<T>(
  rows: T[],
  options: { isLoading?: boolean; isError?: boolean; error?: unknown; retry?: () => void } = {}
): MobileListState<T> {
  return {
    rows,
    isLoading: options.isLoading ?? false,
    isError: options.isError ?? false,
    error: options.error,
    hasNextPage: false,
    isFetchingNextPage: false,
    isNextPageError: false,
    fetchNextPage: () => {},
    retry: options.retry ?? (() => {}),
    totalCount: rows.length,
    isStatic: true,
  };
}

interface UseInfiniteListOptions<T> {
  queryKey: readonly unknown[];
  /** Resolves one page. Reuse the resource's existing service function here. */
  fetchPage: (page: number) => Promise<PagedPayload<T>>;
  /** Must match the `page_size`/`paginate` the fetcher asks the API for. */
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Cursor-free infinite pagination over the existing page-numbered endpoints.
 *
 * Deliberately thin: React Query already de-duplicates in-flight requests for a
 * key and refuses a second `fetchNextPage` while one is running, so the sentinel
 * cannot stack requests. Stopping is driven by the server's `count` — never by
 * fetching everything and slicing client-side.
 */
export function useInfiniteListQuery<T>({
  queryKey,
  fetchPage,
  pageSize = 10,
  enabled = true,
}: UseInfiniteListOptions<T>): MobileListState<T> {
  const query = useInfiniteQuery({
    queryKey,
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPage(pageParam as number),
    getNextPageParam: (lastPage, allPages) => {
      const rows = lastPage?.results ?? [];
      const served = lastPage?.rawLength ?? rows.length;
      // A short page is the last page, whatever `count` claims.
      if (served === 0 || served < pageSize) return undefined;
      const loaded = allPages.reduce(
        (n, p) => n + (p?.rawLength ?? p?.results?.length ?? 0),
        0
      );
      const total = lastPage?.count;
      if (typeof total === "number" && loaded >= total) return undefined;
      return allPages.length + 1;
    },
  });

  const pages = query.data?.pages;

  const rows = useMemo(
    () => (pages ?? []).flatMap((p) => p?.results ?? []),
    [pages]
  );

  const hasLoadedFirstPage = rows.length > 0 || (pages?.length ?? 0) > 0;

  return {
    rows,
    // `enabled: false` reports `isLoading: false` with no data; on the compact
    // view that would flash the empty state before the query switches on.
    isLoading: enabled && !query.isError && !hasLoadedFirstPage,
    isError: query.isError && !hasLoadedFirstPage,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isNextPageError: query.isError && hasLoadedFirstPage,
    fetchNextPage: () => {
      // Guarded here too so a fast scroll cannot queue a second page behind the
      // one already in flight.
      if (query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    },
    retry: () => {
      if (hasLoadedFirstPage) {
        void query.fetchNextPage();
      } else {
        void query.refetch();
      }
    },
    totalCount: pages?.[0]?.count,
  };
}
