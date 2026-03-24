'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft, faPencil, faTrash, faCamera,
  faCheckCircle, faTimesCircle, faExclamationTriangle,
  faCircleXmark, faCheck, faXmark, faDownload,
} from '@fortawesome/free-solid-svg-icons';

const ESTADO_CONFIG = {
  operativo:        { label: 'Operativo',          color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  parcialmente:     { label: 'Parcialmente',        color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  fuera_de_servicio:{ label: 'Fuera de servicio',   color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
};

const TIPO_LABEL = {
  moto: 'Moto', auto: 'Auto', camioneta: 'Camioneta', vehiculo_pesado: 'Vehiculo pesado',
};

const DOC_LABEL = {
  soat: 'SOAT', citv: 'CITV', propiedad: 'Tarjeta de propiedad', seguro: 'Seguro vehicular',
};

const VIGENTE_CONFIG = {
  si:       { label: 'Vigente',   color: 'bg-green-100 text-green-700' },
  no:       { label: 'Sin doc.',  color: 'bg-gray-100 text-gray-600' },
  vencido:  { label: 'Vencido',   color: 'bg-red-100 text-red-700' },
  no_aplica:{ label: 'No aplica', color: 'bg-gray-100 text-gray-500' },
};

const PHOTO_SLOTS = [
  { key: 'placa',      label: 'Placa' },
  { key: 'odometro',   label: 'Odometro' },
  { key: 'frontal',    label: 'Frontal' },
  { key: 'lateral_der',label: 'Lateral der.' },
  { key: 'lateral_izq',label: 'Lateral izq.' },
  { key: 'posterior',  label: 'Posterior' },
  { key: 'cabina',     label: 'Cabina' },
  { key: 'guantera',   label: 'Guantera' },
];

const EQUIP_ITEMS = [
  'Extintor', 'Botiquin de primeros auxilios', 'Triangulos de seguridad (x2)',
  'Llanta de repuesto', 'Llave de rueda / cruceta', 'Gata hidraulica',
  'Cinturones de seguridad', 'Documentos en guantera', 'Retrovisores laterales',
  'Luces delanteras y traseras', 'Bocina / claxon', 'Freno de mano',
];

const DAMAGE_ZONES = ['Frontal', 'Lateral derecho', 'Lateral izquierdo', 'Posterior', 'Techo'];
const LEAK_TYPES = [
  { key: 'aceite_motor', label: 'Aceite de motor' },
  { key: 'refrigerante', label: 'Liquido refrigerante' },
  { key: 'combustible',  label: 'Combustible' },
  { key: 'liquido_frenos',label: 'Liquido de frenos' },
];

export default function FichaVehiculoPage() {
  const { placa } = useParams();
  const router = useRouter();
  const [vehicle, setVehicle]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [photoUploading, setPhotoUploading] = useState(null);

  useEffect(() => {
    // Buscar vehiculo por placa usando la API de listado
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then((data) => {
        const v = data.find((v) => v.placa === placa?.toUpperCase());
        setVehicle(v || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [placa]);

  async function handleDelete() {
    if (!vehicle) return;
    setDeleting(true);
    const res = await fetch(`/api/vehicles/${vehicle.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/flota');
    else setDeleting(false);
  }

  async function handlePhotoUpload(tipo, file) {
    if (!file || !vehicle) return;
    setPhotoUploading(tipo);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('vehicle_id', vehicle.id);
    fd.append('tipo', tipo);
    const res = await fetch('/api/photos', { method: 'POST', body: fd });
    if (res.ok) {
      const newPhoto = await res.json();
      setVehicle((v) => ({
        ...v,
        vehicle_photos: [
          ...(v.vehicle_photos || []).filter((p) => p.tipo !== tipo),
          newPhoto,
        ],
      }));
    }
    setPhotoUploading(null);
  }

  async function handlePhotoDelete(photoId, tipo) {
    const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
    if (res.ok) {
      setVehicle((v) => ({
        ...v,
        vehicle_photos: (v.vehicle_photos || []).filter((p) => p.id !== photoId),
      }));
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-[var(--color-text-muted)] text-sm">
      Cargando ficha...
    </div>
  );

  if (!vehicle) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <FontAwesomeIcon icon={faCircleXmark} className="w-12 h-12 text-[var(--color-border)]" />
      <p className="text-[var(--color-text-secondary)]">Vehiculo no encontrado</p>
      <Link href="/flota" className="text-sm text-[var(--color-primary)] hover:underline">
        Volver a la flota
      </Link>
    </div>
  );

  const estado = ESTADO_CONFIG[vehicle.estado] || ESTADO_CONFIG.operativo;
  const docs   = vehicle.vehicle_documents || [];
  const photos = vehicle.vehicle_photos    || [];
  const photoMap = Object.fromEntries(photos.map((p) => [p.tipo, p]));

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">

      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/flota" className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-[var(--color-text)]">{vehicle.placa}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${estado.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
                {estado.label}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              {[TIPO_LABEL[vehicle.tipo], vehicle.marca, vehicle.modelo, vehicle.anio].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/flota/${vehicle.placa}/editar`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            <FontAwesomeIcon icon={faPencil} className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editar</span>
          </Link>
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>

      {/* A. Identificacion */}
      <Card title="Identificacion">
        <Grid>
          <Field label="Placa"            value={vehicle.placa} />
          <Field label="Tipo"             value={TIPO_LABEL[vehicle.tipo] || vehicle.tipo} />
          <Field label="Marca"            value={vehicle.marca} />
          <Field label="Modelo"           value={vehicle.modelo} />
          <Field label="Año"              value={vehicle.anio} />
          <Field label="Color"            value={vehicle.color} />
          <Field label="N° de motor"      value={vehicle.tipo_motor} />
          <Field label="N° de chasis"     value={vehicle.chasis} />
          <Field label="Transmision"      value={vehicle.transmision} />
          <Field label="Traccion"         value={vehicle.traccion} />
          <Field label="Propietario"      value={vehicle.propietario} />
          <Field label="GPS"              value={vehicle.gps ? 'Si' : 'No'} />
        </Grid>
      </Card>

      {/* C. Estado operativo */}
      <Card title="Estado operativo">
        <Grid>
          <Field label="KM actuales"      value={vehicle.km_actuales ? vehicle.km_actuales.toLocaleString('es-PE') + ' km' : null} />
          <Field label="Zona"             value={vehicle.zona} />
          <Field label="Conductor"        value={vehicle.conductor} />
          <Field label="Telefono"         value={vehicle.conductor_tel} />
        </Grid>
        {vehicle.problema_activo && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-semibold text-yellow-700 mb-1">Problema activo</p>
            <p className="text-sm text-yellow-800">{vehicle.problema_activo}</p>
          </div>
        )}
      </Card>

      {/* D. Ultimo mantenimiento */}
      {(vehicle.fecha_ultimo_mant || vehicle.km_ultimo_mant || vehicle.tipo_servicio_mant) && (
        <Card title="Ultimo mantenimiento">
          <Grid>
            <Field label="Fecha"          value={vehicle.fecha_ultimo_mant ? new Date(vehicle.fecha_ultimo_mant + 'T00:00:00').toLocaleDateString('es-PE') : null} />
            <Field label="KM"             value={vehicle.km_ultimo_mant ? vehicle.km_ultimo_mant.toLocaleString('es-PE') + ' km' : null} />
            <Field label="Servicio"       value={vehicle.tipo_servicio_mant} />
            <Field label="Taller"         value={vehicle.taller_mant} />
            <Field label="Registro/Factura" value={vehicle.tiene_registro_factura} />
          </Grid>
        </Card>
      )}

      {/* Documentacion */}
      <Card title="Documentacion legal">
        <div className="flex flex-col gap-3">
          {['soat','citv','propiedad','seguro'].map((tipo) => {
            const doc = docs.find((d) => d.tipo_documento === tipo);
            const vig = doc?.vigente ? VIGENTE_CONFIG[doc.vigente] : null;
            return (
              <div key={tipo} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-[var(--color-border)]">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-[var(--color-text)]">{DOC_LABEL[tipo]}</p>
                  {doc?.numero && <p className="text-xs text-[var(--color-text-muted)]">N°: {doc.numero}</p>}
                  {doc?.aseguradora && <p className="text-xs text-[var(--color-text-muted)]">{doc.aseguradora}</p>}
                  {doc?.fecha_vencimiento && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Vence: {new Date(doc.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-PE')}
                    </p>
                  )}
                  {tipo === 'citv' && doc?.frecuencia_citv && (
                    <p className="text-xs text-[var(--color-text-muted)] capitalize">{doc.frecuencia_citv}</p>
                  )}
                  {tipo === 'propiedad' && doc && doc.placa_coincide !== null && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Placa coincide: {doc.placa_coincide ? 'Si' : 'No — revisar'}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {vig ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${vig.color}`}>{vig.label}</span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Sin registro</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${doc?.numero || doc?.fecha_vencimiento ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {doc?.numero || doc?.fecha_vencimiento ? 'Digitalizado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Equipamiento */}
      {vehicle.equipamiento && Object.keys(vehicle.equipamiento).length > 0 && (
        <Card title="Equipamiento de seguridad">
          <div className="flex flex-col divide-y divide-[var(--color-border)]">
            {EQUIP_ITEMS.map((item) => {
              const e = vehicle.equipamiento[item];
              if (!e) return null;
              return (
                <div key={item} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm text-[var(--color-text)]">{item}</span>
                  <div className="flex items-center gap-2">
                    {e.estado && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                        e.estado === 'ok' ? 'bg-green-100 text-green-700' :
                        e.estado === 'regular' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{e.estado.toUpperCase()}</span>
                    )}
                    {e.presente === 'si' ? (
                      <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-500" />
                    ) : e.presente === 'no' ? (
                      <FontAwesomeIcon icon={faTimesCircle} className="w-4 h-4 text-red-500" />
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daños en carroceria */}
          {vehicle.danos_carroceria && Object.values(vehicle.danos_carroceria).some(Boolean) && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Daños en carroceria</p>
              <div className="flex flex-col gap-2">
                {DAMAGE_ZONES.map((zona) => {
                  const desc = vehicle.danos_carroceria[zona];
                  if (!desc) return null;
                  return (
                    <div key={zona} className="flex gap-2 text-sm">
                      <span className="font-medium text-[var(--color-text)] w-32 shrink-0">{zona}:</span>
                      <span className="text-[var(--color-text-secondary)]">{desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fugas */}
          {vehicle.fugas && Object.values(vehicle.fugas).some((v) => v && v !== 'no') && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Fugas detectadas</p>
              <div className="flex flex-col gap-2">
                {LEAK_TYPES.map(({ key, label }) => {
                  const val = vehicle.fugas[key];
                  if (!val || val === 'no') return null;
                  return (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="w-3.5 h-3.5 text-yellow-500" />
                      <span className="text-[var(--color-text)]">{label}:</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${val === 'grave' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Fotografias */}
      <Card title="Fotografias de inspeccion">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PHOTO_SLOTS.map(({ key, label }) => {
            const photo = photoMap[key];
            const uploading = photoUploading === key;
            const proxyUrl = photo ? `/api/photos/${photo.id}` : null;
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-[var(--color-text)]">{label}</p>
                <div className="relative group">
                  <label className={photo ? 'cursor-pointer' : 'cursor-pointer'}>
                    <div className="aspect-square rounded-xl border-2 border-dashed border-[var(--color-border)] overflow-hidden flex items-center justify-center bg-[var(--color-surface-alt)] hover:border-[var(--color-primary)] transition-colors">
                      {uploading ? (
                        <span className="text-xs text-[var(--color-text-muted)]">Subiendo...</span>
                      ) : photo ? (
                        <img
                          src={proxyUrl}
                          alt={label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-[var(--color-text-muted)]">
                          <FontAwesomeIcon icon={faCamera} className="w-5 h-5" />
                          <span className="text-xs">Subir</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => e.target.files[0] && handlePhotoUpload(key, e.target.files[0])}
                    />
                  </label>

                  {/* Acciones sobre foto existente */}
                  {photo && (
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={proxyUrl}
                        download={`${label}-${vehicle.placa}.jpg`}
                        className="w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                      </a>
                      <button
                        onClick={(e) => { e.preventDefault(); handlePhotoDelete(photo.id, key); }}
                        className="w-7 h-7 rounded-lg bg-red-600/80 flex items-center justify-center text-white hover:bg-red-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modal confirmar eliminacion */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <FontAwesomeIcon icon={faTrash} className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text)]">Eliminar unidad</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{vehicle.placa}</p>
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Se eliminaran todos los datos, documentos y fotografias de esta unidad. Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                {deleting ? 'Eliminando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componentes auxiliares ────────────────────────────────────────
function Card({ title, children }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">{title}</p>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
      {children}
    </div>
  );
}

function Field({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="text-sm font-medium text-[var(--color-text)] mt-0.5">{value}</p>
    </div>
  );
}
