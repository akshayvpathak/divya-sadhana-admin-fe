import { ReactNode } from "react";

export interface ColumnConfig<T> {
  id: string;
  accessorKey?: keyof T | string;
  header: string;

  headerClassName?: string;
  cellClassName?: string;

  headerAlign?: "left" | "center" | "right";
  cellAlign?: "left" | "center" | "right";

  sortable?: boolean;
  sortKey?: string;
  sticky?: "left" | "right";

  renderHeader?: () => ReactNode;
  renderCell?: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  isLoading?: boolean;
  sort?: string;
  onSort?: (field: string) => void;
  emptyMessage?: string;
  rowKey?: keyof T | ((row: T) => string | number);
}
