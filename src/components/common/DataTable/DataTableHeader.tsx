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
  const handleSortClick = (column: ColumnConfig<T>) => {
    if (column.sortable && onSort) {
      const field = column.sortKey || String(column.accessorKey || '');
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

  const getSortIcon = (column: ColumnConfig<T>) => {
    if (!column.sortable) return null;
    const field = column.sortKey || String(column.accessorKey || '');
    if (!field) return null;
    if (sort === field) {
      return <ArrowUp className="h-4 w-4 text-slate-700" />;
    }
    if (sort === `-${field}`) {
      return <ArrowDown className="h-4 w-4 text-slate-700" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-slate-300 hover:text-slate-500" />;
  };

  return (
    <BaseTableHeader>
      <TableRow className="bg-slate-50 hover:bg-slate-50">
        {columns.map((column) => {
          const alignmentClass = getAlignmentClass(column.headerAlign);
          const stickyClass = getStickyClass(column.sticky);
          
          return (
            <TableHead
              key={column.id}
              className={cn(
                column.sortable ? "cursor-pointer select-none hover:bg-slate-100/50 transition-colors" : "",
                alignmentClass,
                stickyClass,
                column.headerClassName
              )}
              onClick={() => handleSortClick(column)}
            >
              <div className={cn(
                "flex items-center gap-1",
                column.headerAlign === "center" && "justify-center",
                column.headerAlign === "right" && "justify-end"
              )}>
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
