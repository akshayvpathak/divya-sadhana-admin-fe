'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAtomValue } from 'jotai';
import { sidebarAtom } from '@/store/auth';
import { Menu, UserCircle } from 'lucide-react';
import { useState } from 'react';
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
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const isID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) || /^[0-9a-f]{24}$/i.test(str);
    
    const filteredPaths = paths.filter(path => !isID(path));

    return filteredPaths.map((path, index) => {
      const isLast = index === filteredPaths.length - 1;
      const title = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      
      return (
        <div key={path} className="flex items-center">
          {index > 0 && <span className="mx-2 text-slate-400">/</span>}
          <span className={isLast ? "text-slate-900 font-medium" : "text-slate-500"}>
            {title}
          </span>
        </div>
      );
    });
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Mobile menu button could go here */}
        <div className="flex items-center text-sm">
          {generateBreadcrumbs()}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200" />}>
            <UserCircle className="h-6 w-6 text-slate-600" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none text-slate-900">{user ? `${user.first_name} ${user.last_name}` : 'Admin User'}</p>
                  <p className="text-[10px] text-slate-500 break-all leading-relaxed">
                    {user?.email || 'admin@divyasadhana.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setIsLogoutModalOpen(true)} 
              className="text-rose-600 cursor-pointer focus:bg-rose-50 focus:text-rose-700"
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
