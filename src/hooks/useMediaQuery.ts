'use client';

import { useEffect, useState } from 'react';

/**
 * `undefined` until the component has mounted, then the live match state.
 *
 * The tri-state matters: list pages run a paginated query on desktop and an
 * infinite query on mobile, and only one of them may ever be enabled. A plain
 * `false` default would fire the desktop request on every phone before the
 * effect corrected it.
 */
export function useMediaQuery(query: string): boolean | undefined {
  const [matches, setMatches] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const sync = () => setMatches(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, [query]);

  return matches;
}

/**
 * Below Tailwind's `lg` (1024px) the admin swaps data tables for cards and
 * pagination for infinite scroll. One breakpoint, declared once, so the JS and
 * the `lg:` utilities can never drift apart.
 */
export const COMPACT_QUERY = '(max-width: 1023.98px)';

/** Phone-sized: single-column cards, bottom sheets, full-width actions. */
export const PHONE_QUERY = '(max-width: 767.98px)';

/** `true` below 1024px — cards + infinite scroll. `undefined` before mount. */
export function useIsCompact(): boolean | undefined {
  return useMediaQuery(COMPACT_QUERY);
}

/** `true` below 768px. `undefined` before mount. */
export function useIsPhone(): boolean | undefined {
  return useMediaQuery(PHONE_QUERY);
}
