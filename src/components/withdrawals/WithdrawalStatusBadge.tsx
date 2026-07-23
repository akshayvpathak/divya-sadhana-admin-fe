import React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusConfig {
  label: string;
  variant: BadgeProps["variant"];
}

// Withdrawal lifecycle → badge styling. Mirrors the color language used by the
// shared status badges (warning/info/success/danger/slate) without touching the
// shared badge-status map.
const STATUS_MAP: Record<string, StatusConfig> = {
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "info" },
  paid: { label: "Paid", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  failed: { label: "Failed", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "slate" },
};

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface WithdrawalStatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function WithdrawalStatusBadge({
  status,
  className,
}: WithdrawalStatusBadgeProps) {
  const key = (status ?? "").toLowerCase().trim();
  const config = STATUS_MAP[key];
  const label = config?.label ?? (status ? toTitleCase(String(status)) : "N/A");
  const variant = config?.variant ?? "slate";

  return (
    <Badge
      variant={variant}
      className={cn(
        "px-2.5 py-1 text-center whitespace-nowrap uppercase tracking-wider text-[10px]",
        className
      )}
    >
      {label}
    </Badge>
  );
}
