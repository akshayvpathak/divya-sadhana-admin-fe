import React from "react";
import { TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ColumnConfig } from "./types";
import { getAlignmentClass, getStickyClass } from "./utils";

interface DataTableBodyProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  rowKey?: keyof T | ((row: T) => string | number);
}

export function DataTableBody<T>({
  columns,
  data,
  isLoading,
  emptyMessage = "No records found",
  rowKey,
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
      return (row as any).id;
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
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                className={cn(
                  getAlignmentClass(column.cellAlign),
                  getStickyClass(column.sticky),
                  column.cellClassName
                )}
              >
                <Skeleton className="h-5 w-3/4" />
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
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className="text-center py-8 text-slate-500"
          >
            {emptyMessage}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {data.map((row, rowIndex) => (
        <TableRow key={getRowKey(row, rowIndex)}>
          {columns.map((column) => {
            const alignmentClass = getAlignmentClass(column.cellAlign);
            const stickyClass = getStickyClass(column.sticky);

            return (
              <TableCell
                key={column.id}
                className={cn(
                  alignmentClass,
                  stickyClass,
                  column.cellClassName
                )}
              >
                {getCellValue(row, column)}
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </TableBody>
  );
}
