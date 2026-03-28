'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTruck, faCheckCircle, faExclamationTriangle,
  faTimesCircle, faSearch, faUser, faGaugeHigh,
  faLocationDot, faWifi, faFileCircleXmark,
} from '@fortawesome/free-solid-svg-icons';
import { calcularSemaforo } from '@/lib/semaforo';

const ESTADO_CONFIG = {
  operativo:         { label: 'Operativo',         color: 'bg-green-100 text-green-700',   dot: 'bg-green-500',  border: 'border-green-200' },
  parcialmente:      { label: 'Parcialmente',       color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', border: 'border-yellow-200' },
  fuera_de_servicio: { label: 'Fuera de servicio',  color: 'bg-red-100 text-red-700',       dot: 'bg-red-500',    border: 'border-red-200' },
};

const TIPO_LABEL = {
  moto: 'Moto', auto: 'Auto', camioneta: 'Camioneta', vehiculo_pesado: 'Veh. Pesado',
};

const TIPO_ICON = {
  moto: '🏍️', auto: '🚗', camioneta: '🛻', vehiculo_pesado: '🚚',
};

// Docs obligatorios a mostrar como chips en la card
const DOCS_CHIPS = [
  { key: 'soat',     label: 'SOAT' },
  { key: 'citv',     label: 'CITV' },
  { key: 'propiedad',label: 'Prop.' },
  { key: 'sat',      label: 'SAT' },
  { key: 'sutran',   label: 'SUTRAN' },
];

function docChipColor(doc, tipo) {
  if (!doc) return 'bg-gray-100 text-gray-400';
  if (doc.vigente === 'no_aplica') return 'bg-gray-100 text-gray-400';

  // SAT/SUTRAN: la fecha es del reporte, no de vencimiento
  if (tipo === 'sat' || tipo === 'sutran') {
    if (doc.vigente === 'no') return 'bg-red-100 text-red-600';
    if (doc.fecha_vencimiento) {
      const diasDesde = Math.floor((Date.now() - new Date(doc.fecha_vencimiento + 'T00:00:00').getTime()) / 86400000);
      if (diasDesde > 30) return 'bg-yellow-100 text-yellow-600';
    }
    return doc.vigente === 'si' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400';
  }

  if (doc.vigente === 'vencido' || doc.vigente === 'no') return 'bg-red-100 text-red-600';
  if (!doc.fecha_vencimiento) {
    return doc.vigente === 'si' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-600';
  }
  const { estado } = calcularSemaforo(doc.fecha_vencimiento);
  if (estado === 'critical') return 'bg-red-100 text-red-600';
  if (estado === 'alert')    return 'bg-yellow-100 text-yellow-600';
  return 'bg-green-100 text-green-700';
}

export default function FlotaPage() {
  const [vehicles, setVehicles]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo]     = useState('');

  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then((data) => { setVehicles(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      v.placa?.toLowerCase().includes(q) ||
      v.marca?.toLowerCase().includes(q) ||
      v.modelo?.toLowerCase().includes(q) ||
      v.conductor?.toLowerCase().includes(q);
    const matchEstado = !filtroEstado || v.estado === filtroEstado;
    const matchTipo   = !filtroTipo   || v.tipo === filtroTipo;
    return matchSearch && matchEstado && matchTipo;
  });

  const totales = {
    total:             vehicles.length,
    operativo:         vehicles.filter((v) => v.estado === 'operativo').length,
    parcialmente:      vehicles.filter((v) => v.estado === 'parcialmente').length,
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

      {/* Tarjetas de resumen / filtro */}
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

      {/* Filtros */}
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
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">Todos los tipos</option>
          <option value="moto">Moto</option>
          <option value="auto">Auto</option>
          <option value="camioneta">Camioneta</option>
          <option value="vehiculo_pesado">Vehiculo pesado</option>
        </select>
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

      {/* Grid de cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--color-text-muted)]">
          <span className="text-sm">Cargando flota...</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasVehicles={vehicles.length > 0} />
      ) : (
        <>
          <p className="text-xs text-[var(--color-text-muted)] -mt-2">
            {filtered.length} unidad{filtered.length !== 1 ? 'es' : ''}
            {(filtroEstado || filtroTipo || search) ? ' encontradas' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Card principal de vehículo ───────────────────────────────────
function VehicleCard({ vehicle: v }) {
  const estado  = ESTADO_CONFIG[v.estado] || ESTADO_CONFIG.operativo;
  const docs    = v.vehicle_documents || [];
  const photos  = v.vehicle_photos    || [];
  const frontPhoto = photos.find((p) => p.tipo === 'frontal') || photos.find((p) => p.tipo === 'placa');
  const proxyUrl   = frontPhoto ? `/api/photos/${frontPhoto.id}` : null;

  const docsMap = Object.fromEntries(docs.map((d) => [d.tipo_documento, d]));

  // Problema activo
  const tieneProblema = !!v.problema_activo;

  return (
    <Link
      href={`/flota/${v.placa}`}
      className={[
        'group flex flex-col bg-[var(--color-surface)] rounded-2xl border overflow-hidden',
        'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
        tieneProblema ? 'border-red-200' : 'border-[var(--color-border)]',
      ].join(' ')}
    >
      {/* Imagen / placeholder */}
      <div className="relative w-full h-36 bg-[var(--color-surface-alt)] overflow-hidden">
        {proxyUrl ? (
          <img
            src={proxyUrl}
            alt={v.placa}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[var(--color-text-muted)]">
            <span className="text-4xl leading-none">{TIPO_ICON[v.tipo] || '🚗'}</span>
            <span className="text-xs">{TIPO_LABEL[v.tipo] || v.tipo}</span>
          </div>
        )}

        {/* Badge de estado — esquina superior derecha */}
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${estado.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
            {estado.label}
          </span>
        </div>

        {/* Badge GPS — esquina superior izquierda */}
        {v.gps && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 shadow-sm">
              <FontAwesomeIcon icon={faWifi} className="w-2.5 h-2.5" />
              GPS
            </span>
          </div>
        )}

        {/* Alerta problema activo */}
        {tieneProblema && (
          <div className="absolute bottom-0 inset-x-0 bg-red-600/90 px-3 py-1">
            <p className="text-xs text-white font-medium truncate">{v.problema_activo}</p>
          </div>
        )}
      </div>

      {/* Cuerpo de la card */}
      <div className="flex flex-col gap-3 p-4 flex-1">

        {/* Placa + tipo */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono font-bold text-xl tracking-wider text-[var(--color-text)]">{v.placa}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {[TIPO_LABEL[v.tipo], v.marca, v.modelo].filter(Boolean).join(' · ')}
            </p>
          </div>
          {v.anio && (
            <span className="text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-alt)] px-2 py-1 rounded-lg shrink-0">
              {v.anio}
            </span>
          )}
        </div>

        {/* Datos operativos */}
        <div className="flex flex-col gap-1.5">
          <DataRow icon={faUser} value={v.conductor} placeholder="Sin conductor asignado" />
          <DataRow
            icon={faGaugeHigh}
            value={v.km_actuales ? v.km_actuales.toLocaleString('es-PE') + ' km' : null}
            placeholder="KM no registrado"
          />
          <DataRow icon={faLocationDot} value={v.zona} placeholder="Sin zona" />
        </div>

        {/* Chips de documentos */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[var(--color-border)]">
          {DOCS_CHIPS.map(({ key, label }) => {
            const doc = docsMap[key];
            return (
              <span
                key={key}
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${docChipColor(doc, key)}`}
              >
                {label}
              </span>
            );
          })}
        </div>

      </div>
    </Link>
  );
}

// ─── Fila de dato con icono ───────────────────────────────────────
function DataRow({ icon, value, placeholder }) {
  return (
    <div className="flex items-center gap-2">
      <FontAwesomeIcon icon={icon} className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" />
      {value ? (
        <span className="text-xs text-[var(--color-text-secondary)] truncate">{value}</span>
      ) : (
        <span className="text-xs text-[var(--color-text-muted)] italic">{placeholder}</span>
      )}
    </div>
  );
}

// ─── Tarjeta de resumen / filtro ──────────────────────────────────
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

// ─── Estado vacío ─────────────────────────────────────────────────
function EmptyState({ hasVehicles }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <FontAwesomeIcon icon={faTruck} className="w-12 h-12 text-[var(--color-border)]" />
      <div>
        <p className="font-semibold text-[var(--color-text)]">
          {hasVehicles ? 'Sin resultados' : 'No hay unidades registradas'}
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {hasVehicles
            ? 'Intenta con otros filtros de busqueda.'
            : 'Comienza registrando la primera unidad de la flota.'}
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
