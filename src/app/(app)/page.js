import { createServerSupabaseClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTruck, faCheckCircle, faExclamationTriangle, faTimesCircle,
  faCircleQuestion, faArrowRight, faPlus, faTriangleExclamation,
  faFileCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { calcularSemaforo } from '@/lib/semaforo';

const DOC_LABEL = { soat: 'SOAT', citv: 'CITV', propiedad: 'Propiedad', seguro: 'Seguro', sat: 'SAT', sutran: 'SUTRAN' };
const DOCS_REQUERIDOS = ['soat', 'citv', 'propiedad'];

function docsPendientes(vehicleDocuments) {
  const docs = vehicleDocuments || [];
  return DOCS_REQUERIDOS.filter((tipo) => {
    const doc = docs.find((d) => d.tipo_documento === tipo);
    return !doc || !doc.vigente || doc.vigente === '' || doc.vigente === 'no';
  });
}

const ESTADO_CONFIG = {
  operativo:         { label: 'Operativo',          dot: 'bg-green-500',  bar: 'bg-green-500' },
  parcialmente:      { label: 'Parcialmente',        dot: 'bg-yellow-500', bar: 'bg-yellow-500' },
  fuera_de_servicio: { label: 'Fuera de servicio',   dot: 'bg-red-500',    bar: 'bg-red-500' },
};

async function getDashboardData() {
  const supabase = await createServerSupabaseClient();

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, placa, tipo, marca, modelo, estado, created_at, vehicle_documents(tipo_documento, fecha_vencimiento, vigente)')
    .order('created_at', { ascending: false });

  if (!vehicles) return { stats: {}, alertas: [], recientes: [], estadoFlota: {} };

  // Stats de estado operativo
  const estadoFlota = {
    operativo:         vehicles.filter((v) => v.estado === 'operativo').length,
    parcialmente:      vehicles.filter((v) => v.estado === 'parcialmente').length,
    fuera_de_servicio: vehicles.filter((v) => v.estado === 'fuera_de_servicio').length,
  };
  const total = vehicles.length;

  // Alertas documentales (vencidos o proximos a vencer en 45 dias)
  // SAT y SUTRAN no tienen fecha de vencimiento real — se excluyen de alertas de caducidad
  const DOCS_SIN_VENCIMIENTO = new Set(['sat', 'sutran']);
  const alertas = [];
  for (const v of vehicles) {
    for (const doc of v.vehicle_documents || []) {
      if (!doc.fecha_vencimiento) continue;
      if (DOCS_SIN_VENCIMIENTO.has(doc.tipo_documento)) continue;
      const { estado, diasRestantes } = calcularSemaforo(doc.fecha_vencimiento);
      if (estado === 'critical' || estado === 'alert') {
        alertas.push({
          placa: v.placa,
          tipo_documento: doc.tipo_documento,
          fecha_vencimiento: doc.fecha_vencimiento,
          estado,
          diasRestantes,
        });
      }
    }
  }
  alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);

  // Stats globales docs
  let docsCriticos = 0, docsAlerta = 0;
  for (const a of alertas) {
    if (a.estado === 'critical') docsCriticos++;
    else docsAlerta++;
  }

  return {
    stats: { total, docsCriticos, docsAlerta },
    alertas: alertas.slice(0, 8),
    recientes: vehicles.slice(0, 5),
    estadoFlota,
  };
}

