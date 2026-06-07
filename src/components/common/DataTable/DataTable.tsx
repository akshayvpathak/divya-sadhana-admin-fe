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
  rowKey,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto flex-1">
      <Table>
        <DataTableHeader columns={columns} sort={sort} onSort={onSort} />
        <DataTableBody
          columns={columns}
          data={data}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          rowKey={rowKey}
        />
      </Table>
    </div>
  );
}
export * from "./types";
