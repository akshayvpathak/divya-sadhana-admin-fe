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
  emptyHint?: string;
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
  <span className="inline-flex items-center rounded-md bg-cosmos px-2 py-0.5 text-[11px] font-semibold tracking-wide text-moon ring-1 ring-inset ring-line/70">
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
  emptyHint = "Nothing here yet.",
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
            className="border-line/50 bg-surface even:bg-cream hover:bg-transparent"
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
                    "h-3.5 rounded-full",
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
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tint text-gold-deep">
                <Inbox className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{emptyMessage}</p>
                <p className="mt-0.5 text-xs text-moon">
                  {emptyHint}
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
          // Backgrounds must stay opaque: sticky cells use `bg-inherit`, which
          // copies the computed value including alpha.
          className="border-line/50 bg-surface transition-colors duration-150 even:bg-cream hover:bg-tint hover:shadow-rail"
        >
          {columns.map((column) => {
            const alignmentClass = getAlignmentClass(column.cellAlign);
            const stickyClass = getStickyClass(column.sticky);
            const value = getCellValue(row, column);

            return (
              <TableCell
                key={column.id}
                className={cn(
                  "px-5 py-4 text-sm text-charcoal",
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
