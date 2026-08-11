import React from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  { label: string; icon: React.ReactNode; className: string }
> = {
  view: {
    label: 'View',
    icon: <Eye className="h-3.5 w-3.5" />,
    className:
      'border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700',
  },
  edit: {
    label: 'Edit',
    icon: <Pencil className="h-3.5 w-3.5" />,
    className:
      'border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700',
  },
  delete: {
    label: 'Delete',
    icon: <Trash2 className="h-3.5 w-3.5" />,
    className:
      'border-slate-200 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600',
  },
  custom: {
    label: 'Action',
    icon: null,
    className:
      'border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700',
  },
};

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
  const visible = actions.filter((a) => !a.hidden);
  if (!visible.length) return null;

  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-1.5', className)}>
      {visible.map((action, index) => {
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
            className={cn('h-8 gap-1.5 px-2.5 text-xs font-semibold', preset.className)}
          >
            {icon}
            {label}
          </Button>
        );

        return (
          <React.Fragment key={`${action.kind}-${label}-${index}`}>
            {action.href && !action.disabled ? (
              <Link href={action.href}>{button}</Link>
            ) : (
              button
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
