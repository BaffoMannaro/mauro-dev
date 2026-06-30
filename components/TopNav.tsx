'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/preventivi', label: 'Preventivi' },
  { href: '/preventivi/statistiche', label: 'Statistiche' },
  { href: '/preventivi/abbonamenti', label: 'Abbonamenti' },
];

function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light') {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors"
    >
      {theme === 'dark' ? (
        /* Sun icon */
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4"/>
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        /* Moon icon */
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75 9.75 9.75 0 018.25 6c0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 12c0 5.385 4.365 9.75 9.75 9.75 4.114 0 7.651-2.55 9.002-6.248z"/>
        </svg>
      )}
    </button>
  );
}

export default function TopNav({ session }: { session: any }) {
  const pathname = usePathname();

  return (
    <nav className="h-14 border-b border-edge bg-surface flex items-center px-6 gap-6 shrink-0">
      {/* Brand */}
      <Link href="/preventivi" className="mr-4 shrink-0 flex items-center">
        <img src="/Logo.svg" alt="MAURO DEV" className="h-7 w-auto logo-adaptive" />
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
                  : 'text-muted hover:text-text hover:bg-surface2'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <span className="text-dim text-xs hidden md:block">{session?.user?.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-xs text-dim hover:text-text transition-colors"
        >
          Esci
        </button>
      </div>
    </nav>
  );
}
