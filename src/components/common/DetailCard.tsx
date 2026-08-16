// The label + value units shared by every detail page.

import React from 'react';
import { cn } from '@/lib/utils';

export function SectionHeading({
  icon,
  children,
  className,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        'flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-moon',
        className
      )}
    >
      {icon}
      {children}
    </h3>
  );
}

/** Missing data as a deliberate chip, matching the DataTable's N/A. */
export function NAValue({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-cosmos px-2 py-0.5 text-[11px] font-semibold tracking-wide text-moon ring-1 ring-inset ring-line/70',
        className
      )}
    >
      N/A
    </span>
  );
}

/**
 * Label above value. Renders the N/A chip for null/undefined/empty children, so
 * callers pass raw values through rather than writing `|| '-'`.
 */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const isEmpty =
    children === null ||
    children === undefined ||
    children === false ||
    (typeof children === 'string' && children.trim() === '');

  return (
    <div className={className}>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-moon">
        {label}
      </p>
      <div className="text-sm text-ink">{isEmpty ? <NAValue /> : children}</div>
    </div>
  );
}

/** Monospaced reference block — payment refs, SKUs, tracking numbers. */
export function MonoValue({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'gold';
  className?: string;
}) {
  return (
    <p
      className={cn(
        'break-all rounded-lg border px-3 py-2 font-mono text-xs',
        tone === 'gold'
          ? 'border-gold/25 bg-tint font-bold text-gold-press'
          : 'border-line bg-ivory text-charcoal',
        className
      )}
    >
      {children}
    </p>
  );
}
