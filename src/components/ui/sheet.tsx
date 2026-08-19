"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Edge-anchored dialog: the mobile navigation drawer and the filter/sort bottom
 * sheets. Built on the same Base UI dialog the modals use, so focus trapping,
 * Escape, `aria-modal` and the body scroll lock are handled by the primitive
 * rather than re-implemented per drawer.
 */
function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

const SIDES = {
  bottom:
    "inset-x-0 bottom-0 max-h-[85dvh] w-full rounded-t-2xl border-t data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
  left: "inset-y-0 left-0 h-full w-[min(19rem,85vw)] border-r data-open:slide-in-from-left data-closed:slide-out-to-left",
  right:
    "inset-y-0 right-0 h-full w-[min(19rem,85vw)] border-l data-open:slide-in-from-right data-closed:slide-out-to-right",
} as const;

function SheetContent({
  className,
  children,
  side = "bottom",
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  side?: keyof typeof SIDES;
  showCloseButton?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-royal-deep/35 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden border-line bg-surface text-ink shadow-pop duration-200 outline-none data-open:animate-in data-closed:animate-out",
          SIDES[side],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-9 w-9 text-moon hover:bg-tint hover:text-ink"
              />
            }
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "shrink-0 border-b border-line bg-cream px-4 py-3.5 pr-14",
        className
      )}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-base font-bold tracking-tight text-ink", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("mt-0.5 text-xs text-moon", className)}
      {...props}
    />
  );
}

/** Scrolls; the header and footer stay pinned. */
function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("custom-scrollbar flex-1 overflow-y-auto px-4 py-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        // pb accounts for the iOS home indicator, which otherwise sits on the
        // primary action.
        "shrink-0 border-t border-line bg-cream px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        className
      )}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
};
