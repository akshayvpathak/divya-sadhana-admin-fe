'use client';

import React from 'react';
import { DataTable } from './DataTable/DataTable';
import { ColumnConfig } from './DataTable/types';
import { MobileCardList } from './MobileCardList';
import { ListErrorState } from './ListStates';
import { useIsCompact } from '@/hooks/useMediaQuery';
import type { MobileListState } from '@/hooks/queries/useInfiniteListQuery';

export interface ResponsiveDataViewProps<T> {
  columns: ColumnConfig<T>[];

  /** Desktop: the current page of the paginated query. */
  data: T[];
  isLoading?: boolean;
  sort?: string;
  onSort?: (field: string) => void;
  /** Desktop pagination — never rendered on the card view. */
  pagination?: React.ReactNode;
  /** Desktop query failure. The card view carries its own state via `mobile`. */
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;

  /** Mobile/tablet: the infinite query, normalised by useInfiniteListQuery. */
  mobile: MobileListState<T>;

  emptyMessage?: string;
  emptyHint?: string;
  rowKey?: keyof T | ((row: T) => string | number);
  emptyValue?: React.ReactNode;
}

/**
 * One component, two intentionally different experiences:
 *
 *   ≥1024px  the existing dense table, header sorting and numbered pagination
 *   <1024px  one card per record, appended by API-backed infinite scroll
 *            (two columns from 768px, one below it)
 *
 * Both branches are driven by the same `columns`, so the two views cannot drift.
 * Visibility is CSS-only on purpose — swapping on a JS media query would blank
 * the list for a frame on every load.
 */
export function ResponsiveDataView<T>({
  columns,
  data,
  isLoading,
  sort,
  onSort,
  pagination,
  isError,
  error,
  onRetry,
  mobile,
  emptyMessage,
  emptyHint,
  rowKey,
  emptyValue,
}: ResponsiveDataViewProps<T>) {
  // Until the viewport query resolves, neither list query has been enabled, so
  // both branches would render "No records found" for a frame. Treat that window
  // as loading — except for embedded tables, whose rows are already in hand.
  const pending = useIsCompact() === undefined && !mobile.isStatic;

  return (
    <>
      <div className="hidden lg:flex lg:flex-col">
        {isError ? (
          <ListErrorState error={error} onRetry={onRetry} />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data}
              isLoading={isLoading || pending}
              sort={sort}
              onSort={onSort}
              emptyMessage={emptyMessage}
              emptyHint={emptyHint}
              rowKey={rowKey}
              emptyValue={emptyValue}
            />
            {pagination}
          </>
        )}
      </div>

      <div className="lg:hidden">
        <MobileCardList
          columns={columns}
          state={pending ? { ...mobile, isLoading: true } : mobile}
          emptyMessage={emptyMessage}
          emptyHint={emptyHint}
          rowKey={rowKey}
        />
      </div>
    </>
  );
}