export default async function DashboardPage() {
  const { stats, alertas, recientes, estadoFlota } = await getDashboardData();
  const total = stats.total || 0;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">

      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Dashboard</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Estado general de la flota — Juliaca
        </p>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total unidades"
          value={total}
          icon={faTruck}
          iconColor="text-[var(--color-primary)]"
          bg="bg-[var(--color-primary)]/8"
        />
        <StatCard
          label="Operativos"
          value={estadoFlota.operativo || 0}
          icon={faCheckCircle}
          iconColor="text-green-600"
          bg="bg-green-50"
        />
        <StatCard
          label="Docs en alerta"
          value={stats.docsAlerta || 0}
          icon={faExclamationTriangle}
          iconColor="text-yellow-600"
          bg="bg-yellow-50"
        />
        <StatCard
          label="Docs criticos"
          value={stats.docsCriticos || 0}
          icon={faTimesCircle}
          iconColor="text-red-600"
          bg="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Estado operativo de flota */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Estado operativo</p>
            <Link href="/flota" className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
              Ver flota <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </Link>
          </div>
          {total === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">Sin unidades registradas</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => {
                const count = estadoFlota[key] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={key} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span className="text-[var(--color-text-secondary)]">{cfg.label}</span>
                      </div>
                      <span className="font-semibold text-[var(--color-text)]">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-border)]">
                      <div
                        className={`h-2 rounded-full transition-all ${cfg.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ultimas unidades registradas */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Ultimas unidades</p>
            <Link href="/flota/nueva" className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Nueva
            </Link>
          </div>
          {recientes.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">Sin unidades registradas</p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--color-border)]">
              {recientes.map((v) => {
                const cfg = ESTADO_CONFIG[v.estado] || ESTADO_CONFIG.operativo;
                const pendientes = docsPendientes(v.vehicle_documents);
                return (
                  <Link
                    key={v.id}
                    href={`/flota/${v.placa}`}
                    className="flex items-center justify-between py-2.5 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                      <div>
                        <p className="text-sm font-mono font-bold text-[var(--color-text)]">{v.placa}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {[v.marca, v.modelo].filter(Boolean).join(' ') || v.tipo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pendientes.length > 0 && (
                        <div className="relative group/docs">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 cursor-default">
                            Pendiente
                          </span>
                          <div className="absolute right-0 bottom-full mb-1.5 z-20 invisible group-hover/docs:visible pointer-events-none">
                            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg p-2.5 min-w-max">
                              <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Docs. pendientes:</p>
                              {pendientes.map((tipo) => (
                                <p key={tipo} className="text-xs text-[var(--color-text)]">· {DOC_LABEL[tipo]}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {new Date(v.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Alertas documentales */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <FontAwesomeIcon icon={faFileCircleExclamation} className="w-4 h-4 text-[var(--color-status-critical)]" />
          <p className="text-sm font-semibold text-[var(--color-text)]">Alertas documentales</p>
          {alertas.length > 0 && (
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {alertas.length} pendiente{alertas.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {alertas.length === 0 ? (
          <div className="flex items-center gap-2 py-4 justify-center text-[var(--color-text-muted)]">
            <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-500" />
            <p className="text-sm">Todos los documentos estan al dia</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left pb-2 font-semibold text-[var(--color-text-secondary)] text-xs uppercase tracking-wide">Placa</th>
                  <th className="text-left pb-2 font-semibold text-[var(--color-text-secondary)] text-xs uppercase tracking-wide">Documento</th>
                  <th className="text-left pb-2 font-semibold text-[var(--color-text-secondary)] text-xs uppercase tracking-wide">Vencimiento</th>
                  <th className="text-left pb-2 font-semibold text-[var(--color-text-secondary)] text-xs uppercase tracking-wide">Estado</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {alertas.map((a, i) => (
                  <tr key={i} className="hover:bg-[var(--color-surface-alt)] transition-colors">
                    <td className="py-2.5 pr-4">
                      <span className="font-mono font-bold text-[var(--color-text)]">{a.placa}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-[var(--color-text-secondary)]">
                      {DOC_LABEL[a.tipo_documento] || a.tipo_documento}
                    </td>
                    <td className="py-2.5 pr-4 text-[var(--color-text-secondary)]">
                      {new Date(a.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-PE')}
                    </td>
                    <td className="py-2.5 pr-4">
                      {a.estado === 'critical' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          <FontAwesomeIcon icon={faTriangleExclamation} className="w-3 h-3" />
                          {a.diasRestantes < 0 ? 'Vencido' : `${a.diasRestantes}d`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                          <FontAwesomeIcon icon={faExclamationTriangle} className="w-3 h-3" />
                          {a.diasRestantes}d
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <Link href={`/flota/${a.placa}`} className="text-xs text-[var(--color-primary)] hover:underline">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

function StatCard({ label, value, icon, iconColor, bg }) {
  return (
    <div className={`${bg} rounded-xl p-4 flex flex-col gap-3 border border-transparent`}>
      <FontAwesomeIcon icon={icon} className={`w-5 h-5 ${iconColor}`} />
      <div>
        <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  );
}
