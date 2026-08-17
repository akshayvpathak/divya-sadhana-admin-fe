import { atom } from 'jotai';
import type { ReactNode } from 'react';

/**
 * The current page's title block, published by <PageHeader> and rendered by
 * <Navbar> in the top bar.
 *
 * Why an atom and not a prop: <Navbar> lives in AdminLayout, above the routed
 * page, so there is no way to pass it down. Publishing from PageHeader keeps all
 * 34 pages declaring their title exactly where they already did — none of them
 * needed to change when the title moved into the header.
 */
export interface PageHeaderState {
  title: ReactNode;
  /** Present on detail pages; renders the back button beside the title. */
  backHref?: string;
}

export const pageHeaderAtom = atom<PageHeaderState | null>(null);
