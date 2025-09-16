"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Route } from 'next';

const links: { href: Route; label: string }[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/journal', label: 'Journal' },
  { href: '/toolkit', label: 'Toolkit' },
  { href: '/friends', label: 'Friends' },
  { href: '/chat', label: 'Chat' },
  { href: '/community', label: 'Community' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/therapist', label: 'Therapist' },
  { href: '/settings', label: 'Settings' },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 overflow-x-auto">
      <ul className="flex items-center gap-2">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <li key={l.href} className="relative">
              <Link
                href={l.href}
                className={`relative block rounded-full px-4 py-2 text-sm transition-colors ${
                  active ? 'text-black' : 'text-[rgba(230,230,255,0.85)] hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan shadow-glow"
                  />
                )}
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

