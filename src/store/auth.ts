import { atom } from 'jotai';

/** Desktop rail: expanded (w-64) vs icon-only (w-20). */
export const sidebarAtom = atom<boolean>(true);

/** Off-canvas navigation drawer, below `lg`. */
export const mobileNavAtom = atom<boolean>(false);
