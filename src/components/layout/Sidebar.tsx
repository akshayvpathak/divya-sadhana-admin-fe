'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAtom } from 'jotai';
import { cn } from '@/lib/utils';
import { sidebarAtom } from '@/store/auth';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Tags, 
  Package, 
  ChevronLeft,
  ShoppingCart,
  HeartHandshake,
  Megaphone,
  CreditCard,
  UserCircle,
  Sparkles,
  BadgeCheck,
  MapPinned
} from 'lucide-react';
import { Button } from '../ui/button';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Donations', href: '/donations', icon: HeartHandshake },
  { name: 'Campaigns', href: '/donation-campaigns', icon: Megaphone },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'AI Readings', href: '/ai-readings', icon: Sparkles },
  { name: 'Trustees', href: '/trustees', icon: BadgeCheck },
  { name: 'Territory', href: '/territory', icon: MapPinned },
  { name: 'Profile', href: '/profile', icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useAtom(sidebarAtom);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-slate-900 text-slate-100 transition-all duration-300 z-20 border-r border-slate-800",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className="flex items-center justify-between p-4 h-16 border-b border-slate-800">
        <span className={cn("font-bold text-xl truncate transition-all", isOpen ? "block" : "hidden")}>
          Admin Panel
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform", !isOpen && "rotate-180")} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group",
                    isActive 
                      ? "bg-indigo-600 text-white" 
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                  title={!isOpen ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className={cn("truncate transition-all", isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
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
