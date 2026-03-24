'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft, faChevronRight, faCheck, faSpinner, faCamera,
} from '@fortawesome/free-solid-svg-icons';
import StepIndicator from '@/components/ui/StepIndicator';
import FormField, { Input, Select, Textarea } from '@/components/ui/FormField';

const STEPS = ['Datos del vehiculo', 'Documentacion', 'Equipamiento', 'Fotografias'];

// ─── Estado inicial ────────────────────────────────────────────────
const INITIAL_VEHICLE = {
  placa: '', tipo: '', marca: '', modelo: '', anio: '', color: '',
  chasis: '', tipo_motor: '', transmision: '', traccion: '',
  propietario: '', gps: false,
  km_actuales: '', zona: 'Juliaca', estado: 'operativo',
  problema_activo: '', conductor: '', conductor_tel: '',
  km_ultimo_mant: '', fecha_ultimo_mant: '', tipo_servicio_mant: '',
  taller_mant: '', tiene_registro_factura: '',
  equipamiento: {}, danos_carroceria: {}, fugas: {},
};

const INITIAL_DOCS = {
  soat: {
    tipo_documento: 'soat', vigente: '', numero: '',
    aseguradora: '', fecha_vencimiento: '',
  },
  citv: {
    tipo_documento: 'citv', vigente: '', numero: '',
    centro_citv: '', fecha_vencimiento: '', frecuencia_citv: '',
  },
  seguro: {
    tipo_documento: 'seguro', vigente: 'no_aplica', numero: '',
    aseguradora: '', fecha_vencimiento: '',
  },
  propiedad: {
    tipo_documento: 'propiedad', vigente: '', numero: '',
    aseguradora: '', placa_coincide: null,
  },
};

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
  { key: 'combustible', label: 'Combustible (gasoil)' },
  { key: 'liquido_frenos', label: 'Liquido de frenos' },
];

const PHOTO_SLOTS = [
  { key: 'placa',      label: 'Placa del vehiculo' },
  { key: 'odometro',  label: 'Odometro (km)' },
  { key: 'frontal',   label: 'Estado frontal' },
  { key: 'lateral_der', label: 'Lateral derecho' },
  { key: 'lateral_izq', label: 'Lateral izquierdo' },
  { key: 'posterior', label: 'Estado posterior' },
  { key: 'cabina',    label: 'Interior cabina' },
  { key: 'guantera',  label: 'Documentos en guantera' },
];

