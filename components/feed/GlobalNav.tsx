'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/feed', label: 'Feed' },
  { href: '/create-tool', label: 'Create' },
  { href: '/dashboard', label: 'My Tools' },
];

export default function GlobalNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden sm:flex items-center gap-1">
      {NAV_LINKS.map((link) => {
        const isActive =
          pathname === link.href || (link.href !== '/feed' && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'text-white bg-white/[0.08]'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
