'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  listUrlFor,
  markLeftList,
  rememberListScroll,
  rememberListUrl,
  takeListScroll,
} from '@/lib/list-view-memory';

/** The admin shell scrolls this element, not the window. See AdminLayout. */
export const ADMIN_SCROLL_ID = 'admin-scroll';

type Value = string | number;

function parseParams<T extends Record<string, Value>>(
  params: URLSearchParams,
  defaults: T
): T {
  const out = { ...defaults };
  (Object.keys(defaults) as (keyof T)[]).forEach((key) => {
    const raw = params.get(String(key));
    if (raw === null || raw === '') return;
    if (typeof defaults[key] === 'number') {
      const n = Number(raw);
      if (Number.isFinite(n)) out[key] = n as T[keyof T];
    } else {
      out[key] = raw as T[keyof T];
    }
  });
  return out;
}

/** Only what differs from the defaults, so an untouched list stays at a bare URL. */
function serialize<T extends Record<string, Value>>(values: T, defaults: T): string {
  const params = new URLSearchParams();
  (Object.keys(defaults) as (keyof T)[]).forEach((key) => {
    const value = values[key];
    if (value === defaults[key] || value === '' || value === undefined || value === null) return;
    params.set(String(key), String(value));
  });
  return params.toString();
}

function sameValues<T extends Record<string, Value>>(a: T, b: T): boolean {
  return (Object.keys(a) as (keyof T)[]).every((key) => a[key] === b[key]);
}

/**
 * List state — search, filters, sort, page — kept in the URL, plus the scroll
 * offset of the admin scroll container.
 *
 * Why: opening a record unmounts the list, so plain `useState` filters were
 * gone by the time you came back, and you landed at the top of page 1. Held in
 * the URL, the history entry carries the state, React Query still has the rows
 * cached, and the view returns as you left it. A filtered list also becomes
 * shareable, and survives a refresh.
 *
 * Returns `[values, patch, reset]`. `patch` merges, so a filter change that also
 * resets paging is one call: `patch({ status: 'paid', page: 1 })`.
 */
export function useListQueryState<T extends Record<string, Value>>(defaults: T) {
  const defaultsRef = useRef(defaults);
  const pathname = usePathname();
  const router = useRouter();
  // The router's copy of the query, not `window.location`: during a client
  // transition this component mounts before `window.location.search` catches
  // up, and reading it there returned an empty query — which was then written
  // back, wiping the filters the Back button had just restored.
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  // `defaults`, not the ref: initialisers run during render, where reading a
  // ref is off-limits. It runs once, so the two are the same value anyway.
  const [values, setValues] = useState<T>(() =>
    parseParams(new URLSearchParams(search), defaults)
  );

  // Adopt URL changes this hook did not make: back/forward, or a pasted link.
  // Adjusted during render rather than in an effect — React's documented way to
  // react to a changed external value, and it avoids the extra render pass (and
  // the visible flash of stale filters) that an effect would schedule.
  const [seenSearch, setSeenSearch] = useState(search);
  if (search !== seenSearch) {
    setSeenSearch(search);
    setValues((prev) => {
      const fromUrl = parseParams(new URLSearchParams(search), defaults);
      return sameValues(prev, fromUrl) ? prev : fromUrl;
    });
  }

  // Push local changes back out. `replace`, so tweaking a filter never becomes a
  // step the back button has to walk through — and `router.replace` rather than
  // `history.replaceState`, because the native call makes Next 16 remount this
  // segment, which resets `useIsCompact()` to `undefined`, disables both list
  // queries and leaves the table stuck on skeletons.
  useEffect(() => {
    const query = serialize(values, defaultsRef.current);
    const url = query ? `${pathname}?${query}` : pathname;
    rememberListUrl(pathname, url);
    if (query !== search) router.replace(url, { scroll: false });
  }, [values, search, pathname, router]);

  // Save the offset when the user clicks through to a record.
  //
  // Not on plain scroll: as the route changes the list unmounts, the container
  // shrinks, and the browser clamps scrollTop — firing one last scroll event
  // that overwrote the real position with a near-zero one. The click is the
  // moment that matters, and there the list is still at full height.
  useEffect(() => {
    const el = document.getElementById(ADMIN_SCROLL_ID);
    if (!el) return;
    const onClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('a[href]')) rememberListScroll(pathname, el.scrollTop);
    };
    el.addEventListener('click', onClick, true);
    return () => el.removeEventListener('click', onClick, true);
  }, [pathname]);

  // Restore it once the rows are actually back: cached or refetched, the list
  // has no height on the first frame, so scrolling straight away would land at
  // the bottom of an empty page.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const here = pathname + (search ? `?${search}` : '');
    const target = takeListScroll(pathname, here);
    if (!target) return;
    let frames = 0;
    const tick = () => {
      const el = document.getElementById(ADMIN_SCROLL_ID);
      if (el && el.scrollHeight - el.clientHeight >= target) {
        el.scrollTop = target;
        return;
      }
      // ~2s of frames, then give up rather than fight a list that shrank.
      if (frames++ < 120) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [pathname, search]);

  // A new result set starts at the top. Changing a filter or a page does not
  // remount this route, so without this the container keeps whatever offset the
  // previous list had — including when the sidebar link drops you back on an
  // unfiltered `/orders` from halfway down a filtered one. Mount is exempt:
  // that is the restore path above.
  const lastSearch = useRef(search);
  useEffect(() => {
    if (lastSearch.current === search) return;
    lastSearch.current = search;
    const el = document.getElementById(ADMIN_SCROLL_ID);
    if (el) el.scrollTop = 0;
  }, [search]);

  // On the way out, note which list we left, so only a genuine return restores.
  useEffect(() => () => markLeftList(pathname), [pathname]);

  const patch = useCallback((next: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...next }));
  }, []);

  const reset = useCallback(() => setValues(defaultsRef.current), []);

  return [values, patch, reset] as const;
}

export { listUrlFor };
