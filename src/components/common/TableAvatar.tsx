import React from 'react';
import { cn } from '@/lib/utils';

// Every ink clears 4.5:1 on its own tint, so initials stay readable at 12px.
const AVATAR_TONES = [
  'bg-tint text-gold-press',
  'bg-royal-tint text-royal',
  'bg-success-tint text-success-ink',
  'bg-plum-tint text-plum-ink',
  'bg-copper-tint text-copper-ink',
  'bg-info-tint text-info-ink',
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
