// Where each list page was when you left it: the full URL (search, filters,
// page, sort) and how far down its scroll container you had got.
//
// This exists because opening a record and coming back used to drop you at the
// top of an unfiltered first page. The admin shell scrolls an inner <main>
// rather than the window, so the browser's own scroll restoration never
// applied, and the detail pages' Back button was a plain link to `/orders`,
// which threw the query string away.
//
// sessionStorage, not localStorage: this is "where I was just now", and it
// should not outlive the tab.

const VIEWS = 'admin:list-views';
const LEFT = 'admin:list-left';

interface View {
  /** Path + query, exactly as it should be restored. */
  url: string;
  /** Scroll offset of the admin scroll container. */
  y: number;
}

type Views = Record<string, View>;

// Every accessor is guarded: sessionStorage throws outright in some privacy
// modes, and a corrupt value must never take a page down with it.
function readAll(): Views {
  try {
    const raw = sessionStorage.getItem(VIEWS);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Views) : {};
  } catch {
    return {};
  }
}

function writeAll(views: Views) {
  try {
    sessionStorage.setItem(VIEWS, JSON.stringify(views));
  } catch {
    /* full or unavailable — losing the position is not worth an error */
  }
}

/**
 * Record the list URL for `path`. Changing the filters invalidates the stored
 * offset: row 40 of "all orders" is not row 40 of "paid orders".
 */
export function rememberListUrl(path: string, url: string) {
  const views = readAll();
  const prev = views[path];
  views[path] = { url, y: prev && prev.url === url ? prev.y : 0 };
  writeAll(views);
}

export function rememberListScroll(path: string, y: number) {
  const views = readAll();
  if (!views[path]) return;
  views[path].y = y;
  writeAll(views);
}

/** The URL a Back button should return to, or null if we never saw the list. */
export function listUrlFor(path: string): string | null {
  return readAll()[path]?.url ?? null;
}

/** Called as a list unmounts: "this is the page we just came from". */
export function markLeftList(path: string) {
  try {
    sessionStorage.setItem(LEFT, path);
  } catch {
    /* ignore */
  }
}

/**
 * The offset to restore, but only when we are arriving back at the very page we
 * just left, still on the same filters. Reaching a list any other way — the
 * sidebar, a fresh link — starts at the top, which is what you would expect.
 *
 * Consumes the marker, so one departure restores at most once.
 */
export function takeListScroll(path: string, url: string): number | null {
  let left: string | null = null;
  try {
    left = sessionStorage.getItem(LEFT);
  } catch {
    return null;
  }
  if (left !== path) return null;
  try {
    sessionStorage.removeItem(LEFT);
  } catch {
    /* ignore */
  }
  const view = readAll()[path];
  if (!view || view.url !== url || !view.y) return null;
  return view.y;
}
