import { createServerSupabaseClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus, faIdCard, faTriangleExclamation,
  faCheckCircle, faTimesCircle, faCircleQuestion,
} from '@fortawesome/free-solid-svg-icons';
import { calcularSemaforo, SEMAFORO_CLASES } from '@/lib/semaforo';

const ESTADO_CONFIG = {
  activo:     { label: 'Activo',     dot: 'bg-green-500' },
  inactivo:   { label: 'Inactivo',   dot: 'bg-slate-400' },
  suspendido: { label: 'Suspendido', dot: 'bg-red-500' },
};

const CAT_LABEL = {
  'A-I':   'A-I',
  'A-IIA': 'A-IIA',
  'A-IIB': 'A-IIB',
  'B-IIB': 'B-IIB',
};

export default async function ConductoresPage() {
  const supabase = await createServerSupabaseClient();
  const { data: conductors } = await supabase
    .from('conductors')
    .select('*')
    .order('apellidos', { ascending: true });

  const list = conductors || [];

  const total     = list.length;
  const activos   = list.filter((c) => c.estado === 'activo').length;
  let criticos = 0, alertas = 0;
  for (const c of list) {
    const { estado } = calcularSemaforo(c.licencia_vencimiento);
    if (estado === 'critical') criticos++;
    else if (estado === 'alert') alertas++;
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Conductores</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Registro de conductores — SELCOSI XPORT S.A.C.
          </p>
        </div>
        <Link
          href="/conductores/nuevo"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
        >
          <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" />
          Nuevo conductor
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total conductores', value: total,   icon: faIdCard,             color: 'text-[var(--color-primary)]',  bg: 'bg-[var(--color-primary)]/8' },
          { label: 'Activos',           value: activos, icon: faCheckCircle,         color: 'text-green-600',               bg: 'bg-green-50' },
          { label: 'Brevetes en alerta', value: alertas, icon: faTriangleExclamation, color: 'text-yellow-600',              bg: 'bg-yellow-50' },
          { label: 'Brevetes criticos', value: criticos, icon: faTimesCircle,         color: 'text-red-600',                 bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 flex flex-col gap-3`}>
            <FontAwesomeIcon icon={s.icon} className={`w-5 h-5 ${s.color}`} />
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)]">{s.value}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-text-muted)]">
            <FontAwesomeIcon icon={faCircleQuestion} className="w-8 h-8" />
            <p className="text-sm">No hay conductores registrados</p>
            <Link href="/conductores/nuevo" className="text-sm text-[var(--color-primary)] hover:underline">
              Registrar el primer conductor
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                <tr>
                  {['Conductor', 'DNI', 'Telefono', 'Brevete', 'Venc. brevete', 'Estado', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {list.map((c) => {
                  const sem = calcularSemaforo(c.licencia_vencimiento);
                  const semCls = SEMAFORO_CLASES[sem.estado];
                  const estadoCfg = ESTADO_CONFIG[c.estado] || ESTADO_CONFIG.activo;
                  return (
                    <tr key={c.id} className="hover:bg-[var(--color-surface-alt)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${estadoCfg.dot}`} />
                          <div>
                            <p className="font-semibold text-[var(--color-text)]">
                              {c.apellidos} {c.nombres}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--color-text-secondary)]">
                        {c.dni || '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                        {c.telefono || '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                        {c.licencia_categoria ? (
                          <span className="px-2 py-0.5 rounded-md bg-[var(--color-border)] text-xs font-medium">
                            {CAT_LABEL[c.licencia_categoria] || c.licencia_categoria}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {c.licencia_vencimiento ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white ${semCls.bg}`}>
                            {sem.estado !== 'ok' && <FontAwesomeIcon icon={faTriangleExclamation} className="w-3 h-3" />}
                            {new Date(c.licencia_vencimiento + 'T00:00:00').toLocaleDateString('es-PE')}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">Sin fecha</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full`}
                          style={{ background: c.estado === 'activo' ? '#dcfce7' : c.estado === 'suspendido' ? '#fee2e2' : '#f1f5f9',
                                   color:      c.estado === 'activo' ? '#166534' : c.estado === 'suspendido' ? '#991b1b' : '#475569' }}>
                          {estadoCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/conductores/${c.dni || c.id}`}
                          className="text-xs text-[var(--color-primary)] hover:underline font-medium"
                        >
                          Ver ficha
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
