'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Show the old navbar only on legacy pages that haven't been migrated to hub structure
  const showNavbar = pathname.startsWith('/journal') ||
                     pathname.startsWith('/aura') ||
                     pathname.startsWith('/friends') ||
                     pathname.startsWith('/groups') ||
                     pathname.startsWith('/squads') ||
                     pathname.startsWith('/aura-points') ||
                     pathname.startsWith('/profile') ||
                     pathname.startsWith('/settings') ||
                     pathname.startsWith('/soulchat') ||
                     pathname.startsWith('/toolkit') ||
                     pathname.startsWith('/recovery') ||
                     pathname.startsWith('/therapy-support');
  
  if (!showNavbar) {
    return null;
  }
  
  return <Navbar />;
}