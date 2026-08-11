import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHeader as BaseTableHeader, TableRow, TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ColumnConfig } from "./types";
import { getAlignmentClass, getStickyClass } from "./utils";

interface DataTableHeaderProps<T> {
  columns: ColumnConfig<T>[];
  sort?: string;
  onSort?: (field: string) => void;
}

export function DataTableHeader<T>({ columns, sort, onSort }: DataTableHeaderProps<T>) {
  const sortFieldOf = (column: ColumnConfig<T>) =>
    column.sortKey || String(column.accessorKey || "");

  const handleSortClick = (column: ColumnConfig<T>) => {
    if (column.sortable && onSort) {
      const field = sortFieldOf(column);
      if (field) {
        if (sort === field) {
          onSort(`-${field}`);
        } else if (sort === `-${field}`) {
          onSort("");
        } else {
          onSort(field);
        }
      }
    }
  };

  const isSorted = (column: ColumnConfig<T>) => {
    if (!column.sortable) return false;
    const field = sortFieldOf(column);
    return !!field && (sort === field || sort === `-${field}`);
  };

  const getSortIcon = (column: ColumnConfig<T>) => {
    if (!column.sortable) return null;
    const field = sortFieldOf(column);
    if (!field) return null;
    if (sort === field) {
      return <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />;
    }
    if (sort === `-${field}`) {
      return <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />;
    }
    // Faint until hovered, so unsorted columns don't shout for attention.
    return (
      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover/th:text-slate-500" />
    );
  };

  return (
    // Sticky so the header survives long scrolls. A slate band separates it from
    // the white filter bar most pages render directly above the table.
    <BaseTableHeader className="sticky top-0 z-20 [&_tr]:border-0">
      <TableRow className="bg-gradient-to-b from-slate-100 to-slate-50 shadow-[inset_0_-1px_0_0_rgb(203_213_225)] hover:bg-transparent">
        {columns.map((column) => {
          const alignmentClass = getAlignmentClass(column.headerAlign);
          const stickyClass = getStickyClass(column.sticky);
          const sorted = isSorted(column);

          return (
            <TableHead
              key={column.id}
              aria-sort={
                sorted
                  ? sort?.startsWith("-")
                    ? "descending"
                    : "ascending"
                  : undefined
              }
              className={cn(
                "group/th h-auto px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500",
                column.sortable
                  ? "cursor-pointer select-none transition-colors hover:bg-slate-200/60 hover:text-slate-800"
                  : "",
                sorted && "text-indigo-700",
                alignmentClass,
                stickyClass,
                column.headerClassName
              )}
              onClick={() => handleSortClick(column)}
            >
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  column.headerAlign === "center" && "justify-center",
                  column.headerAlign === "right" && "justify-end"
                )}
              >
                {column.renderHeader ? column.renderHeader() : column.header}
                {getSortIcon(column)}
              </div>
            </TableHead>
          );
        })}
      </TableRow>
    </BaseTableHeader>
  );
}
