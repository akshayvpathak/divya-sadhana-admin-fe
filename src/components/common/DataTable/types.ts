import { ReactNode } from "react";

/**
 * Where a column lands on the mobile card. One column config therefore drives
 * both renderings — the desktop table and the phone card — so a new column can
 * never be added to one and forgotten in the other.
 *
 *  title     the card's headline (one per table)
 *  subtitle  the muted line under it
 *  status    a badge in the card header; more than one is allowed
 *  field     a label/value row in the card body
 *  detail    a label/value row hidden behind "More details"
 *  actions   the card footer
 *  hidden    dropped on mobile — low-signal columns that would bloat the card
 */
export type MobileRole =
  | "title"
  | "subtitle"
  | "status"
  | "field"
  | "detail"
  | "actions"
  | "hidden";

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

  /** Card slot on screens below `lg`. Defaults are inferred — see inferMobileRole. */
  mobile?: MobileRole;
  /** Card label when the table header is too terse out of its column context. */
  mobileLabel?: string;
  /**
   * Card-specific rendering. Table cells are built for a fixed-width column —
   * avatars, truncation, progress bars — which rarely suits a full-width card.
   */
  renderMobile?: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  isLoading?: boolean;
  sort?: string;
  onSort?: (field: string) => void;
  emptyMessage?: string;
  emptyHint?: string;
  rowKey?: keyof T | ((row: T) => string | number);
  /** Shown in any cell that resolves to no data. Defaults to an em dash. */
  emptyValue?: ReactNode;
}
