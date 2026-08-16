import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "border-line text-charcoal",
        // Status tones: tint fill, AA-passing ink, hairline ring.
        success: "border-success/20 bg-success-tint text-success-ink font-medium",
        warning: "border-warning/25 bg-warning-tint text-warning-ink font-medium",
        danger: "border-danger/20 bg-danger-tint text-danger-ink font-medium",
        info: "border-info/20 bg-info-tint text-info-ink font-medium",
        indigo: "border-royal/15 bg-royal-tint text-royal-ink font-medium",
        slate: "border-line bg-neutral-tint text-neutral-ink font-medium",
        purple: "border-plum/20 bg-plum-tint text-plum-ink font-medium",
        orange: "border-copper/20 bg-copper-tint text-copper-ink font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
