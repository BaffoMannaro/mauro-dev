'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const NAV = [
  {
    href: '/preventivi',
    label: 'Preventivi',
    icon: 'docs',
  },
  {
    href: '/preventivi/statistiche',
    label: 'Statistiche',
    icon: 'chart',
  },
  {
    href: '/preventivi/abbonamenti',
    label: 'Abbonamenti',
    icon: 'sub',
  },
];

export default function Sidebar({ session }: { session: any }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-800 flex flex-col min-h-screen">
      <div className="px-5 py-5 border-b border-zinc-800">
        <p className="text-zinc-400 text-xs font-mono">maurodev.it</p>
        <p className="text-white font-semibold mt-0.5">Gestionale</p>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-white text-zinc-900 font-medium'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-zinc-800">
        <p className="text-zinc-600 text-xs truncate mb-2">{session?.user?.email}</p>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-xs text-zinc-500 hover:text-white transition-colors"
        >
          Esci
        </button>
      </div>
    </aside>
  );
}
