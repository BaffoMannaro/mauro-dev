'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/preventivi', label: 'Preventivi' },
  { href: '/preventivi/clienti', label: 'Clienti' },
  { href: '/preventivi/statistiche', label: 'Statistiche' },
  { href: '/preventivi/abbonamenti', label: 'Abbonamenti' },
];

type ThemeMode = 'auto' | 'dark' | 'light';

function applyTheme(mode: ThemeMode) {
  if (mode === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else if (mode === 'dark') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    // auto: follow system
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
}

function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('auto');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as ThemeMode | null;
    const initial: ThemeMode = stored === 'light' || stored === 'dark' ? stored : 'auto';
    setMode(initial);
    applyTheme(initial);

    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onSystemChange = () => {
      if ((localStorage.getItem('theme') ?? 'auto') === 'auto') applyTheme('auto');
    };
    mq.addEventListener('change', onSystemChange);
    return () => mq.removeEventListener('change', onSystemChange);
  }, []);

  const toggle = () => {
    const next: ThemeMode = mode === 'auto' ? 'dark' : mode === 'dark' ? 'light' : 'auto';
    setMode(next);
    if (next === 'auto') localStorage.removeItem('theme');
    else localStorage.setItem('theme', next);
    applyTheme(next);
  };

  const labels: Record<ThemeMode, string> = {
    auto:  'Sincronizzato',
    dark:  'Scuro',
    light: 'Chiaro',
  };

  return (
    <button
      onClick={toggle}
      title={`Tema: ${labels[mode]}`}
      className="flex items-center gap-1.5 px-2 h-8 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors"
    >
      {mode === 'auto' ? (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path strokeLinecap="round" d="M8 21h8M12 17v4"/>
        </svg>
      ) : mode === 'dark' ? (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75 9.75 9.75 0 018.25 6c0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 12c0 5.385 4.365 9.75 9.75 9.75 4.114 0 7.651-2.55 9.002-6.248z"/>
        </svg>
      ) : (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4"/>
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      )}
      <span className="text-xs hidden sm:block">{labels[mode]}</span>
    </button>
  );
}

export default function TopNav({ session }: { session: any }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Chiudi il menu mobile quando cambia pagina
  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === '/preventivi' ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="relative h-14 border-b border-edge bg-surface flex items-center px-4 md:px-6 gap-3 md:gap-6 shrink-0">
      {/* Brand */}
      <Link href="/preventivi" className="shrink-0 flex items-center md:mr-4">
        <img src="/Logo.svg" alt="MAURO DEV" className="h-7 w-auto logo-adaptive" />
      </Link>

      {/* Links desktop */}
      <div className="hidden md:flex items-center gap-1 flex-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-accent text-white'
                : 'text-muted hover:text-text hover:bg-surface2'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Spacer mobile */}
      <div className="flex-1 md:hidden" />

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-3">
        <ThemeToggle />
        <span className="text-dim text-xs hidden md:block">{session?.user?.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="hidden md:block text-xs text-dim hover:text-text transition-colors"
        >
          Esci
        </button>
        {/* Burger (solo mobile) */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Chiudi menu' : 'Apri menu'}
          aria-expanded={open}
          className="md:hidden flex items-center justify-center w-9 h-9 -mr-1 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors"
        >
          {open ? (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Dropdown mobile */}
      {open && (
        <>
          <div className="md:hidden fixed inset-0 top-14 bg-black/40 z-40" onClick={() => setOpen(false)} />
          <div className="md:hidden absolute top-full left-0 right-0 z-50 bg-surface border-b border-edge shadow-lg flex flex-col p-3 gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-accent text-white'
                    : 'text-muted hover:text-text hover:bg-surface2'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-edge/60 mt-2 pt-3 flex items-center justify-between gap-3">
              <span className="text-dim text-xs truncate">{session?.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="shrink-0 text-xs text-dim hover:text-text transition-colors"
              >
                Esci
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
