import {
  LayoutDashboard,
  Users,
  Tags,
  Package,
  BookOpen,
  ShoppingCart,
  HeartHandshake,
  Megaphone,
  CreditCard,
  UserCircle,
  Sparkles,
  BrainCircuit,
  Moon,
  BadgeCheck,
  Wallet,
  Flame,
  ClipboardList,
  CalendarDays,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  superuserOnly?: boolean;
};

/**
 * Single source of truth for route labels. The sidebar and the breadcrumb both
 * read this, so they can never disagree about what a section is called.
 */
export const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Books & eBooks', href: '/books', icon: BookOpen },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Donations', href: '/donations', icon: HeartHandshake },
  { name: 'Campaigns', href: '/donation-campaigns', icon: Megaphone },
  { name: 'Sadhana Services', href: '/sadhana-services', icon: Flame },
  { name: 'Service Bookings', href: '/service-bookings', icon: ClipboardList },
  { name: 'Service Batches', href: '/service-batches', icon: CalendarDays },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'AI Readings', href: '/ai-readings', icon: Sparkles },
  { name: 'AI Services', href: '/ai-services', icon: BrainCircuit },
  { name: 'Horoscope', href: '/horoscope', icon: Moon },
  { name: 'Network Members', href: '/trustees', icon: BadgeCheck },
  { name: 'Withdrawals', href: '/withdrawals', icon: Wallet },
  { name: 'Profile', href: '/profile', icon: UserCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

/** A path segment that is a record id rather than a section name. */
export function isIdSegment(segment: string): boolean {
  return UUID_RE.test(segment) || OBJECT_ID_RE.test(segment);
}

/**
 * Human label for a path segment. Prefers the sidebar's own wording — so
 * `/trustees` reads "Network Members", not "Trustees" — and falls back to
 * title-casing the slug.
 */
export function labelForSegment(segment: string): string {
  const match = navItems.find((item) => item.href === `/${segment}`);
  if (match) return match.name;
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
