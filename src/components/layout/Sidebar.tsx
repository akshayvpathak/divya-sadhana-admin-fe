'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAtom } from 'jotai';
import { cn } from '@/lib/utils';
import { mobileNavAtom, sidebarAtom } from '@/store/auth';
import { navItems } from '@/lib/nav';
import { ChevronLeft, Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { BrandLockup, BRAND_NAME } from '@/components/common/BrandMark';

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
}

/**
 * The nav list itself, shared by the desktop rail and the mobile drawer so the
 * two can never list different sections.
 *
 * `collapsed` only ever applies to the rail — the drawer is always labelled.
 */
function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="custom-scrollbar custom-scrollbar-dark flex-1 overflow-y-auto overscroll-contain py-3">
      <ul className="space-y-0.5 px-2.5">
        {navItems.map((item) => {
          const isActive = isItemActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  // px-3 is constant on purpose. Collapsed, the row is 43px wide
                  // and the padding leaves it centred on x=32 — the same centre
                  // line as the seal above and as the expanded rail. The hidden
                  // label contributes no gap, so nothing shifts on toggle.
                  //
                  // min-h-11 on the drawer: a 44px row is the smallest
                  // comfortable touch target.
                  'group relative flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  collapsed ? 'py-2.5' : 'min-h-11 py-2.5 lg:min-h-0',
                  isActive
                    // Amethyst on gold is 8.06:1 — the pill can carry real weight.
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_1px_8px_0_rgb(224_180_88_/_0.35)]'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className={cn('truncate transition-all', collapsed && 'hidden w-0 opacity-0')}>
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop rail. Hidden below `lg`, where <MobileNavTrigger> takes over. */
export default function Sidebar() {
  const [isOpen, setIsOpen] = useAtom(sidebarAtom);

  return (
    <aside
      className={cn(
        'relative z-20 hidden h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 lg:flex',
        // 64px collapsed is deliberate: it puts the icon column on the same
        // centre line (x=32) the expanded rail uses, so nothing slides sideways
        // while the width animates. See the header padding below.
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Pinned to the rail's outer edge and present in both states: at 64px wide
          there is no room for a chevron beside the seal, and a toggle hidden
          inside the collapsed rail is the one control users cannot find. */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={isOpen}
        title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        className="absolute -right-3.5 top-8 z-30 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-saffron/50 bg-saffron text-royal-deep shadow-[0_2px_10px_0_rgb(43_27_69_/_0.45)] transition-colors hover:bg-gold-soft hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 focus-visible:ring-offset-page"
      >
        <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', !isOpen && 'rotate-180')} />
      </button>

      {/* Padding is constant, not conditional: 14px + half of the 36px seal puts
          its centre at x=32 in both states, matching the nav icons below. The
          seal therefore never moves — only the wordmark comes and goes. */}
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-3.5">
        <Link href="/dashboard" className="min-w-0" aria-label={BRAND_NAME}>
          <BrandLockup size={36} tone="onDark" showWordmark={isOpen} priority />
        </Link>
      </div>

      <SidebarNav collapsed={!isOpen} />
    </aside>
  );
}

/**
 * The `lg`-and-below navigation: a hamburger in the top bar that opens the same
 * nav as an off-canvas drawer. Base UI's dialog supplies the focus trap, the
 * Escape handler and the body scroll lock; the pathname effect closes the drawer
 * once a destination has been chosen.
 */
export function MobileNavTrigger() {
  const [open, setOpen] = useAtom(mobileNavAtom);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation menu"
            className="-ml-1 h-10 w-10 shrink-0 text-charcoal hover:bg-tint hover:text-ink lg:hidden"
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>

      <SheetContent
        side="left"
        showCloseButton={false}
        className="border-sidebar-border bg-sidebar text-sidebar-foreground"
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          {/* Same lockup as the rail, so the drawer is branded identically. */}
          <SheetTitle className="min-w-0">
            <BrandLockup size={32} tone="onDark" />
          </SheetTitle>
          <SheetClose
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation menu"
                className="h-10 w-10 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
              />
            }
          >
            <X className="h-5 w-5" />
          </SheetClose>
        </div>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
