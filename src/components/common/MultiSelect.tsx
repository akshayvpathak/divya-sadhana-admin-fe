'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
  /** Small trailing text on the option row, e.g. a state code. */
  hint?: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  /**
   * Always an array, in both modes — single-mode callers read index 0. Keeping
   * one shape means the two modes share a single `onChange` signature.
   */
  value: string[];
  onChange: (values: string[]) => void;
  /** false turns this into a searchable single select that closes on pick. */
  multiple?: boolean;
  /** Cap on how many may be selected. Ignored when `multiple` is false. */
  max?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Searchable select, single or multi. Built on a plain popup rather than the
 * base-ui Select because that primitive owns keyboard/typeahead behaviour and
 * has nowhere to host a real search input.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  multiple = true,
  max,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results found',
  disabled,
  id,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const reactId = useId();
  const listboxId = `${id ?? 'multi-select'}-${reactId}-listbox`;

  const selected = useMemo(() => value.filter(Boolean), [value]);
  // Only multi-select enforces a cap. In single mode a pick replaces whatever
  // was there, so treating one selection as "full" would lock the control.
  const atLimit = multiple && max !== undefined && selected.length >= max;

  const labelFor = useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o.label]));
    return (optionValue: string) => map.get(optionValue) ?? optionValue;
  }, [options]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(query) ||
        (o.hint ?? '').toLowerCase().includes(query)
    );
  }, [options, search]);

  // Search is cleared here rather than in an effect so closing never queues an
  // extra render pass.
  const close = () => {
    setOpen(false);
    setSearch('');
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const toggleOpen = () => {
    if (disabled) return;
    if (open) close();
    else setOpen(true);
  };

  const pick = (optionValue: string) => {
    if (!multiple) {
      onChange([optionValue]);
      close();
      return;
    }
    if (selected.includes(optionValue)) {
      onChange(selected.filter((v) => v !== optionValue));
      return;
    }
    if (atLimit) return;
    onChange([...selected, optionValue]);
  };

  const removeValue = (optionValue: string) => {
    onChange(selected.filter((v) => v !== optionValue));
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {/* A div, not a button: multi-mode renders real remove buttons as chips
          and a button cannot legally nest another button. */}
      <div
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={toggleOpen}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            close();
            return;
          }
          if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
            event.preventDefault();
            if (!disabled) setOpen(true);
          }
        }}
        className={cn(
          'flex min-h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-1.5 pr-2 pl-2.5 text-sm transition-colors outline-none sm:min-h-8',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          disabled && 'pointer-events-none opacity-50',
          open && 'border-ring'
        )}
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : multiple ? (
          <span className="flex flex-wrap gap-1">
            {selected.map((optionValue) => (
              <span
                key={optionValue}
                className="inline-flex items-center gap-1 rounded-md border border-gold/25 bg-tint py-0.5 pr-1 pl-2 text-xs font-medium text-gold-press"
              >
                {labelFor(optionValue)}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeValue(optionValue);
                  }}
                  className="-mr-0.5 rounded p-1 text-gold-deep transition-colors hover:text-danger"
                  title={`Remove ${labelFor(optionValue)}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </span>
        ) : (
          <span className="truncate">{labelFor(selected[0])}</span>
        )}

        <span className="flex shrink-0 items-center gap-0.5">
          {/* Multi-mode clears per chip; single mode needs its own escape hatch. */}
          {!multiple && selected.length > 0 && !disabled ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange([]);
              }}
              className="rounded p-1 text-moon transition-colors hover:text-danger"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}

          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              open && 'rotate-180'
            )}
          />
        </span>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          <div className="relative border-b border-line/60">
            <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-moon" />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') close();
              }}
              placeholder={searchPlaceholder}
              autoComplete="off"
              className="w-full bg-transparent py-2 pr-3 pl-9 text-sm outline-none placeholder:text-moon"
            />
          </div>

          <div
            id={listboxId}
            role="listbox"
            aria-multiselectable={multiple}
            className="max-h-56 overflow-y-auto p-1"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-moon">{emptyMessage}</p>
            ) : (
              filtered.map((option) => {
                const isSelected = selected.includes(option.value);
                const isBlocked = option.disabled || (!isSelected && atLimit);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={isBlocked}
                    onClick={() => pick(option.value)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors',
                      isBlocked
                        ? 'cursor-not-allowed text-line'
                        : 'text-charcoal hover:bg-cream',
                      isSelected && 'font-medium text-gold-press'
                    )}
                  >
                    <span className="truncate">
                      {option.label}
                      {option.hint ? (
                        <span className="ml-1.5 text-xs text-moon">{option.hint}</span>
                      ) : null}
                    </span>
                    {isSelected ? <Check className="h-4 w-4 shrink-0 text-gold-press" /> : null}
                  </button>
                );
              })
            )}
          </div>

          {atLimit ? (
            <p className="border-t border-line/60 px-3 py-1.5 text-xs text-moon">
              Maximum {max} selected.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
