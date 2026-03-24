import { createServerSupabaseClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTruck,
  faCircleCheck,
  faTriangleExclamation,
  faCircleXmark,
  faCircleQuestion,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { calcularSemaforo } from '@/lib/semaforo';

async function getStats() {
  const supabase = await createServerSupabaseClient();

  const { data: vehiculos } = await supabase
    .from('vehicles')
    .select('id, estado, vehicle_documents(tipo_documento, fecha_vencimiento)');

  if (!vehiculos) return { total: 0, operativas: 0, criticas: 0, alerta: 0, sinDatos: 0 };

  let criticas = 0;
  let alerta = 0;
  let sinDatos = 0;
  let operativas = 0;

  for (const v of vehiculos) {
    const docs = v.vehicle_documents || [];
    if (docs.length === 0) { sinDatos++; continue; }

    let peorEstado = 'ok';
    const prioridad = { critical: 0, alert: 1, nodata: 2, ok: 3 };

    for (const doc of docs) {
      const { estado } = calcularSemaforo(doc.fecha_vencimiento);
      if (prioridad[estado] < prioridad[peorEstado]) peorEstado = estado;
    }

    if (peorEstado === 'critical') criticas++;
    else if (peorEstado === 'alert') alerta++;
    else if (peorEstado === 'nodata') sinDatos++;
    else operativas++;
  }

  return { total: vehiculos.length, operativas, criticas, alerta, sinDatos };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    {
      label: 'Total unidades',
      value: stats.total,
      icon: faTruck,
      color: 'var(--color-primary)',
      bg: 'bg-[var(--color-primary)]/10',
    },
    {
      label: 'Documentos vigentes',
      value: stats.operativas,
      icon: faCircleCheck,
      color: 'var(--color-status-ok)',
      bg: 'bg-green-50',
    },
    {
      label: 'En alerta',
      value: stats.alerta,
      icon: faTriangleExclamation,
      color: 'var(--color-status-alert)',
      bg: 'bg-amber-50',
    },
    {
      label: 'Criticos / Vencidos',
      value: stats.criticas,
      icon: faCircleXmark,
      color: 'var(--color-status-critical)',
      bg: 'bg-red-50',
    },
    {
      label: 'Sin documentos',
      value: stats.sinDatos,
      icon: faCircleQuestion,
      color: 'var(--color-status-nodata)',
      bg: 'bg-slate-100',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Dashboard</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Resumen del estado de la flota vehicular
        </p>
      </div>

      {/* Cards de estadisticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-xl p-4 flex flex-col gap-3`}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${card.color}20` }}
            >
              <FontAwesomeIcon
                icon={card.icon}
                className="w-4 h-4"
                style={{ color: card.color }}
              />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)]">{card.value}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-tight">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Acceso rapido */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">
          Acceso rapido
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/flota"
            className="flex items-center justify-between px-4 py-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faTruck} className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-sm font-medium text-[var(--color-text)]">Ver toda la flota</span>
            </div>
            <FontAwesomeIcon
              icon={faArrowRight}
              className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors"
            />
          </Link>

          <Link
            href="/flota/nueva"
            className="flex items-center justify-between px-4 py-3 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors group"
          >
            <span className="text-sm font-medium text-white">Registrar nueva unidad</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
