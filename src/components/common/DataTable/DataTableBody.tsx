import React from "react";
import { TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColumnConfig } from "./types";
import { getAlignmentClass, getStickyClass } from "./utils";

interface DataTableBodyProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  rowKey?: keyof T | ((row: T) => string | number);
  emptyValue?: React.ReactNode;
}

/**
 * A cell is blank when the API gave us nothing — null, undefined, or a
 * whitespace-only string. `0` and `false` are real values and pass through, so
 * a zero balance never reads as missing data.
 */
function isBlankCell(value: React.ReactNode): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

/** A chip, not bare text — missing data should look deliberate, not broken. */
const DEFAULT_EMPTY_VALUE = (
  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-slate-400 ring-1 ring-inset ring-slate-200/70">
    N/A
  </span>
);

// Staggered widths so the loading state reads as a table, not a grey block.
const SKELETON_WIDTHS = ["w-3/4", "w-full", "w-1/2", "w-5/6", "w-2/3"];

export function DataTableBody<T>({
  columns,
  data,
  isLoading,
  emptyMessage = "No records found",
  rowKey,
  emptyValue = DEFAULT_EMPTY_VALUE,
}: DataTableBodyProps<T>) {
  const getRowKey = (row: T, index: number): string | number => {
    if (rowKey) {
      if (typeof rowKey === "function") {
        return rowKey(row);
      }
      return row[rowKey] as unknown as string | number;
    }
    // Fallback to id if present on the row
    if (row && typeof row === "object" && "id" in row) {
      return (row as { id: string | number }).id;
    }
    return index;
  };

  const getCellValue = (row: T, column: ColumnConfig<T>) => {
    if (column.renderCell) {
      return column.renderCell(row);
    }
    if (column.accessorKey) {
      return row[column.accessorKey as keyof T] as unknown as React.ReactNode;
    }
    return null;
  };

  if (isLoading) {
    return (
      <TableBody>
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <TableRow
            key={rowIndex}
            className="border-slate-100/80 hover:bg-transparent"
          >
            {columns.map((column, colIndex) => (
              <TableCell
                key={column.id}
                className={cn(
                  "px-5 py-4",
                  getAlignmentClass(column.cellAlign),
                  getStickyClass(column.sticky),
                  column.cellClassName
                )}
              >
                <Skeleton
                  className={cn(
                    "h-4 rounded-full",
                    SKELETON_WIDTHS[(rowIndex + colIndex) % SKELETON_WIDTHS.length]
                  )}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    );
  }

  if (data.length === 0) {
    return (
      <TableBody>
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columns.length} className="px-5 py-16">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{emptyMessage}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Try adjusting your search or filters.
                </p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {data.map((row, rowIndex) => (
        <TableRow
          key={getRowKey(row, rowIndex)}
          // The inset shadow draws an indigo rail on the hovered row's left
          // edge, which tracks the eye across wide tables far better than a
          // background tint alone.
          className="border-slate-100/80 transition-colors duration-150 even:bg-slate-50/40 hover:bg-indigo-50/60 hover:shadow-[inset_3px_0_0_0_rgb(99_102_241)]"
        >
          {columns.map((column) => {
            const alignmentClass = getAlignmentClass(column.cellAlign);
            const stickyClass = getStickyClass(column.sticky);
            const value = getCellValue(row, column);

            return (
              <TableCell
                key={column.id}
                className={cn(
                  "px-5 py-4 text-sm text-slate-700",
                  alignmentClass,
                  stickyClass,
                  column.cellClassName
                )}
              >
                {isBlankCell(value) ? emptyValue : value}
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </TableBody>
  );
}
