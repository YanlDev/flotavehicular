'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';

export default function Navbar({ onMenuClick, userEmail }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] shrink-0">

      {/* Boton menu (solo mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
        aria-label="Abrir menu"
      >
        <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
      </button>

      {/* Titulo — espacio central en mobile */}
      <span className="lg:hidden text-sm font-semibold text-[var(--color-text)]">
        Gestion de Flota
      </span>

      {/* Espacio izquierdo en desktop */}
      <div className="hidden lg:block" />

      {/* Usuario + cerrar sesion */}
      <div className="flex items-center gap-3">
        {userEmail && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5" />
            <span>{userEmail}</span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-status-critical)] transition-colors"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
          <span className="hidden sm:inline">Cerrar sesion</span>
        </button>
      </div>

    </header>
  );
}
