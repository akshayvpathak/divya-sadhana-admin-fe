'use client';

import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardBand } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ClearFiltersButton } from './ClearFiltersButton';
import { ColumnConfig } from './DataTable/types';
import { cn } from '@/lib/utils';

export interface ToolbarFilterOption {
  value: string;
  label: string;
}

export interface ToolbarFilter {
  key: string;
  /** Sentence-case name, shown above the control inside the mobile sheet. */
  label: string;
  value: string;
  options: ToolbarFilterOption[];
  onChange: (value: string) => void;
  /** The value that means "not filtering"; drives the active-filter count. */
  defaultValue?: string;
  placeholder?: string;
  /** Desktop-only width. The sheet always renders the control full width. */
  widthClass?: string;
}

interface ListToolbarProps<T> {
  /** Section title, for toolbars that sit above an embedded table. */
  heading?: React.ReactNode;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: ToolbarFilter[];
  onClear?: () => void;
  /** Search or any filter differs from its default. */
  hasActiveFilters?: boolean;
  /**
   * Sortable columns, so the card view gets a Sort control. Desktop keeps
   * sorting through the table headers.
   */
  sortColumns?: ColumnConfig<T>[];
  sort?: string;
  onSort?: (field: string) => void;
  /** Extra desktop-side controls (tabs, exports) rendered after the filters. */
  children?: React.ReactNode;
  className?: string;
}

function filterLabel(filter: ToolbarFilter): string {
  return (
    filter.options.find((o) => o.value === filter.value)?.label ??
    filter.placeholder ??
    filter.label
  );
}

function FilterSelect({
  filter,
  fullWidth,
}: {
  filter: ToolbarFilter;
  fullWidth?: boolean;
}) {
  return (
    <Select
      value={filter.value}
      onValueChange={(val) => filter.onChange((val as string) || filter.defaultValue || 'all')}
    >
      <SelectTrigger
        aria-label={filter.label}
        className={cn(
          'bg-surface',
          fullWidth
            ? 'w-full data-[size=default]:h-11'
            : cn('shrink-0', filter.widthClass ?? 'w-[160px]')
        )}
      >
        <SelectValue placeholder={filter.placeholder ?? filter.label}>
          {filterLabel(filter)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {filter.options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function sortFieldOf<T>(column: ColumnConfig<T>): string {
  return column.sortKey || String(column.accessorKey || '');
}

/**
 * Search, filters and sort for a list page.
 *
 *   ≥1024px  the dense admin bar: search on the left, filter selects inline.
 *   <1024px  a full-width search box above a Filters / Sort pair that open bottom
 *            sheets, so five filter dropdowns never fight for a 360px row.
 *
 * Filters apply immediately in both layouts — the sheet's primary button just
 * dismisses it — which keeps the existing instant-filter behaviour intact.
 */
export function ListToolbar<T>({
  heading,
  search,
  filters = [],
  onClear,
  hasActiveFilters = false,
  sortColumns,
  sort,
  onSort,
  children,
  className,
}: ListToolbarProps<T>) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const activeFilterCount = filters.filter(
    (f) => f.value !== (f.defaultValue ?? 'all')
  ).length;

  const sortable = (sortColumns ?? []).filter(
    (c) => c.sortable && sortFieldOf(c)
  );
  const showSort = sortable.length > 0 && !!onSort;

  const cycleSort = (column: ColumnConfig<T>) => {
    if (!onSort) return;
    const field = sortFieldOf(column);
    if (sort === field) onSort(`-${field}`);
    else if (sort === `-${field}`) onSort('');
    else onSort(field);
  };

  return (
    <CardBand
      className={cn(
        'flex flex-col gap-3 border-b border-line lg:flex-row lg:items-center lg:justify-between lg:gap-4',
        className
      )}
    >
      {heading || search ? (
        <div className="flex w-full flex-col gap-3 lg:flex-1 lg:flex-row lg:items-center">
          {heading && (
            <div className="text-sm font-bold text-ink lg:shrink-0">{heading}</div>
          )}
          {search && (
            <div className="relative w-full lg:max-w-sm lg:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-moon" />
              <Input
                type="search"
                placeholder={search.placeholder ?? 'Search…'}
                className="h-11 w-full bg-surface pl-9 sm:h-11 lg:h-8"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
              />
            </div>
          )}
        </div>
      ) : (
        <span className="hidden lg:block" />
      )}

      {/* Compact controls — phones and tablets. */}
      {(filters.length > 0 || showSort || onClear) && (
        <div className="flex items-center gap-2 lg:hidden">
          {filters.length > 0 && (
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    className="h-10 flex-1 gap-2 border-line bg-surface text-sm font-semibold text-charcoal"
                  />
                }
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-deep px-1.5 text-[11px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </SheetTrigger>
              <SheetContent side="bottom" aria-label="Filters">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <SheetBody className="space-y-4">
                  {filters.map((filter) => (
                    <div key={filter.key} className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-moon">
                        {filter.label}
                      </p>
                      <FilterSelect filter={filter} fullWidth />
                    </div>
                  ))}
                </SheetBody>
                <SheetFooter className="flex items-center gap-2">
                  {onClear && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClear}
                      disabled={!hasActiveFilters}
                      className="h-11 flex-1 border-line bg-surface text-sm font-semibold text-charcoal"
                    >
                      Reset
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="h-11 flex-1 text-sm font-semibold"
                  >
                    Show results
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}

          {showSort && (
            <Sheet open={sortOpen} onOpenChange={setSortOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    className="h-10 flex-1 gap-2 border-line bg-surface text-sm font-semibold text-charcoal"
                  />
                }
              >
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </SheetTrigger>
              <SheetContent side="bottom" aria-label="Sort">
                <SheetHeader>
                  <SheetTitle>Sort by</SheetTitle>
                </SheetHeader>
                <SheetBody className="space-y-1">
                  {sortable.map((column) => {
                    const field = sortFieldOf(column);
                    const asc = sort === field;
                    const desc = sort === `-${field}`;
                    return (
                      <button
                        key={column.id}
                        type="button"
                        onClick={() => cycleSort(column)}
                        aria-pressed={asc || desc}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors',
                          asc || desc
                            ? 'bg-tint text-gold-press'
                            : 'text-charcoal hover:bg-cream'
                        )}
                      >
                        {column.mobileLabel ?? column.header}
                        {asc ? (
                          <ArrowUp className="h-4 w-4 shrink-0" />
                        ) : desc ? (
                          <ArrowDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 shrink-0 text-line" />
                        )}
                      </button>
                    );
                  })}
                </SheetBody>
                <SheetFooter className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onSort?.('')}
                    disabled={!sort}
                    className="h-11 flex-1 border-line bg-surface text-sm font-semibold text-charcoal"
                  >
                    Clear sorting
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setSortOpen(false)}
                    className="h-11 flex-1 text-sm font-semibold"
                  >
                    Done
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}

          {hasActiveFilters && onClear && (
            <Button
              type="button"
              variant="destructive"
              onClick={onClear}
              aria-label="Clear all filters"
              className="h-10 w-10 shrink-0 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Dense controls — desktop. */}
      {(filters.length > 0 || children || onClear) && (
        <div className="hidden w-full items-center justify-end gap-2 lg:flex lg:w-auto">
          {filters.length > 0 && <Filter className="h-4 w-4 shrink-0 text-moon" />}
          {filters.map((filter) => (
            <FilterSelect key={filter.key} filter={filter} />
          ))}
          {children}
          {hasActiveFilters && onClear && <ClearFiltersButton onClear={onClear} />}
        </div>
      )}
    </CardBand>
  );
}
