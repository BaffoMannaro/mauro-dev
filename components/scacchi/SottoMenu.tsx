'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const VOCI = [
  { href: '/scacchi', label: 'Partite' },
  { href: '/scacchi/gioca', label: 'Gioca' },
  { href: '/scacchi/aperture', label: 'Repertorio' },
  { href: '/scacchi/puzzle', label: 'Puzzle' },
  { href: '/scacchi/finali', label: 'Finali' },
  { href: '/scacchi/statistiche', label: 'Statistiche' },
  { href: '/scacchi/coach', label: 'Coach' },
];

export default function SottoMenu() {
  const p = (usePathname() ?? '').replace(/^\/preventivi/, '');
  const attiva = (h: string) => (h === '/scacchi' ? p === '/scacchi' || p.startsWith('/scacchi/partita') : p.startsWith(h));
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-[#3c3a37] bg-[#262421] px-3 md:px-5">
      {VOCI.map((v) => (
        <Link
          key={v.href}
          href={v.href}
          className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold ${attiva(v.href) ? 'border-[#81b64c] text-white' : 'border-transparent text-[#8b8987] hover:text-white'}`}
        >
          {v.label}
        </Link>
      ))}
    </nav>
  );
}
