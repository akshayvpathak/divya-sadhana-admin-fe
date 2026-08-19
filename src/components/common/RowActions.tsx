'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type ActionKind = 'view' | 'edit' | 'delete' | 'custom';

export interface RowAction {
  kind: ActionKind;
  /** Renders a Link when set, otherwise a button driven by `onClick`. */
  href?: string;
  onClick?: () => void;
  /** Overrides the preset label. */
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Convenience so callers can inline conditional actions in the array. */
  hidden?: boolean;
}

const PRESETS: Record<
  ActionKind,
  { label: string; icon: React.ReactNode; className: string; destructive?: boolean }
> = {
  view: {
    label: 'View',
    icon: <Eye className="h-3.5 w-3.5" />,
    className:
      'border-line bg-surface text-charcoal hover:border-gold/40 hover:bg-tint hover:text-gold-press',
  },
  edit: {
    label: 'Edit',
    icon: <Pencil className="h-3.5 w-3.5" />,
    className:
      'border-line bg-surface text-charcoal hover:border-royal/25 hover:bg-royal-tint hover:text-royal',
  },
  delete: {
    label: 'Delete',
    icon: <Trash2 className="h-3.5 w-3.5" />,
    className:
      'border-line bg-surface text-charcoal hover:border-danger/30 hover:bg-danger-tint hover:text-danger',
    destructive: true,
  },
  custom: {
    label: 'Action',
    icon: null,
    className:
      'border-line bg-surface text-charcoal hover:border-gold/40 hover:bg-tint hover:text-gold-press',
  },
};

/**
 * `compact` collapses everything past the primary action into an overflow menu.
 *
 * A context rather than a prop: RowActions is called from inside `renderCell`,
 * deep in a column config the card list never touches. <MobileCardList> flips
 * this once around its cards and every action column adapts, with no change at
 * any of the fifteen call sites.
 */
const RowActionsLayoutContext = React.createContext<'inline' | 'compact'>('inline');

export function RowActionsLayout({
  value,
  children,
}: {
  value: 'inline' | 'compact';
  children: React.ReactNode;
}) {
  return (
    <RowActionsLayoutContext.Provider value={value}>
      {children}
    </RowActionsLayoutContext.Provider>
  );
}

function ActionButton({
  action,
  className,
}: {
  action: RowAction;
  className?: string;
}) {
  const preset = PRESETS[action.kind];
  const label = action.label ?? preset.label;
  const icon = action.icon ?? preset.icon;

  const button = (
    <Button
      variant="outline"
      size="sm"
      disabled={action.disabled}
      onClick={action.onClick}
      title={label}
      className={cn('h-8 gap-1.5 px-2.5 text-xs font-semibold', preset.className, className)}
    >
      {icon}
      {label}
    </Button>
  );

  if (action.href && !action.disabled) {
    return <Link href={action.href}>{button}</Link>;
  }
  return button;
}

/**
 * Row action buttons for table "Actions" columns — icon plus text, so the
 * affordance is never a bare glyph the user has to hover to identify.
 */
export function RowActions({
  actions,
  className,
}: {
  actions: RowAction[];
  className?: string;
}) {
  const layout = React.useContext(RowActionsLayoutContext);
  const visible = actions.filter((a) => !a.hidden);
  if (!visible.length) return null;

  if (layout === 'compact') {
    // Two still fit side by side on a 320px card; past that the tail moves into
    // the overflow menu rather than wrapping into a second row of buttons.
    const inline = visible.length <= 2 ? visible : visible.slice(0, 1);
    const overflow = visible.slice(inline.length);

    return (
      <div className={cn('flex items-center justify-end gap-2', className)}>
        {inline.map((action, index) => (
          <ActionButton
            key={`${action.kind}-${action.label ?? ''}-${index}`}
            action={action}
            className="h-9 px-3 text-[13px]"
          />
        ))}

        {overflow.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="More actions"
                  className="h-9 w-9 border-line bg-surface text-charcoal"
                />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            {/* w-auto: the shared content sets `w-(--anchor-width)`, which would
                pin the menu to the 36px trigger. */}
            <DropdownMenuContent align="end" className="w-auto min-w-44">
              {overflow.map((action, index) => {
                const preset = PRESETS[action.kind];
                const label = action.label ?? preset.label;
                const icon = action.icon ?? preset.icon;

                return (
                  <DropdownMenuItem
                    key={`${action.kind}-${label}-${index}`}
                    disabled={action.disabled}
                    onClick={action.onClick}
                    variant={preset.destructive ? 'destructive' : 'default'}
                    className="gap-2 px-2.5 py-2 text-sm"
                    // `render`, not a wrapping <a>: the anchor has to *be* the
                    // menu item, or the role and the hit area disagree.
                    render={
                      action.href && !action.disabled ? (
                        <Link href={action.href} />
                      ) : undefined
                    }
                  >
                    {icon}
                    {label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  return (
    // justify-center, not -end: Actions columns are centre-aligned, and this
    // flex row spans the full cell, so text-center on the <td> alone would not
    // move the buttons.
    <div className={cn('flex flex-wrap items-center justify-center gap-1.5', className)}>
      {visible.map((action, index) => (
        <ActionButton
          key={`${action.kind}-${action.label ?? ''}-${index}`}
          action={action}
        />
      ))}
    </div>
  );
}