// ─── Componente principal ──────────────────────────────────────────
export default function NuevaUnidadPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [vehicle, setVehicle] = useState(INITIAL_VEHICLE);
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [photos, setPhotos] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  function setV(field, value) {
    setVehicle((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function setDoc(tipo, field, value) {
    setDocs((p) => ({ ...p, [tipo]: { ...p[tipo], [field]: value } }));
  }

  function setEquip(item, field, value) {
    setVehicle((p) => ({
      ...p,
      equipamiento: { ...p.equipamiento, [item]: { ...p.equipamiento[item], [field]: value } },
    }));
  }

  function setDamage(zona, value) {
    setVehicle((p) => ({
      ...p,
      danos_carroceria: { ...p.danos_carroceria, [zona]: value },
    }));
  }

  function setLeak(tipo, value) {
    setVehicle((p) => ({
      ...p,
      fugas: { ...p.fugas, [tipo]: value },
    }));
  }

  function validate0() {
    const e = {};
    if (!vehicle.placa.trim()) e.placa = 'La placa es obligatoria';
    if (!vehicle.tipo) e.tipo = 'Selecciona el tipo de unidad';
    if (!vehicle.km_actuales) e.km_actuales = 'Los KM actuales son obligatorios';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleNext() {
    if (step === 0 && !validate0()) return;
    if (step === 1) {
      await saveVehicle();
      return;
    }
    setStep((s) => s + 1);
  }

  async function saveVehicle() {
    setLoading(true);
    const documents = Object.values(docs).filter(
      (d) => d.vigente || d.numero || d.fecha_vencimiento || d.aseguradora || d.centro_citv
    );

    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...vehicle, documents }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrors({ general: data.error || 'Error al guardar la unidad' });
      return;
    }
    setCreatedId(data.id);
    setStep(2);
  }

  async function handlePhotoUpload(tipo, file) {
    if (!file || !createdId) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('vehicle_id', createdId);
    fd.append('tipo', tipo);
    const res = await fetch('/api/photos', { method: 'POST', body: fd });
    if (res.ok) setPhotos((p) => ({ ...p, [tipo]: URL.createObjectURL(file) }));
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Nueva unidad</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Registro de vehiculo — SELCOSI XPORT S.A.C.
        </p>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">

        {step === 0 && <Step0 vehicle={vehicle} setV={setV} errors={errors} />}
        {step === 1 && <Step1 docs={docs} setDoc={setDoc} vehicle={vehicle} />}
        {step === 2 && <Step2 vehicle={vehicle} setEquip={setEquip} setDamage={setDamage} setLeak={setLeak} />}
        {step === 3 && <Step3 photos={photos} createdId={createdId} onUpload={handlePhotoUpload} />}

        {errors.general && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {errors.general}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--color-border)]">
          {step > 0 && step < 3 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" />
              Atras
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-light)] disabled:opacity-60 transition-colors"
            >
              {loading && <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />}
              {loading ? 'Guardando...' : step === 1 ? 'Guardar y continuar' : 'Siguiente'}
              {!loading && <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <button
              onClick={() => router.push('/flota')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-light)] transition-colors"
            >
              <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
              Finalizar registro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PASO 0: Datos del vehiculo ────────────────────────────────────
function Step0({ vehicle, setV, errors }) {
  return (
    <div className="flex flex-col gap-6">

      <Section title="A. Identificacion">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Placa del vehiculo" required error={errors.placa}>
            <Input value={vehicle.placa} onChange={(e) => setV('placa', e.target.value.toUpperCase())} placeholder="Ej: AEA-123" maxLength={8} />
          </FormField>
          <FormField label="Tipo de unidad" required error={errors.tipo}>
            <Select value={vehicle.tipo} onChange={(e) => setV('tipo', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="moto">Moto</option>
              <option value="auto">Auto</option>
              <option value="camioneta">Camioneta</option>
              <option value="vehiculo_pesado">Vehiculo pesado</option>
            </Select>
          </FormField>
          <FormField label="Marca">
            <Input value={vehicle.marca} onChange={(e) => setV('marca', e.target.value)} placeholder="Ej: Toyota" />
          </FormField>
          <FormField label="Modelo">
            <Input value={vehicle.modelo} onChange={(e) => setV('modelo', e.target.value)} placeholder="Ej: Hilux" />
          </FormField>
          <FormField label="Año de fabricacion">
            <Input type="number" value={vehicle.anio} onChange={(e) => setV('anio', e.target.value)} placeholder="Ej: 2022" min={1990} max={2030} />
          </FormField>
          <FormField label="Color">
            <Input value={vehicle.color} onChange={(e) => setV('color', e.target.value)} placeholder="Ej: Blanco" />
          </FormField>
          <FormField label="N° de motor">
            <Input value={vehicle.tipo_motor} onChange={(e) => setV('tipo_motor', e.target.value)} placeholder="N° de motor grabado" />
          </FormField>
          <FormField label="N° de chasis / serie">
            <Input value={vehicle.chasis} onChange={(e) => setV('chasis', e.target.value)} placeholder="N° de chasis o serie" />
          </FormField>
        </div>
      </Section>

      <Section title="B. Caracteristicas tecnicas">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Tipo de motor">
            <Select value={vehicle.tipo_motor} onChange={(e) => setV('tipo_motor', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="Diesel 2.8">Diesel 2.8</option>
              <option value="Diesel otro">Diesel otro</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Electrico / Hibrido">Electrico / Hibrido</option>
            </Select>
          </FormField>
          <FormField label="Transmision">
            <Select value={vehicle.transmision} onChange={(e) => setV('transmision', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="manual">Manual</option>
              <option value="automatica">Automatica</option>
            </Select>
          </FormField>
          <FormField label="Traccion">
            <Select value={vehicle.traccion} onChange={(e) => setV('traccion', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="4x4">4x4</option>
              <option value="4x2">4x2</option>
            </Select>
          </FormField>
          <FormField label="Propietario">
            <Select value={vehicle.propietario} onChange={(e) => setV('propietario', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="empresa">Empresa (SELCOSI)</option>
              <option value="leasing">Leasing</option>
              <option value="tercero">Tercero / otro</option>
            </Select>
          </FormField>
          <FormField label="GPS instalado">
            <Select value={vehicle.gps ? 'si' : 'no'} onChange={(e) => setV('gps', e.target.value === 'si')}>
              <option value="si">Si</option>
              <option value="no">No</option>
            </Select>
          </FormField>
        </div>
      </Section>

      <Section title="C. Estado operativo actual">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="KM actuales (odometro)" required error={errors.km_actuales}>
            <Input type="number" value={vehicle.km_actuales} onChange={(e) => setV('km_actuales', e.target.value)} placeholder="Ej: 45000" min={0} />
          </FormField>
          <FormField label="Zona / sede de operacion">
            <Select value={vehicle.zona} onChange={(e) => setV('zona', e.target.value)}>
              <option value="Juliaca">Juliaca</option>
            </Select>
          </FormField>
          <FormField label="Estado operativo">
            <Select value={vehicle.estado} onChange={(e) => setV('estado', e.target.value)}>
              <option value="operativo">Operativo</option>
              <option value="parcialmente">Parcialmente operativo</option>
              <option value="fuera_de_servicio">Fuera de servicio</option>
            </Select>
          </FormField>
          <FormField label="Conductor asignado">
            <Input value={vehicle.conductor} onChange={(e) => setV('conductor', e.target.value)} placeholder="Nombre del conductor" />
          </FormField>
          <FormField label="Contacto conductor (celular)">
            <Input type="tel" value={vehicle.conductor_tel} onChange={(e) => setV('conductor_tel', e.target.value)} placeholder="Ej: 951234567" />
          </FormField>
        </div>
        <FormField label="Problema activo (si aplica)">
          <Textarea value={vehicle.problema_activo} onChange={(e) => setV('problema_activo', e.target.value)} placeholder="Describe el problema o falla activa..." />
        </FormField>
      </Section>

      <Section title="D. Historial de mantenimiento">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Fecha del ultimo mantenimiento">
            <Input type="date" value={vehicle.fecha_ultimo_mant} onChange={(e) => setV('fecha_ultimo_mant', e.target.value)} />
          </FormField>
          <FormField label="KM en ultimo mantenimiento">
            <Input type="number" value={vehicle.km_ultimo_mant} onChange={(e) => setV('km_ultimo_mant', e.target.value)} placeholder="Ej: 40000" min={0} />
          </FormField>
          <FormField label="Tipo de servicio realizado">
            <Input value={vehicle.tipo_servicio_mant} onChange={(e) => setV('tipo_servicio_mant', e.target.value)} placeholder="Ej: Cambio de aceite y filtros" />
          </FormField>
          <FormField label="Taller donde se realizo">
            <Input value={vehicle.taller_mant} onChange={(e) => setV('taller_mant', e.target.value)} placeholder="Nombre del taller" />
          </FormField>
          <FormField label="Tiene registro / factura?">
            <Select value={vehicle.tiene_registro_factura} onChange={(e) => setV('tiene_registro_factura', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="si">Si</option>
              <option value="no">No</option>
              <option value="parcial">Parcial</option>
            </Select>
          </FormField>
        </div>
      </Section>

    </div>
  );
}

// ─── PASO 1: Documentacion ─────────────────────────────────────────
function Step1({ docs, setDoc, vehicle }) {
  return (
    <div className="flex flex-col gap-5">

      {/* SOAT */}
      <DocBlock title="A. SOAT — Seguro Obligatorio de Accidentes de Transito">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Tiene SOAT vigente?">
            <Select value={docs.soat.vigente} onChange={(e) => setDoc('soat', 'vigente', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="si">Si</option>
              <option value="no">No</option>
              <option value="vencido">Vencido</option>
            </Select>
          </FormField>
          <FormField label="Aseguradora">
            <Input value={docs.soat.aseguradora} onChange={(e) => setDoc('soat', 'aseguradora', e.target.value)} placeholder="Ej: Rimac" />
          </FormField>
          <FormField label="N° de poliza">
            <Input value={docs.soat.numero} onChange={(e) => setDoc('soat', 'numero', e.target.value)} placeholder="Numero de poliza" />
          </FormField>
          <FormField label="Fecha de vencimiento">
            <Input type="date" value={docs.soat.fecha_vencimiento} onChange={(e) => setDoc('soat', 'fecha_vencimiento', e.target.value)} />
          </FormField>
        </div>
        <DocDigitalizado hasDate={!!docs.soat.fecha_vencimiento} hasNumero={!!docs.soat.numero} />
      </DocBlock>

      {/* CITV */}
      <DocBlock title="B. CITV — Revision Tecnica Vehicular">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Tiene CITV vigente?">
            <Select value={docs.citv.vigente} onChange={(e) => setDoc('citv', 'vigente', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="si">Si</option>
              <option value="no">No</option>
              <option value="vencido">Vencido</option>
            </Select>
          </FormField>
          <FormField label="Frecuencia requerida">
            <Select value={docs.citv.frecuencia_citv} onChange={(e) => setDoc('citv', 'frecuencia_citv', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="anual">Anual (camioneta)</option>
              <option value="semestral">Semestral (camion / volquete)</option>
            </Select>
          </FormField>
          <FormField label="Centro de inspeccion">
            <Input value={docs.citv.centro_citv} onChange={(e) => setDoc('citv', 'centro_citv', e.target.value)} placeholder="Nombre del centro CITV" />
          </FormField>
          <FormField label="N° de certificado">
            <Input value={docs.citv.numero} onChange={(e) => setDoc('citv', 'numero', e.target.value)} placeholder="Numero de certificado" />
          </FormField>
          <FormField label="Fecha de vencimiento">
            <Input type="date" value={docs.citv.fecha_vencimiento} onChange={(e) => setDoc('citv', 'fecha_vencimiento', e.target.value)} />
          </FormField>
        </div>
        <DocDigitalizado hasDate={!!docs.citv.fecha_vencimiento} hasNumero={!!docs.citv.numero} />
      </DocBlock>

      {/* Tarjeta de Propiedad */}
      <DocBlock title="C. Tarjeta de Propiedad">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Tiene tarjeta de propiedad?">
            <Select value={docs.propiedad.vigente} onChange={(e) => setDoc('propiedad', 'vigente', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="si">Si</option>
              <option value="no">No</option>
            </Select>
          </FormField>
          <FormField label="Registrada a nombre de">
            <Input value={docs.propiedad.aseguradora} onChange={(e) => setDoc('propiedad', 'aseguradora', e.target.value)} placeholder="Razon social o nombre" />
          </FormField>
          <FormField label="La placa coincide?">
            <Select
              value={docs.propiedad.placa_coincide === null ? '' : docs.propiedad.placa_coincide ? 'si' : 'no'}
              onChange={(e) => setDoc('propiedad', 'placa_coincide', e.target.value === 'si' ? true : e.target.value === 'no' ? false : null)}
            >
              <option value="">Seleccionar...</option>
              <option value="si">Si</option>
              <option value="no">No — revisar</option>
            </Select>
          </FormField>
          <FormField label="N° de tarjeta">
            <Input value={docs.propiedad.numero} onChange={(e) => setDoc('propiedad', 'numero', e.target.value)} placeholder="Numero de documento" />
          </FormField>
        </div>
        <DocDigitalizado hasDate={false} hasNumero={!!docs.propiedad.numero} />
      </DocBlock>

      {/* Seguro Vehicular */}
      <DocBlock title="D. Seguro Vehicular Adicional">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Tiene seguro vehicular?">
            <Select value={docs.seguro.vigente} onChange={(e) => setDoc('seguro', 'vigente', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="si">Si</option>
              <option value="no">No</option>
              <option value="vencido">Vencido</option>
              <option value="no_aplica">No aplica</option>
            </Select>
          </FormField>
          {docs.seguro.vigente !== 'no_aplica' && docs.seguro.vigente !== 'no' && (
            <>
              <FormField label="Aseguradora">
                <Input value={docs.seguro.aseguradora} onChange={(e) => setDoc('seguro', 'aseguradora', e.target.value)} placeholder="Ej: Pacifico" />
              </FormField>
              <FormField label="N° de poliza">
                <Input value={docs.seguro.numero} onChange={(e) => setDoc('seguro', 'numero', e.target.value)} placeholder="Numero de poliza" />
              </FormField>
              <FormField label="Fecha de vencimiento">
                <Input type="date" value={docs.seguro.fecha_vencimiento} onChange={(e) => setDoc('seguro', 'fecha_vencimiento', e.target.value)} />
              </FormField>
            </>
          )}
        </div>
        {docs.seguro.vigente !== 'no_aplica' && docs.seguro.vigente !== 'no' && (
          <DocDigitalizado hasDate={!!docs.seguro.fecha_vencimiento} hasNumero={!!docs.seguro.numero} />
        )}
      </DocBlock>

    </div>
  );
}

// ─── PASO 2: Equipamiento de seguridad ────────────────────────────
function Step2({ vehicle, setEquip, setDamage, setLeak }) {
  return (
    <div className="flex flex-col gap-6">

      <Section title="Equipamiento de seguridad">
        <div className="flex flex-col divide-y divide-[var(--color-border)]">
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto] gap-4 pb-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            <span>Item</span>
            <span className="w-20 text-center">Presente</span>
            <span className="w-24 text-center">Estado</span>
          </div>
          {EQUIP_ITEMS.map((item) => {
            const val = vehicle.equipamiento[item] || {};
            return (
              <div key={item} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 sm:gap-4 py-3 items-center">
                <span className="text-sm text-[var(--color-text)]">{item}</span>
                <div className="flex gap-3 sm:w-20 sm:justify-center">
                  {['si', 'no'].map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`presente_${item}`}
                        value={opt}
                        checked={val.presente === opt}
                        onChange={() => setEquip(item, 'presente', opt)}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="text-sm capitalize">{opt}</span>
                    </label>
                  ))}
                </div>
                <div className="sm:w-24">
                  <Select
                    value={val.estado || ''}
                    onChange={(e) => setEquip(item, 'estado', e.target.value)}
                    className="text-xs py-1.5"
                  >
                    <option value="">-</option>
                    <option value="ok">OK</option>
                    <option value="regular">Regular</option>
                    <option value="mal">Mal</option>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Daños visibles en carroceria">
        <div className="flex flex-col gap-3">
          {DAMAGE_ZONES.map((zona) => (
            <div key={zona} className="grid grid-cols-[120px_1fr] gap-3 items-center">
              <span className="text-sm font-medium text-[var(--color-text)]">{zona}</span>
              <Input
                value={vehicle.danos_carroceria[zona] || ''}
                onChange={(e) => setDamage(zona, e.target.value)}
                placeholder="Sin daños visibles"
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Inspeccion bajo el vehiculo">
        <div className="flex flex-col divide-y divide-[var(--color-border)]">
          {LEAK_TYPES.map(({ key, label }) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3">
              <span className="text-sm text-[var(--color-text)]">{label}</span>
              <div className="flex gap-4">
                {['no', 'leve', 'grave'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={`fuga_${key}`}
                      value={opt}
                      checked={vehicle.fugas[key] === opt}
                      onChange={() => setLeak(key, opt)}
                      className="accent-[var(--color-primary)]"
                    />
                    <span className="text-sm capitalize">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
}

// ─── PASO 3: Fotografias ───────────────────────────────────────────
function Step3({ photos, createdId, onUpload }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[var(--color-text-secondary)]">
        Toma las 8 fotografias requeridas. Se guardan al instante al seleccionarlas.
        Puedes completarlas desde la ficha del vehiculo.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PHOTO_SLOTS.map(({ key, label }) => (
          <PhotoSlot
            key={key}
            label={label}
            preview={photos[key]}
            disabled={!createdId}
            onFile={(file) => onUpload(key, file)}
          />
        ))}
      </div>
      {!createdId && (
        <p className="text-xs text-[var(--color-status-critical)]">
          Completa los pasos anteriores para habilitar la subida de fotos.
        </p>
      )}
    </div>
  );
}

// ─── Componentes auxiliares ────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

function DocBlock({ title, children }) {
  return (
    <div className="border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-4">
      <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
      {children}
    </div>
  );
}

function DocDigitalizado({ hasDate, hasNumero }) {
  const digitalizado = hasDate || hasNumero;
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-xs text-[var(--color-text-muted)]">Documento digitalizado:</span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        digitalizado
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700'
      }`}>
        {digitalizado ? 'Si' : 'Pendiente'}
      </span>
    </div>
  );
}

function PhotoSlot({ label, preview, disabled, onFile }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-[var(--color-text)] leading-tight">{label}</p>
      <label className={disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}>
        <div className="aspect-square rounded-xl border-2 border-dashed border-[var(--color-border)] overflow-hidden flex items-center justify-center bg-[var(--color-surface-alt)] hover:border-[var(--color-primary)] transition-colors">
          {preview ? (
            <img src={preview} alt={label} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-[var(--color-text-muted)]">
              <FontAwesomeIcon icon={faCamera} className="w-5 h-5" />
              <span className="text-xs text-center px-1">Tomar foto</span>
            </div>
          )}
        </div>
        {!disabled && (
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
          />
        )}
      </label>
    </div>
  );
}
