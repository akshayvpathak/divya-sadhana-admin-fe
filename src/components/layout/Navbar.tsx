'use client';

import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, UserCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { pageHeaderAtom } from '@/store/page-header';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const pageHeader = useAtomValue(pageHeaderAtom);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/90 px-6 backdrop-blur-sm">
      {/* The page title lives here rather than in the page body — this strip was
          empty otherwise. Published by <PageHeader> via pageHeaderAtom. */}
      <div className="flex min-w-0 items-center gap-3">
        {pageHeader?.backHref && (
          <Link href={pageHeader.backHref} className="shrink-0">
            <Button
              variant="outline"
              size="icon"
              aria-label="Back"
              className="h-8 w-8 border-line bg-surface text-charcoal hover:border-gold/40 hover:bg-tint hover:text-gold-press"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        {pageHeader && (
          <h1 className="truncate text-lg font-bold tracking-tight text-ink sm:text-xl">
            {pageHeader.title}
          </h1>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full bg-cosmos hover:bg-tint"
              />
            }
          >
            <UserCircle className="h-6 w-6 text-charcoal" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none text-ink">
                    {user ? `${user.first_name} ${user.last_name}` : 'Admin User'}
                  </p>
                  <p className="text-[10px] leading-relaxed break-all text-moon">
                    {user?.email || 'admin@divyasadhana.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsLogoutModalOpen(true)}
              className="cursor-pointer text-danger focus:bg-danger-tint focus:text-danger-ink"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onOpenChange={setIsLogoutModalOpen}
        title="Logout Confirmation"
        description="Are you sure you want to log out of the admin panel?"
        onConfirm={logout}
        confirmText="Log out"
        variant="destructive"
      />
    </header>
  );
}
