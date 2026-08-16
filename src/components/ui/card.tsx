import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Three shapes: an edge-to-edge shell (table wrappers), a padded panel (forms,
 * stats), and a divided detail card of alternating sections and tinted bands.
 */
const cardVariants = cva(
  "flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card",
  {
    variants: {
      /** `flush` = edge-to-edge (tables, banded detail cards). */
      padding: { flush: "", padded: "p-6", tight: "p-4" },
      /** Hairlines between direct children — the detail-card shape. */
      divided: { true: "divide-y divide-line/70", false: "" },
      /** Lifts on hover; clickable summary cards only. */
      interactive: {
        true: "transition-shadow duration-200 hover:shadow-hover",
        false: "",
      },
    },
    defaultVariants: { padding: "flush", divided: false, interactive: false },
  }
);

function Card({
  className,
  padding,
  divided,
  interactive,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ padding, divided, interactive }), className)}
      {...props}
    />
  );
}

/** A tinted horizontal band: filter bars, table footers, summary strips. */
function CardBand({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-band"
      className={cn("bg-cream px-5 py-4", className)}
      {...props}
    />
  );
}

/** A padded content region inside a `divided` Card. */
function CardSection({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-section"
      className={cn("px-6 py-5", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex items-start justify-between gap-4 px-6 pt-6 pb-4", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-base font-semibold tracking-tight text-ink", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("mt-1 text-sm text-moon", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 py-5", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center justify-end gap-2 bg-cream px-6 py-4", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardBand,
  CardSection,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};
