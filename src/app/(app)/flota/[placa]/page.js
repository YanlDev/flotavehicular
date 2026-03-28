'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft, faChevronRight, faPencil, faTrash, faCamera, faCheck, faXmark, faExpand,
  faCheckCircle, faTimesCircle, faExclamationTriangle, faCircleXmark,
  faDownload, faFilePdf, faUser, faGaugeHigh, faLocationDot,
  faWifi, faTriangleExclamation, faEye, faShield,
  faClockRotateLeft, faCircleCheck, faCircleExclamation,
  faPlus, faMoneyBillWave, faFileInvoiceDollar,
} from '@fortawesome/free-solid-svg-icons';
import { calcularSemaforo } from '@/lib/semaforo';

// ─── Constantes ────────────────────────────────────────────────────
const ESTADO_CONFIG = {
  operativo:         { label: 'Operativo',        color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  parcialmente:      { label: 'Parcialmente',      color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  fuera_de_servicio: { label: 'Fuera de servicio', color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
};

const TIPO_LABEL = {
  moto: 'Moto', auto: 'Auto', camioneta: 'Camioneta', vehiculo_pesado: 'Vehiculo pesado',
};

const DOCS_CONFIG = [
  { key: 'soat',      label: 'SOAT',              sub: 'Seguro Obligatorio de Accidentes' },
  { key: 'citv',      label: 'CITV',              sub: 'Revision Tecnica Vehicular' },
  { key: 'propiedad', label: 'Tarjeta de Propiedad', sub: 'Documento de titularidad' },
  { key: 'seguro',    label: 'Seguro Vehicular',  sub: 'Cobertura adicional' },
  { key: 'sat',       label: 'Record SAT',        sub: 'Infracciones municipales' },
  { key: 'sutran',    label: 'Record SUTRAN',     sub: 'Superintendencia de Transporte' },
];

const PHOTO_SLOTS = [
  { key: 'placa',       label: 'Placa' },
  { key: 'odometro',    label: 'Odometro' },
  { key: 'frontal',     label: 'Frontal' },
  { key: 'lateral_der', label: 'Lateral der.' },
  { key: 'lateral_izq', label: 'Lateral izq.' },
  { key: 'posterior',   label: 'Posterior' },
  { key: 'cabina',      label: 'Cabina' },
  { key: 'guantera',    label: 'Guantera' },
];

const EQUIP_ITEMS = [
  'Extintor', 'Botiquin de primeros auxilios', 'Triangulos de seguridad (x2)',
  'Llanta de repuesto', 'Llave de rueda / cruceta', 'Gata hidraulica',
  'Cinturones de seguridad', 'Documentos en guantera', 'Retrovisores laterales',
  'Luces delanteras y traseras', 'Bocina / claxon', 'Freno de mano',
];

const DAMAGE_ZONES = ['Frontal', 'Lateral derecho', 'Lateral izquierdo', 'Posterior', 'Techo'];
const LEAK_TYPES = [
  { key: 'aceite_motor',  label: 'Aceite de motor' },
  { key: 'refrigerante',  label: 'Liquido refrigerante' },
  { key: 'combustible',   label: 'Combustible' },
  { key: 'liquido_frenos',label: 'Liquido de frenos' },
];

// ─── Helpers ────────────────────────────────────────────────────────
function getDocStatus(doc, tipo) {
  if (!doc) return { label: 'Sin registro', color: 'bg-gray-100 text-gray-500', icon: faCircleExclamation, ring: 'ring-gray-200' };
  if (doc.vigente === 'no_aplica') return { label: 'No aplica', color: 'bg-gray-100 text-gray-400', icon: faCircleExclamation, ring: 'ring-gray-100' };

  // SAT y SUTRAN: la fecha es del reporte, no de vencimiento
  // Alertar si el reporte tiene más de 30 días (conviene consultar de nuevo)
  if (tipo === 'sat' || tipo === 'sutran') {
    if (doc.vigente === 'no') return { label: 'Con deudas', color: 'bg-red-100 text-red-600', icon: faTimesCircle, ring: 'ring-red-200' };
    if (doc.fecha_vencimiento) {
      const reportDate  = new Date(doc.fecha_vencimiento + 'T00:00:00');
      const diasDesde   = Math.floor((Date.now() - reportDate.getTime()) / 86400000);
      if (diasDesde > 30) {
        return { label: 'Actualizar', color: 'bg-yellow-100 text-yellow-600', icon: faClockRotateLeft, ring: 'ring-yellow-300', dias: diasDesde };
      }
    }
    if (doc.vigente === 'si') return { label: 'Al dia', color: 'bg-green-100 text-green-700', icon: faCircleCheck, ring: 'ring-green-200' };
    return { label: 'Sin consulta', color: 'bg-gray-100 text-gray-500', icon: faCircleExclamation, ring: 'ring-gray-200' };
  }

  if (doc.vigente === 'no')      return { label: 'Sin documento', color: 'bg-red-100 text-red-600', icon: faTimesCircle, ring: 'ring-red-200' };
  if (doc.vigente === 'vencido') return { label: 'Vencido', color: 'bg-red-100 text-red-600', icon: faTimesCircle, ring: 'ring-red-300' };

  if (doc.fecha_vencimiento) {
    const { estado, diasRestantes } = calcularSemaforo(doc.fecha_vencimiento);
    if (estado === 'critical') return { label: diasRestantes < 0 ? 'Vencido' : `Vence en ${diasRestantes}d`, color: 'bg-red-100 text-red-600', icon: faTriangleExclamation, ring: 'ring-red-300', dias: diasRestantes };
    if (estado === 'alert')    return { label: `Vence en ${diasRestantes}d`, color: 'bg-yellow-100 text-yellow-600', icon: faClockRotateLeft, ring: 'ring-yellow-300', dias: diasRestantes };
    return { label: 'Vigente', color: 'bg-green-100 text-green-700', icon: faCircleCheck, ring: 'ring-green-200' };
  }

  if (doc.vigente === 'si') return { label: 'Vigente', color: 'bg-green-100 text-green-700', icon: faCircleCheck, ring: 'ring-green-200' };
  return { label: 'Sin fecha', color: 'bg-yellow-100 text-yellow-600', icon: faClockRotateLeft, ring: 'ring-yellow-200' };
}

// ─── Página principal ───────────────────────────────────────────────
export default function FichaVehiculoPage() {
  const { placa }  = useParams();
  const router     = useRouter();

  const [vehicle, setVehicle]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [showDelete, setShowDelete]     = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [mainPhotoKey, setMainPhotoKey] = useState('frontal');
  const [photoUploading, setPhotoUploading] = useState(null);
  const [pdfModal, setPdfModal]         = useState(null); // { url, label }
  const [lightboxPhoto, setLightboxPhoto] = useState(null); // proxy url string
  const [activeTab, setActiveTab]       = useState('equipamiento');

  // Infracciones
  const [infractions, setInfractions]         = useState([]);
  const [infLoading, setInfLoading]           = useState(false);
  const [showInfForm, setShowInfForm]         = useState(false);
  const [infForm, setInfForm]                 = useState({ fecha: '', entidad: 'SAT', codigo: '', descripcion: '', monto: '', estado: 'pendiente', observaciones: '' });
  const [infSaving, setInfSaving]             = useState(false);
  const [infPdfUploading, setInfPdfUploading] = useState(null); // infraction id
  const [infDeleting, setInfDeleting]         = useState(null); // infraction id
  const [showPayForm, setShowPayForm]         = useState(null); // infraction id
  const [payForm, setPayForm]                 = useState({ fecha_pago: '', referencia_pago: '' });

  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then((data) => {
        const v = data.find((v) => v.placa === placa?.toUpperCase());
        setVehicle(v || null);
        setLoading(false);
        if (v) {
          setInfLoading(true);
          fetch(`/api/infractions?vehicle_id=${v.id}`)
            .then((r) => r.json())
            .then((inf) => { setInfractions(Array.isArray(inf) ? inf : []); setInfLoading(false); })
            .catch(() => setInfLoading(false));
        }
      })
      .catch(() => setLoading(false));
  }, [placa]);

  // Navegación con teclado cuando el lightbox está abierto
  useEffect(() => {
    if (!lightboxPhoto || !vehicle) return;
    const order   = ['frontal', 'placa', 'lateral_der', 'lateral_izq', 'posterior', 'cabina', 'odometro', 'guantera'];
    const pMap    = Object.fromEntries((vehicle.vehicle_photos || []).map((p) => [p.tipo, p]));
    const avail   = order.filter((k) => pMap[k]);
    const current = (vehicle.vehicle_photos || []).find((p) => `/api/photos/${p.id}` === lightboxPhoto);
    const idx     = avail.indexOf(current?.tipo ?? '');
    function onKey(e) {
      if (e.key === 'Escape') { setLightboxPhoto(null); return; }
      if (avail.length < 2) return;
      const dir  = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
      if (!dir) return;
      const next = avail[(idx + dir + avail.length) % avail.length];
      setMainPhotoKey(next);
      setLightboxPhoto(`/api/photos/${pMap[next].id}`);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxPhoto, vehicle]);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/vehicles/${vehicle.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/flota');
    else setDeleting(false);
  }

  async function handlePhotoUpload(tipo, file) {
    if (!file || !vehicle) return;
    setPhotoUploading(tipo);
    const fd = new FormData();
    fd.append('file', file); fd.append('vehicle_id', vehicle.id); fd.append('tipo', tipo);
    const res = await fetch('/api/photos', { method: 'POST', body: fd });
    if (res.ok) {
      const newPhoto = await res.json();
      setVehicle((v) => ({
        ...v,
        vehicle_photos: [...(v.vehicle_photos || []).filter((p) => p.tipo !== tipo), newPhoto],
      }));
    }
    setPhotoUploading(null);
  }

  async function handlePhotoDelete(photoId) {
    const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
    if (res.ok) setVehicle((v) => ({ ...v, vehicle_photos: (v.vehicle_photos || []).filter((p) => p.id !== photoId) }));
  }

  async function handleInfSave() {
    if (!infForm.fecha || !infForm.entidad) return;
    setInfSaving(true);
    const res = await fetch('/api/infractions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...infForm, vehicle_id: vehicle.id }),
    });
    if (res.ok) {
      const newInf = await res.json();
      setInfractions((prev) => [newInf, ...prev]);
      setShowInfForm(false);
      setInfForm({ fecha: '', entidad: 'SAT', codigo: '', descripcion: '', monto: '', estado: 'pendiente', observaciones: '' });
    }
    setInfSaving(false);
  }

  async function handleInfDelete(id) {
    setInfDeleting(id);
    const res = await fetch(`/api/infractions/${id}`, { method: 'DELETE' });
    if (res.ok) setInfractions((prev) => prev.filter((i) => i.id !== id));
    setInfDeleting(null);
  }

  async function handleInfPdfUpload(id, file) {
    if (!file) return;
    setInfPdfUploading(id);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/infractions/${id}`, { method: 'PATCH', body: fd });
    if (res.ok) {
      const updated = await res.json();
      setInfractions((prev) => prev.map((i) => i.id === id ? updated : i));
    }
    setInfPdfUploading(null);
  }

  async function handleMarkPaid(id) {
    if (!payForm.fecha_pago) return;
    const res = await fetch(`/api/infractions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'pagada', fecha_pago: payForm.fecha_pago, referencia_pago: payForm.referencia_pago }),
    });
    if (res.ok) {
      const updated = await res.json();
      setInfractions((prev) => prev.map((i) => i.id === id ? updated : i));
      setShowPayForm(null);
      setPayForm({ fecha_pago: '', referencia_pago: '' });
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-[var(--color-text-muted)] text-sm">
      Cargando ficha...
    </div>
  );

  if (!vehicle) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <FontAwesomeIcon icon={faCircleXmark} className="w-12 h-12 text-[var(--color-border)]" />
      <p className="text-[var(--color-text-secondary)]">Vehiculo no encontrado</p>
      <Link href="/flota" className="text-sm text-[var(--color-primary)] hover:underline">Volver a la flota</Link>
    </div>
  );

  const estado    = ESTADO_CONFIG[vehicle.estado] || ESTADO_CONFIG.operativo;
  const docs      = vehicle.vehicle_documents || [];
  const photos    = vehicle.vehicle_photos    || [];
  const photoMap  = Object.fromEntries(photos.map((p) => [p.tipo, p]));
  const docsMap   = Object.fromEntries(docs.map((d) => [d.tipo_documento, d]));

  // Fotos subidas, en orden de display
  const photoOrder     = ['frontal', 'placa', 'lateral_der', 'lateral_izq', 'posterior', 'cabina', 'odometro', 'guantera'];
  const uploadedPhotos = photoOrder.filter((k) => photoMap[k]); // solo las que existen
  const activePhoto    = photoMap[mainPhotoKey] || photoMap[uploadedPhotos[0]] || null;
  const activeProxyUrl = activePhoto ? `/api/photos/${activePhoto.id}` : null;

  const activeIdx  = uploadedPhotos.indexOf(activePhoto?.tipo ?? '');
  function navPhoto(dir) {
    if (uploadedPhotos.length < 2) return;
    const next = (activeIdx + dir + uploadedPhotos.length) % uploadedPhotos.length;
    setMainPhotoKey(uploadedPhotos[next]);
  }

  const hasEquipamiento = vehicle.equipamiento && Object.keys(vehicle.equipamiento).length > 0;
  const hasDanos        = vehicle.danos_carroceria && Object.values(vehicle.danos_carroceria).some(Boolean);
  const hasFugas        = vehicle.fugas && Object.values(vehicle.fugas).some((v) => v && v !== 'no');
  const hasInspeccion   = hasEquipamiento || hasDanos || hasFugas;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">

      {/* ── Barra superior ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/flota" className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
          <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" />
          Flota vehicular
        </Link>
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

      {/* ── HERO: galería + info ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

        {/* Galería de fotos */}
        <div className="flex flex-col gap-3">
          {/* Foto principal */}
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
            {activeProxyUrl ? (
              <>
                {/* Imagen reducida dentro del contenedor fijo, sin recorte */}
                <img
                  src={activeProxyUrl}
                  alt={vehicle.placa}
                  className="absolute inset-0 w-full h-full object-contain cursor-zoom-in"
                  onClick={() => setLightboxPhoto(activeProxyUrl)}
                />

                {/* Controles de navegación */}
                {uploadedPhotos.length > 1 && (
                  <>
                    <button
                      onClick={() => navPhoto(-1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => navPhoto(1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                    >
                      <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5" />
                    </button>
                    {/* Indicador de posición */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                      {uploadedPhotos.map((k) => (
                        <button
                          key={k}
                          onClick={() => setMainPhotoKey(k)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${k === activePhoto?.tipo ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Botón ampliar */}
                <button
                  onClick={() => setLightboxPhoto(activeProxyUrl)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                >
                  <FontAwesomeIcon icon={faExpand} className="w-3 h-3" />
                </button>

                {/* Label de foto activa */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
                  <p className="text-[10px] text-white font-medium">
                    {PHOTO_SLOTS.find((s) => s.key === activePhoto?.tipo)?.label || ''}
                    {uploadedPhotos.length > 1 && (
                      <span className="ml-1 opacity-70">{activeIdx + 1}/{uploadedPhotos.length}</span>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]">
                <FontAwesomeIcon icon={faCamera} className="w-10 h-10" />
                <span className="text-sm">Sin fotografias</span>
              </div>
            )}
            {/* Overlay problema activo */}
            {vehicle.problema_activo && (
              <div className="absolute bottom-0 inset-x-0 bg-red-600/90 backdrop-blur-sm px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 text-white shrink-0" />
                  <p className="text-sm text-white font-medium truncate">{vehicle.problema_activo}</p>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {PHOTO_SLOTS.map(({ key, label }) => {
              const photo    = photoMap[key];
              const proxyUrl = photo ? `/api/photos/${photo.id}` : null;
              const isActive = activePhoto?.tipo === key;
              const uploading = photoUploading === key;

              return (
                <div key={key} className="flex flex-col gap-1">
                  <div className="relative group">
                    <button
                      onClick={() => photo && setMainPhotoKey(key)}
                      className={[
                        'w-full aspect-square rounded-lg overflow-hidden border-2 transition-all bg-[var(--color-surface-alt)]',
                        photo
                          ? isActive
                            ? 'border-[var(--color-primary)]'
                            : 'border-transparent hover:border-[var(--color-primary)]/60 opacity-80 hover:opacity-100'
                          : 'border-dashed border-[var(--color-border)] opacity-50',
                      ].join(' ')}
                    >
                      {uploading ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : proxyUrl ? (
                        <img src={proxyUrl} alt={label} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faCamera} className="w-3 h-3 text-[var(--color-text-muted)]" />
                        </div>
                      )}
                    </button>

                    {/* Hover actions */}
                    <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      {photo ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setLightboxPhoto(proxyUrl); }}
                            className="w-5 h-5 rounded bg-white/20 hover:bg-white/40 flex items-center justify-center"
                          >
                            <FontAwesomeIcon icon={faExpand} className="w-2.5 h-2.5 text-white" />
                          </button>
                          <a
                            href={proxyUrl}
                            download={`${key}-${vehicle.placa}.jpg`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 rounded bg-white/20 hover:bg-white/40 flex items-center justify-center"
                          >
                            <FontAwesomeIcon icon={faDownload} className="w-2.5 h-2.5 text-white" />
                          </a>
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePhotoDelete(photo.id); }}
                            className="w-5 h-5 rounded bg-red-500/80 hover:bg-red-600 flex items-center justify-center"
                          >
                            <FontAwesomeIcon icon={faXmark} className="w-2.5 h-2.5 text-white" />
                          </button>
                        </>
                      ) : (
                        <label className="w-5 h-5 rounded bg-white/20 hover:bg-white/40 flex items-center justify-center cursor-pointer">
                          <FontAwesomeIcon icon={faCamera} className="w-2.5 h-2.5 text-white" />
                          <input type="file" accept="image/*" capture="environment" className="hidden"
                            onChange={(e) => e.target.files[0] && handlePhotoUpload(key, e.target.files[0])} />
                        </label>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-center text-[var(--color-text-muted)] truncate leading-tight">{label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de información */}
        <div className="flex flex-col gap-5">

          {/* Placa + estado + badges */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h1 className="font-mono font-bold text-4xl tracking-wider text-[var(--color-text)]">{vehicle.placa}</h1>
              <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full shrink-0 mt-1 ${estado.color}`}>
                <span className={`w-2 h-2 rounded-full ${estado.dot}`} />
                {estado.label}
              </span>
            </div>
            <p className="text-base text-[var(--color-text-secondary)]">
              {[TIPO_LABEL[vehicle.tipo], vehicle.marca, vehicle.modelo, vehicle.anio].filter(Boolean).join(' · ')}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {vehicle.gps && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  <FontAwesomeIcon icon={faWifi} className="w-3 h-3" /> GPS activo
                </span>
              )}
              {vehicle.color && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                  {vehicle.color}
                </span>
              )}
            </div>
          </div>

          {/* Datos operativos */}
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            <InfoRow icon={faUser} label="Conductor"
              value={vehicle.conductor
                ? <span>{vehicle.conductor}{vehicle.conductor_tel && <span className="text-[var(--color-text-muted)] ml-2">· {vehicle.conductor_tel}</span>}</span>
                : null}
              empty="Sin conductor asignado"
            />
            <InfoRow icon={faGaugeHigh} label="Kilometraje"
              value={vehicle.km_actuales ? vehicle.km_actuales.toLocaleString('es-PE') + ' km' : null}
              empty="No registrado"
            />
            <InfoRow icon={faLocationDot} label="Zona" value={vehicle.zona} empty="—" />
            <InfoRow icon={faShield}      label="RUC Asociado" value={vehicle.propietario} empty="No registrado" />
          </div>

          {/* Especificaciones técnicas */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Especificaciones tecnicas</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <SpecField label="N° de motor"   value={vehicle.motor} />
              <SpecField label="Tipo de motor" value={vehicle.tipo_motor} />
              <SpecField label="N° de chasis"  value={vehicle.chasis} />
              <SpecField label="Transmision"   value={vehicle.transmision} />
              <SpecField label="Traccion"      value={vehicle.traccion} />
              <SpecField label="Año"           value={vehicle.anio} />
            </div>
          </div>
        </div>
      </div>

      {/* ── DOCUMENTOS ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[var(--color-text)]">Documentacion</h2>
          <Link href={`/flota/${vehicle.placa}/editar`} className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
            <FontAwesomeIcon icon={faPencil} className="w-3 h-3" /> Gestionar
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {DOCS_CONFIG.map(({ key, label, sub }) => {
            const doc    = docsMap[key];
            const status = getDocStatus(doc, key);
            const pdfUrl = doc?.file_url ? `/api/documents/${doc.id}` : null;

            return (
              <div
                key={key}
                className={`flex flex-col bg-[var(--color-surface)] rounded-xl border p-3 gap-2.5 ring-1 ${status.ring} border-transparent`}
              >
                {/* Ícono + estado */}
                <div className="flex items-start justify-between gap-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status.color}`}>
                    <FontAwesomeIcon icon={status.icon} className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-tight text-center ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Nombre del doc */}
                <div>
                  <p className="text-xs font-bold text-[var(--color-text)] leading-tight">{label}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] leading-tight mt-0.5">{sub}</p>
                </div>

                {/* Datos del doc */}
                <div className="flex flex-col gap-0.5 flex-1">
                  {doc?.numero && (
                    <p className="text-[10px] text-[var(--color-text-muted)] truncate">N°: {doc.numero}</p>
                  )}
                  {doc?.aseguradora && (
                    <p className="text-[10px] text-[var(--color-text-muted)] truncate">{doc.aseguradora}</p>
                  )}
                  {doc?.fecha_vencimiento && (
                    <p className={`text-[10px] ${status.dias > 30 ? 'text-yellow-600 font-medium' : 'text-[var(--color-text-muted)]'}`}>
                      {(key === 'sat' || key === 'sutran')
                        ? (status.dias > 30
                            ? `Reporte hace ${status.dias}d`
                            : `Reporte: ${new Date(doc.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' })}`)
                        : `Vence: ${new Date(doc.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' })}`}
                    </p>
                  )}
                  {key === 'citv' && doc?.frecuencia_citv && (
                    <p className="text-[10px] text-[var(--color-text-muted)] capitalize">{doc.frecuencia_citv}</p>
                  )}
                  {key === 'propiedad' && doc?.placa_coincide === false && (
                    <p className="text-[10px] text-red-500 font-medium">Placa no coincide</p>
                  )}
                </div>

                {/* Acción PDF */}
                {pdfUrl ? (
                  <button
                    onClick={() => setPdfModal({ url: pdfUrl, label })}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-semibold transition-colors border border-red-100"
                  >
                    <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                    Ver PDF
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] text-[10px]">
                    <FontAwesomeIcon icon={faFilePdf} className="w-3 h-3" />
                    Sin PDF
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TABS: Equipamiento / Inspección ─────────────────────── */}
      {hasInspeccion && (
        <div>
          <div className="flex gap-1 border-b border-[var(--color-border)] mb-5">
            {hasEquipamiento && (
              <TabBtn active={activeTab === 'equipamiento'} onClick={() => setActiveTab('equipamiento')}>
                Equipamiento de seguridad
              </TabBtn>
            )}
            {(hasDanos || hasFugas) && (
              <TabBtn active={activeTab === 'inspeccion'} onClick={() => setActiveTab('inspeccion')}>
                Inspeccion del vehiculo
              </TabBtn>
            )}
          </div>

          {activeTab === 'equipamiento' && hasEquipamiento && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EQUIP_ITEMS.map((item) => {
                const e = vehicle.equipamiento[item];
                if (!e) return null;
                return (
                  <div key={item} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text)]">{item}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {e.estado && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          e.estado === 'ok' ? 'bg-green-100 text-green-700' :
                          e.estado === 'regular' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>{e.estado}</span>
                      )}
                      {e.presente === 'si'
                        ? <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-500" />
                        : e.presente === 'no'
                          ? <FontAwesomeIcon icon={faTimesCircle} className="w-4 h-4 text-red-500" />
                          : <span className="text-xs text-[var(--color-text-muted)]">—</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'inspeccion' && (
            <div className="flex flex-col gap-5">
              {hasDanos && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Daños en carroceria</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DAMAGE_ZONES.map((zona) => {
                      const desc = vehicle.danos_carroceria[zona];
                      if (!desc) return null;
                      return (
                        <div key={zona} className="flex gap-3 px-4 py-2.5 bg-[var(--color-surface)] rounded-xl border border-yellow-200">
                          <span className="text-sm font-medium text-[var(--color-text)] w-28 shrink-0">{zona}</span>
                          <span className="text-sm text-[var(--color-text-secondary)]">{desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {hasFugas && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Fugas detectadas</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {LEAK_TYPES.map(({ key, label }) => {
                      const val = vehicle.fugas[key];
                      if (!val || val === 'no') return null;
                      return (
                        <div key={key} className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border ${val === 'grave' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faExclamationTriangle} className={`w-3.5 h-3.5 ${val === 'grave' ? 'text-red-500' : 'text-yellow-500'}`} />
                            <span className="text-sm text-[var(--color-text)]">{label}</span>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${val === 'grave' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── INFRACCIONES ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--color-text)]">Infracciones</h2>
            {infractions.length > 0 && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                infractions.some((i) => i.estado === 'pendiente')
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {infractions.filter((i) => i.estado === 'pendiente').length > 0
                  ? `${infractions.filter((i) => i.estado === 'pendiente').length} pendiente${infractions.filter((i) => i.estado === 'pendiente').length > 1 ? 's' : ''}`
                  : 'Al dia'}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowInfForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
            Registrar
          </button>
        </div>

        {infLoading ? (
          <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">Cargando...</div>
        ) : infractions.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
            Sin infracciones registradas
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {infractions.map((inf) => (
              <div key={inf.id} className={`bg-[var(--color-surface)] rounded-xl border p-4 ${
                inf.estado === 'pendiente' ? 'border-red-200' : 'border-[var(--color-border)]'
              }`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      inf.entidad === 'SAT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>{inf.entidad}</span>
                    {inf.codigo && (
                      <span className="text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-surface-alt)] px-2 py-0.5 rounded">
                        {inf.codigo}
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      inf.estado === 'pendiente'  ? 'bg-red-100 text-red-700' :
                      inf.estado === 'pagada'     ? 'bg-green-100 text-green-700' :
                      inf.estado === 'impugnada'  ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {inf.estado === 'pendiente' ? 'Pendiente' :
                       inf.estado === 'pagada'    ? 'Pagada'    :
                       inf.estado === 'impugnada' ? 'Impugnada' : inf.estado}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                    {new Date(inf.fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>
                </div>

                {inf.descripcion && (
                  <p className="text-sm text-[var(--color-text)] mb-2">{inf.descripcion}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                  {inf.monto && (
                    <span className="font-semibold text-[var(--color-text)]">
                      S/ {parseFloat(inf.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  {inf.estado === 'pagada' && inf.fecha_pago && (
                    <span>Pagado: {new Date(inf.fecha_pago + 'T00:00:00').toLocaleDateString('es-PE')}</span>
                  )}
                  {inf.referencia_pago && <span>Ref: {inf.referencia_pago}</span>}
                  {inf.observaciones && <span className="italic">{inf.observaciones}</span>}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border)]">
                  {inf.file_key ? (
                    <button
                      onClick={() => setPdfModal({ url: `/api/infractions/${inf.id}`, label: `${inf.entidad} — ${inf.codigo || inf.fecha}` })}
                      className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline"
                    >
                      <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                      Ver papeleta
                    </button>
                  ) : (
                    <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] hover:underline cursor-pointer">
                      {infPdfUploading === inf.id ? (
                        <span className="text-[var(--color-text-muted)]">Subiendo...</span>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faFilePdf} className="w-3 h-3" />
                          Adjuntar papeleta
                          <input type="file" accept="application/pdf" className="hidden"
                            onChange={(e) => e.target.files[0] && handleInfPdfUpload(inf.id, e.target.files[0])} />
                        </>
                      )}
                    </label>
                  )}
                  {inf.estado === 'pendiente' && (
                    <>
                      <span className="text-[var(--color-border)]">·</span>
                      <button
                        onClick={() => { setShowPayForm(inf.id); setPayForm({ fecha_pago: '', referencia_pago: '' }); }}
                        className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:underline"
                      >
                        <FontAwesomeIcon icon={faMoneyBillWave} className="w-3 h-3" />
                        Marcar pagada
                      </button>
                    </>
                  )}
                  <span className="flex-1" />
                  <button
                    onClick={() => handleInfDelete(inf.id)}
                    disabled={infDeleting === inf.id}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                  </button>
                </div>

                {/* Pay form inline */}
                {showPayForm === inf.id && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-green-800">Registrar pago</p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="date"
                        value={payForm.fecha_pago}
                        onChange={(e) => setPayForm((p) => ({ ...p, fecha_pago: e.target.value }))}
                        className="flex-1 min-w-0 text-xs border border-green-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-green-400"
                        placeholder="Fecha de pago"
                      />
                      <input
                        type="text"
                        value={payForm.referencia_pago}
                        onChange={(e) => setPayForm((p) => ({ ...p, referencia_pago: e.target.value }))}
                        className="flex-1 min-w-0 text-xs border border-green-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-green-400"
                        placeholder="N° referencia (opcional)"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowPayForm(null)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-100 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleMarkPaid(inf.id)}
                        disabled={!payForm.fecha_pago}
                        className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Confirmar pago
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal nueva infraccion ───────────────────────────────── */}
      {showInfForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 max-w-md w-full shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-4 h-4 text-red-600" />
                </div>
                <p className="font-semibold text-[var(--color-text)]">Registrar infraccion</p>
              </div>
              <button onClick={() => setShowInfForm(false)} className="w-8 h-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors">
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Entidad *</label>
                <select
                  value={infForm.entidad}
                  onChange={(e) => setInfForm((p) => ({ ...p, entidad: e.target.value }))}
                  className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                >
                  <option value="SAT">SAT</option>
                  <option value="SUTRAN">SUTRAN</option>
                  <option value="MTC">MTC</option>
                  <option value="Policia">Policia Nacional</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Fecha *</label>
                <input
                  type="date"
                  value={infForm.fecha}
                  onChange={(e) => setInfForm((p) => ({ ...p, fecha: e.target.value }))}
                  className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Codigo</label>
                <input
                  type="text"
                  value={infForm.codigo}
                  onChange={(e) => setInfForm((p) => ({ ...p, codigo: e.target.value }))}
                  placeholder="Ej: M-001"
                  className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Monto (S/)</label>
                <input
                  type="number"
                  value={infForm.monto}
                  onChange={(e) => setInfForm((p) => ({ ...p, monto: e.target.value }))}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Descripcion</label>
                <input
                  type="text"
                  value={infForm.descripcion}
                  onChange={(e) => setInfForm((p) => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Detalle de la infraccion"
                  className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Estado</label>
                <select
                  value={infForm.estado}
                  onChange={(e) => setInfForm((p) => ({ ...p, estado: e.target.value }))}
                  className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="pagada">Pagada</option>
                  <option value="impugnada">Impugnada</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Observaciones</label>
                <input
                  type="text"
                  value={infForm.observaciones}
                  onChange={(e) => setInfForm((p) => ({ ...p, observaciones: e.target.value }))}
                  className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowInfForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleInfSave}
                disabled={infSaving || !infForm.fecha || !infForm.entidad}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {infSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox de imagen ──────────────────────────────────── */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          {/* Navegación en lightbox */}
          {uploadedPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navPhoto(-1); setLightboxPhoto(`/api/photos/${photoMap[uploadedPhotos[(activeIdx - 1 + uploadedPhotos.length) % uploadedPhotos.length]]?.id}`); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navPhoto(1); setLightboxPhoto(`/api/photos/${photoMap[uploadedPhotos[(activeIdx + 1) % uploadedPhotos.length]]?.id}`); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              >
                <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
              </button>
            </>
          )}
          {/* Imagen a tamaño completo */}
          <img
            src={lightboxPhoto}
            alt="Vista ampliada"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: '90vh', maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          />
          {/* Barra inferior */}
          <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
            <a
              href={lightboxPhoto}
              download
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
            >
              <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
              Descargar
            </a>
            <button
              onClick={() => setLightboxPhoto(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
              Cerrar
            </button>
          </div>
          {/* Dots en lightbox */}
          {uploadedPhotos.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {uploadedPhotos.map((k) => (
                <button
                  key={k}
                  onClick={(e) => { e.stopPropagation(); setMainPhotoKey(k); setLightboxPhoto(`/api/photos/${photoMap[k]?.id}`); }}
                  className={`w-2 h-2 rounded-full transition-all ${k === activePhoto?.tipo ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal PDF viewer ─────────────────────────────────────── */}
      {pdfModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPdfModal(null)}>
          <div
            className="bg-[var(--color-surface)] rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
            style={{ height: 'min(85vh, 800px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faFilePdf} className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{pdfModal.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{vehicle.placa}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfModal.url}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
                >
                  <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                  Descargar
                </a>
                <button
                  onClick={() => setPdfModal(null)}
                  className="w-8 h-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* iframe PDF */}
            <iframe
              src={pdfModal.url}
              className="flex-1 w-full"
              title={pdfModal.label}
            />
          </div>
        </div>
      )}

      {/* ── Modal eliminar ───────────────────────────────────────── */}
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
              Se eliminaran todos los datos, documentos y fotografias. Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors">
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors">
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
function InfoRow({ icon, label, value, empty }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <FontAwesomeIcon icon={icon} className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
      <span className="text-xs text-[var(--color-text-muted)] w-24 shrink-0">{label}</span>
      {value
        ? <span className="text-sm text-[var(--color-text)] font-medium flex-1">{value}</span>
        : <span className="text-sm text-[var(--color-text-muted)] italic flex-1">{empty}</span>
      }
    </div>
  );
}

function SpecField({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-[var(--color-text)] mt-0.5">{value}</p>
    </div>
  );
}

function TabBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
        active
          ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
          : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
