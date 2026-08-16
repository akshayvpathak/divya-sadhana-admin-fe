'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAtom } from 'jotai';
import { cn } from '@/lib/utils';
import { sidebarAtom } from '@/store/auth';
import { navItems } from '@/lib/nav';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useAtom(sidebarAtom);

  return (
    <aside
      className={cn(
        'relative z-20 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        isOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <span
          className={cn(
            'truncate text-lg font-bold tracking-tight text-white transition-all',
            isOpen ? 'block' : 'hidden'
          )}
        >
          Divya <span className="text-saffron">Sadhana</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
        >
          <ChevronLeft className={cn('h-5 w-5 transition-transform', !isOpen && 'rotate-180')} />
        </Button>
      </div>

      <nav className="custom-scrollbar custom-scrollbar-dark flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      // Ink on saffron is 8.3:1 — the pill can carry real weight.
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_1px_8px_0_rgb(255_153_51_/_0.35)]'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white'
                  )}
                  title={!isOpen ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span
                    className={cn(
                      'truncate transition-all',
                      isOpen ? 'w-auto opacity-100' : 'hidden w-0 opacity-0'
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
