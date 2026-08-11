import React from 'react';
import { cn } from '@/lib/utils';

const AVATAR_TONES = [
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
];

export function initialsFromName(name: string): string {
  const parts = name.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Stable per-name tone, so a given person keeps the same colour across tables. */
export function avatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash];
}

export function TableAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        avatarTone(name),
        className
      )}
      aria-hidden
    >
      {initialsFromName(name)}
    </div>
  );
}
