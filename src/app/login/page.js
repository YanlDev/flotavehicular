'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Correo o contraseña incorrectos.');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/logo-selcosi.png"
            alt="SELCOSI EXPORT S.A.C."
            className="h-16 sm:h-20 w-auto object-contain"
          />
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface)] rounded-2xl shadow-lg px-6 py-8 sm:px-8">

          <h1 className="text-xl font-semibold text-[var(--color-text)] mb-1">
            Iniciar sesion
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Sistema de gestion de flota vehicular
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                Correo electronico
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
                  <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="correo@empresa.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                Contrasena
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-[var(--color-status-critical)] bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-light)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
          SELCOSI EXPORT S.A.C. — Uso interno
        </p>
      </div>
    </div>
  );
}
