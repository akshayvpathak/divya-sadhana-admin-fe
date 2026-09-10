import React from "react";
import { Table } from "@/components/ui/table";
import { DataTableProps } from "./types";
import { DataTableHeader } from "./DataTableHeader";
import { DataTableBody } from "./DataTableBody";

export function DataTable<T>({
  columns,
  data,
  isLoading,
  sort,
  onSort,
  emptyMessage,
  emptyHint,
  rowKey,
  emptyValue,
}: DataTableProps<T>) {
  return (
    // No overflow here: <Table> already owns the scroll container, and nesting
    // two of them produced a second, unstyled scrollbar.
    <div className="flex-1">
      <Table>
        <DataTableHeader columns={columns} sort={sort} onSort={onSort} />
        <DataTableBody
          columns={columns}
          data={data}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          emptyHint={emptyHint}
          rowKey={rowKey}
          emptyValue={emptyValue}
        />
      </Table>
    </div>
  );
}
export * from "./types";
