'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTruck, faCheckCircle, faExclamationTriangle,
  faTimesCircle, faSearch, faFilter, faFileExport,
} from '@fortawesome/free-solid-svg-icons';

const ESTADO_CONFIG = {
  operativo:       { label: 'Operativo',         color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  parcialmente:    { label: 'Parcialmente',       color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  fuera_de_servicio: { label: 'Fuera de servicio', color: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
};

const TIPO_LABEL = {
  moto: 'Moto', auto: 'Auto', camioneta: 'Camioneta', vehiculo_pesado: 'Vehiculo pesado',
};

export default function FlotaPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then((data) => { setVehicles(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = vehicles.filter((v) => {
    const matchSearch = !search ||
      v.placa?.toLowerCase().includes(search.toLowerCase()) ||
      v.marca?.toLowerCase().includes(search.toLowerCase()) ||
      v.modelo?.toLowerCase().includes(search.toLowerCase()) ||
      v.conductor?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filtroEstado || v.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const totales = {
    total:           vehicles.length,
    operativo:       vehicles.filter((v) => v.estado === 'operativo').length,
    parcialmente:    vehicles.filter((v) => v.estado === 'parcialmente').length,
    fuera_de_servicio: vehicles.filter((v) => v.estado === 'fuera_de_servicio').length,
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Flota vehicular</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Juliaca — {vehicles.length} unidad{vehicles.length !== 1 ? 'es' : ''} registrada{vehicles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/flota/nueva"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-light)] transition-colors self-start sm:self-auto"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          Nueva unidad
        </Link>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Total"
          value={totales.total}
          icon={faTruck}
          iconClass="text-[var(--color-primary)]"
          active={filtroEstado === ''}
          onClick={() => setFiltroEstado('')}
        />
        <SummaryCard
          label="Operativos"
          value={totales.operativo}
          icon={faCheckCircle}
          iconClass="text-green-600"
          active={filtroEstado === 'operativo'}
          onClick={() => setFiltroEstado(filtroEstado === 'operativo' ? '' : 'operativo')}
        />
        <SummaryCard
          label="Parcialmente"
          value={totales.parcialmente}
          icon={faExclamationTriangle}
          iconClass="text-yellow-600"
          active={filtroEstado === 'parcialmente'}
          onClick={() => setFiltroEstado(filtroEstado === 'parcialmente' ? '' : 'parcialmente')}
        />
        <SummaryCard
          label="Fuera de servicio"
          value={totales.fuera_de_servicio}
          icon={faTimesCircle}
          iconClass="text-red-600"
          active={filtroEstado === 'fuera_de_servicio'}
          onClick={() => setFiltroEstado(filtroEstado === 'fuera_de_servicio' ? '' : 'fuera_de_servicio')}
        />
      </div>

      {/* Buscador */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por placa, marca, modelo o conductor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">Todos los estados</option>
          <option value="operativo">Operativo</option>
          <option value="parcialmente">Parcialmente</option>
          <option value="fuera_de_servicio">Fuera de servicio</option>
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--color-text-muted)]">
          <span className="text-sm">Cargando flota...</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasVehicles={vehicles.length > 0} />
      ) : (
        <>
          {/* Vista tabla — desktop */}
          <div className="hidden sm:block bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Placa</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Tipo / Marca</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">KM</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Conductor</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Documentos</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((v) => (
                  <VehicleRow key={v.id} vehicle={v} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista tarjetas — mobile */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Fila de tabla (desktop) ───────────────────────────────────────
function VehicleRow({ vehicle: v }) {
  const estado = ESTADO_CONFIG[v.estado] || ESTADO_CONFIG.operativo;
  const docs = v.vehicle_documents || [];
  const vencidos = docs.filter((d) => d.vigente === 'vencido').length;
  const pendientes = docs.filter((d) => !d.vigente).length;

  return (
    <tr className="hover:bg-[var(--color-surface-alt)] transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono font-bold text-[var(--color-text)]">{v.placa}</span>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-[var(--color-text)]">
          {TIPO_LABEL[v.tipo] || v.tipo}
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">
          {[v.marca, v.modelo, v.anio].filter(Boolean).join(' · ')}
        </div>
      </td>
      <td className="px-4 py-3 text-[var(--color-text-secondary)]">
        {v.km_actuales ? v.km_actuales.toLocaleString('es-PE') + ' km' : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="text-[var(--color-text)]">{v.conductor || '—'}</div>
        {v.conductor_tel && (
          <div className="text-xs text-[var(--color-text-muted)]">{v.conductor_tel}</div>
        )}
      </td>
      <td className="px-4 py-3">
        {vencidos > 0 ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            {vencidos} vencido{vencidos > 1 ? 's' : ''}
          </span>
        ) : pendientes > 0 ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
            Pendiente
          </span>
        ) : (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            Al dia
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${estado.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
          {estado.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/flota/${v.placa}`}
          className="text-xs font-medium text-[var(--color-primary)] hover:underline"
        >
          Ver ficha
        </Link>
      </td>
    </tr>
  );
}

// ─── Tarjeta mobile ────────────────────────────────────────────────
function VehicleCard({ vehicle: v }) {
  const estado = ESTADO_CONFIG[v.estado] || ESTADO_CONFIG.operativo;
  return (
    <Link href={`/flota/${v.placa}`} className="block bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 hover:border-[var(--color-primary)] transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono font-bold text-lg text-[var(--color-text)]">{v.placa}</span>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${estado.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
          {estado.label}
        </span>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {[TIPO_LABEL[v.tipo], v.marca, v.modelo, v.anio].filter(Boolean).join(' · ')}
      </p>
      {v.conductor && (
        <p className="text-xs text-[var(--color-text-muted)] mt-1">{v.conductor}</p>
      )}
    </Link>
  );
}

// ─── Tarjeta de resumen ────────────────────────────────────────────
function SummaryCard({ label, value, icon, iconClass, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex flex-col gap-2 p-4 rounded-xl border text-left transition-all',
        active
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50',
      ].join(' ')}
    >
      <FontAwesomeIcon icon={icon} className={`w-5 h-5 ${iconClass}`} />
      <div>
        <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      </div>
    </button>
  );
}

// ─── Estado vacio ──────────────────────────────────────────────────
function EmptyState({ hasVehicles }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <FontAwesomeIcon icon={faTruck} className="w-12 h-12 text-[var(--color-border)]" />
      <div>
        <p className="font-semibold text-[var(--color-text)]">
          {hasVehicles ? 'Sin resultados' : 'No hay unidades registradas'}
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {hasVehicles ? 'Intenta con otros filtros de busqueda.' : 'Comienza registrando la primera unidad de la flota.'}
        </p>
      </div>
      {!hasVehicles && (
        <Link
          href="/flota/nueva"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          Registrar primera unidad
        </Link>
      )}
    </div>
  );
}
