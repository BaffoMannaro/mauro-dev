'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const NAV = [
  { href: '/preventivi', label: 'Preventivi' },
  { href: '/preventivi/statistiche', label: 'Statistiche' },
  { href: '/preventivi/abbonamenti', label: 'Abbonamenti' },
];

export default function TopNav({ session }: { session: any }) {
  const pathname = usePathname();

  return (
    <nav className="h-14 border-b border-edge bg-surface flex items-center px-6 gap-6 shrink-0">
      {/* Brand */}
      <Link href="/preventivi" className="mr-4 shrink-0 flex items-center">
        <Image src="/Logo.svg" alt="MAURO DEV" width={120} height={40} className="h-7 w-auto brightness-0 invert" />
      </Link>

      {/* Links */}
      <div className="flex items-center gap-1 flex-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-white hover:bg-surface2'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User */}
      <div className="flex items-center gap-4">
        <span className="text-dim text-xs hidden md:block">{session?.user?.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-xs text-dim hover:text-white transition-colors"
        >
          Esci
        </button>
      </div>
    </nav>
  );
}
