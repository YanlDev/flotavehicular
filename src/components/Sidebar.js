'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faTruck,
  faUsers,
  faTimes,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';

const NAV_ITEMS = [
  { href: '/',            icon: faTachometerAlt, label: 'Dashboard' },
  { href: '/flota',       icon: faTruck,         label: 'Flota vehicular' },
  { href: '/conductores', icon: faUsers,         label: 'Conductores' },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed top-0 left-0 z-30 h-full w-64 flex flex-col',
          'bg-[var(--color-primary)] text-white',
          'transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="relative flex flex-col items-center px-5 pt-6 pb-5 border-b border-white/10">
          <img
            src="/logo-selcosi.png"
            alt="SELCOSI"
            className="h-20 w-auto object-contain rounded-xl bg-white px-3 py-2"
          />
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 p-1 rounded text-white/60 hover:text-white"
          >
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
          </button>
        </div>

        {/* Navegacion */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, icon, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                <FontAwesomeIcon icon={icon} className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Atajo nueva unidad */}
        <div className="px-3 pb-5">
          <Link
            href="/flota/nueva"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white text-sm font-semibold transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            Nueva unidad
          </Link>
        </div>
      </aside>
    </>
  );
}
