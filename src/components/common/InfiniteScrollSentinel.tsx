'use client';

import { useEffect, useRef } from 'react';
import { Loader2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InfiniteScrollSentinelProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** A follow-up page failed. Auto-loading pauses until the user retries. */
  isNextPageError: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  /** Suppressed for short lists, where "that's everything" is self-evident. */
  showEndMessage?: boolean;
  endMessage?: string;
}

/**
 * Bottom-of-list loader for the mobile card view. Fires ~300px early so the next
 * page is usually on screen before the user reaches the end of the current one.
 *
 * The observer is torn down whenever there is nothing to fetch — no next page,
 * a request already in flight, or a failed page awaiting retry — which is what
 * keeps a fast scroll from queueing duplicate requests.
 */
export function InfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  isNextPageError,
  onLoadMore,
  onRetry,
  showEndMessage = false,
  endMessage = 'No more records',
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Kept in a ref so a new `onLoadMore` closure each render does not tear down
  // and rebuild the observer.
  const loadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    loadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (!hasNextPage || isFetchingNextPage || isNextPageError) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreRef.current();
        }
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isNextPageError]);

  return (
    <div ref={sentinelRef} className="px-4 py-4">
      {isNextPageError ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-danger/25 bg-danger-tint px-4 py-4 text-center">
          <p className="text-sm font-medium text-danger-ink">
            Couldn&apos;t load more records.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="h-9 gap-1.5 border-danger/30 bg-surface px-3 text-danger"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      ) : isFetchingNextPage ? (
        <p
          className="flex items-center justify-center gap-2 text-sm text-moon"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading more…
        </p>
      ) : hasNextPage ? (
        // Keyboard and screen-reader path: the observer never fires for a user
        // who tabs rather than scrolls.
        <Button
          type="button"
          variant="outline"
          onClick={onLoadMore}
          className="h-10 w-full border-line bg-surface text-sm font-semibold text-charcoal"
        >
          Load more
        </Button>
      ) : showEndMessage ? (
        <p className="text-center text-xs font-medium text-moon">{endMessage}</p>
      ) : null}
    </div>
  );
}
