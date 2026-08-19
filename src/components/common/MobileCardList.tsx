'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ColumnConfig, MobileRole } from './DataTable/types';
import { RowActionsLayout } from './RowActions';
import { InfiniteScrollSentinel } from './InfiniteScrollSentinel';
import { ListEmptyState, ListErrorState } from './ListStates';
import type { MobileListState } from '@/hooks/queries/useInfiniteListQuery';

/** Column ids that read as a state rather than a value. */
const STATUS_ID_RE = /(^|_)(status|is_active|is_open|is_published|active)$/;

/**
 * Where a column goes when the table has not said. Deliberately conservative:
 * the first column leads the card, anything status-shaped becomes a badge, and
 * the rest fall into the label/value body. Every table in this app also declares
 * its roles explicitly — this only keeps a newly added column from disappearing.
 */
function inferMobileRole<T>(column: ColumnConfig<T>, index: number): MobileRole {
  if (column.mobile) return column.mobile;
  if (column.id === 'actions') return 'actions';
  if (index === 0) return 'title';
  if (STATUS_ID_RE.test(column.id)) return 'status';
  return 'field';
}

function isBlank(value: React.ReactNode): boolean {
  if (value === null || value === undefined || value === false) return true;
  if (typeof value === 'string') return value.trim() === '';
  return false;
}

const NA = (
  <span className="inline-flex items-center rounded-md bg-cosmos px-2 py-0.5 text-[11px] font-semibold tracking-wide text-moon ring-1 ring-inset ring-line/70">
    N/A
  </span>
);

function cellValue<T>(row: T, column: ColumnConfig<T>): React.ReactNode {
  if (column.renderMobile) return column.renderMobile(row);
  if (column.renderCell) return column.renderCell(row);
  if (column.accessorKey) {
    return row[column.accessorKey as keyof T] as unknown as React.ReactNode;
  }
  return null;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 pt-0.5 text-[11px] font-bold uppercase tracking-wide text-moon">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-right text-sm text-charcoal">
        {children}
      </dd>
    </div>
  );
}

interface MobileCardProps<T> {
  row: T;
  columns: ColumnConfig<T>[];
}

function MobileCard<T>({ row, columns }: MobileCardProps<T>) {
  const slots = columns.map((column, index) => ({
    column,
    role: inferMobileRole(column, index),
  }));

  const title = slots.find((s) => s.role === 'title');
  const subtitles = slots.filter((s) => s.role === 'subtitle');
  const statuses = slots.filter((s) => s.role === 'status');
  const fields = slots.filter((s) => s.role === 'field');
  const details = slots.filter((s) => s.role === 'detail');
  const actions = slots.filter((s) => s.role === 'actions');

  const titleValue = title ? cellValue(row, title.column) : null;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-3">
        <div className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-ink">
          {isBlank(titleValue) ? NA : titleValue}
          {subtitles.map(({ column }) => {
            const value = cellValue(row, column);
            if (isBlank(value)) return null;
            return (
              <p key={column.id} className="mt-0.5 text-[13px] font-normal text-moon">
                {value}
              </p>
            );
          })}
        </div>

        {statuses.length > 0 && (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {statuses.map(({ column }) => (
              <React.Fragment key={column.id}>{cellValue(row, column)}</React.Fragment>
            ))}
          </div>
        )}
      </div>

      {fields.length > 0 && (
        <dl className="flex flex-col gap-2 border-t border-line/70 px-4 py-3">
          {fields.map(({ column }) => {
            const value = cellValue(row, column);
            return (
              <FieldRow key={column.id} label={column.mobileLabel ?? column.header}>
                {isBlank(value) ? NA : value}
              </FieldRow>
            );
          })}
        </dl>
      )}

      {details.length > 0 && (
        <details className="group border-t border-line/70">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-gold-press [&::-webkit-details-marker]:hidden">
            <ChevronRight
              aria-hidden
              className="h-3.5 w-3.5 transition-transform group-open:rotate-90"
            />
            More details
          </summary>
          <dl className="flex flex-col gap-2 border-t border-line/60 bg-cream/60 px-4 py-3">
            {details.map(({ column }) => {
              const value = cellValue(row, column);
              return (
                <FieldRow key={column.id} label={column.mobileLabel ?? column.header}>
                  {isBlank(value) ? NA : value}
                </FieldRow>
              );
            })}
          </dl>
        </details>
      )}

      {actions.length > 0 && (
        <div className="mt-auto flex items-center justify-end gap-2 border-t border-line/70 bg-cream px-3 py-2.5">
          {actions.map(({ column }) => (
            <React.Fragment key={column.id}>{cellValue(row, column)}</React.Fragment>
          ))}
        </div>
      )}
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-3">
        <div className="w-full space-y-2">
          <Skeleton className="h-4 w-2/5 rounded-full" />
          <Skeleton className="h-3 w-3/5 rounded-full" />
        </div>
        <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
      </div>
      <div className="space-y-2.5 border-t border-line/70 px-4 py-3">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-4/5 rounded-full" />
      </div>
    </div>
  );
}

export interface MobileCardListProps<T> {
  columns: ColumnConfig<T>[];
  state: MobileListState<T>;
  emptyMessage?: string;
  emptyHint?: string;
  rowKey?: keyof T | ((row: T) => string | number);
  className?: string;
}

/**
 * The phone/tablet rendering of a data table: one card per record, fed by the
 * same column configs the desktop table uses, appended page by page from the
 * API rather than sliced out of a single oversized response.
 */
export function MobileCardList<T>({
  columns,
  state,
  emptyMessage = 'No records found',
  emptyHint = 'Try adjusting your search or filters.',
  rowKey,
  className,
}: MobileCardListProps<T>) {
  const getKey = (row: T, index: number): React.Key => {
    if (typeof rowKey === 'function') return rowKey(row);
    if (rowKey) return row[rowKey] as unknown as React.Key;
    if (row && typeof row === 'object' && 'id' in row) {
      return (row as { id: string | number }).id;
    }
    return index;
  };

  if (state.isLoading) {
    return (
      <div className={cn('grid gap-3 p-4 md:grid-cols-2', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (state.isError) {
    return <ListErrorState error={state.error} onRetry={state.retry} />;
  }

  if (state.rows.length === 0) {
    return <ListEmptyState message={emptyMessage} hint={emptyHint} />;
  }

  return (
    <RowActionsLayout value="compact">
      <div className={cn('flex flex-col', className)}>
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {state.rows.map((row, index) => (
            <MobileCard key={getKey(row, index)} row={row} columns={columns} />
          ))}
        </div>

        <InfiniteScrollSentinel
          hasNextPage={state.hasNextPage}
          isFetchingNextPage={state.isFetchingNextPage}
          isNextPageError={state.isNextPageError}
          onLoadMore={state.fetchNextPage}
          onRetry={state.retry}
          showEndMessage={state.rows.length > 6}
          endMessage={
            typeof state.totalCount === 'number'
              ? `All ${state.totalCount} records loaded`
              : 'No more records'
          }
        />
      </div>
    </RowActionsLayout>
  );
}
