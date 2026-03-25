import { createServerSupabaseClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft, faPenToSquare, faIdCard,
  faPhone, faCakeCandles, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { calcularSemaforo, SEMAFORO_CLASES } from '@/lib/semaforo';
import DeleteConductorButton from './DeleteConductorButton';

const ESTADO_BADGE = {
  activo:     { label: 'Activo',     style: 'bg-green-100 text-green-700' },
  inactivo:   { label: 'Inactivo',   style: 'bg-slate-100 text-slate-600' },
  suspendido: { label: 'Suspendido', style: 'bg-red-100 text-red-700' },
};

const CAT_DESC = {
  'B-I':    'B-I — Triciclos transporte publico',
  'B-IIa':  'B-IIa — Bicimotos',
  'B-IIb':  'B-IIb — Bicimotos y motocicletas',
  'B-IIc':  'B-IIc — B-IIb + Mototaxis y trimotos',
  'A-I':    'A-I — Autos, SUV, pickup, furgones',
  'A-IIa':  'A-IIa — A-I + taxis, buses, ambulancias',
  'A-IIb':  'A-IIb — A-IIa + microbuses y minibuses',
  'A-IIIa': 'A-IIIa — A-IIb + omnibuses urbanos e interurbanos',
  'A-IIIb': 'A-IIIb — A-IIb + volquetes, gruas, remolques',
  'A-IIIc': 'A-IIIc — Todas las categorias anteriores',
};

export default async function FichaConductorPage({ params }) {
  const { dni } = await params;
  const supabase = await createServerSupabaseClient();

  // Buscar por DNI o por ID (UUID)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(dni);
  const { data: conductor } = await supabase
    .from('conductors')
    .select('*')
    .eq(isUUID ? 'id' : 'dni', decodeURIComponent(dni))
    .single();

  if (!conductor) notFound();

  const sem    = calcularSemaforo(conductor.licencia_vencimiento);
  const semCls = SEMAFORO_CLASES[sem.estado];
  const badge  = ESTADO_BADGE[conductor.estado] || ESTADO_BADGE.activo;

  const edad = conductor.fecha_nacimiento
    ? Math.floor((new Date() - new Date(conductor.fecha_nacimiento)) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">

      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/conductores" className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">
              {conductor.apellidos}, {conductor.nombres}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-sm text-[var(--color-text-secondary)]">DNI {conductor.dni}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.style}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/conductores/${conductor.dni || conductor.id}/editar`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
            Editar
          </Link>
          <DeleteConductorButton id={conductor.id} nombre={`${conductor.nombres} ${conductor.apellidos}`} />
        </div>
      </div>

      {/* Datos personales */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">
          Datos personales
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DataRow icon={faIdCard} label="DNI" value={conductor.dni || '—'} mono />
          <DataRow icon={faPhone} label="Telefono" value={conductor.telefono || '—'} />
          <DataRow
            icon={faCakeCandles}
            label="Fecha de nacimiento"
            value={conductor.fecha_nacimiento
              ? `${new Date(conductor.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-PE')}${edad ? ` (${edad} años)` : ''}`
              : '—'
            }
          />
        </div>
        {conductor.observaciones && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Observaciones</p>
            <p className="text-sm text-[var(--color-text)]">{conductor.observaciones}</p>
          </div>
        )}
      </div>

      {/* Brevete */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">
          Brevete / Licencia de conducir
        </p>

        {!conductor.numero_licencia && !conductor.licencia_categoria && !conductor.licencia_vencimiento ? (
          <p className="text-sm text-[var(--color-text-muted)]">Sin datos de brevete registrados</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">N° de brevete</p>
                <p className="font-mono font-semibold text-[var(--color-text)]">
                  {conductor.numero_licencia || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Categoria</p>
                <p className="text-sm text-[var(--color-text)]">
                  {conductor.licencia_categoria ? (CAT_DESC[conductor.licencia_categoria] || conductor.licencia_categoria) : '—'}
                </p>
              </div>
            </div>

            {conductor.licencia_vencimiento && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                <div className={`w-3 h-3 rounded-full shrink-0 ${semCls.bg}`} />
                <div className="flex-1">
                  <p className="text-xs text-[var(--color-text-muted)]">Vencimiento</p>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {new Date(conductor.licencia_vencimiento + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full text-white ${semCls.bg}`}>
                  {sem.estado === 'critical' && sem.diasRestantes < 0
                    ? 'Vencido'
                    : sem.estado === 'ok'
                    ? 'Vigente'
                    : `${sem.diasRestantes} dias`
                  }
                </span>
                {sem.estado !== 'ok' && (
                  <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 text-[var(--color-status-critical)]" />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Registro */}
      <div className="px-1 pb-4">
        <p className="text-xs text-[var(--color-text-muted)]">
          Registrado el {new Date(conductor.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
          {conductor.updated_at && conductor.updated_at !== conductor.created_at &&
            ` — Actualizado el ${new Date(conductor.updated_at).toLocaleDateString('es-PE')}`
          }
        </p>
      </div>

    </div>
  );
}

function DataRow({ icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-2.5">
      <FontAwesomeIcon icon={icon} className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        <p className={`text-sm text-[var(--color-text)] ${mono ? 'font-mono font-semibold' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
