'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faSpinner, faCheck } from '@fortawesome/free-solid-svg-icons';
import FormField, { Input, Select, Textarea } from '@/components/ui/FormField';

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
  { key: 'combustible',  label: 'Combustible (gasoil)' },
  { key: 'liquido_frenos', label: 'Liquido de frenos' },
];

export default function EditarVehiculoPage() {
  const { placa } = useParams();
  const router    = useRouter();

  const [vehicle, setVehicle] = useState(null);
  const [form, setForm]       = useState(null);
  const [docs, setDocs]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then((data) => {
        const v = data.find((v) => v.placa === placa?.toUpperCase());
        if (!v) { setLoading(false); return; }
        setVehicle(v);
        setForm({
          placa:              v.placa || '',
          tipo:               v.tipo || '',
          marca:              v.marca || '',
          modelo:             v.modelo || '',
          anio:               v.anio || '',
          color:              v.color || '',
          tipo_motor:         v.tipo_motor || '',
          chasis:             v.chasis || '',
          transmision:        v.transmision || '',
          traccion:           v.traccion || '',
          propietario:        v.propietario || '',
          gps:                v.gps ?? false,
          km_actuales:        v.km_actuales || '',
          zona:               v.zona || 'Juliaca',
          estado:             v.estado || 'operativo',
          conductor:          v.conductor || '',
          conductor_tel:      v.conductor_tel || '',
          problema_activo:    v.problema_activo || '',
          km_ultimo_mant:     v.km_ultimo_mant || '',
          fecha_ultimo_mant:  v.fecha_ultimo_mant || '',
          tipo_servicio_mant: v.tipo_servicio_mant || '',
          taller_mant:        v.taller_mant || '',
          tiene_registro_factura: v.tiene_registro_factura || '',
          equipamiento:       v.equipamiento || {},
          danos_carroceria:   v.danos_carroceria || {},
          fugas:              v.fugas || {},
        });

        const docsMap = {};
        for (const d of v.vehicle_documents || []) {
          docsMap[d.tipo_documento] = {
            tipo_documento:  d.tipo_documento,
            vigente:         d.vigente || '',
            numero:          d.numero || '',
            aseguradora:     d.aseguradora || '',
            centro_citv:     d.centro_citv || '',
            fecha_vencimiento: d.fecha_vencimiento || '',
            frecuencia_citv: d.frecuencia_citv || '',
            placa_coincide:  d.placa_coincide ?? null,
          };
        }
        setDocs({
          soat:      docsMap.soat      || { tipo_documento: 'soat',      vigente: '', numero: '', aseguradora: '', fecha_vencimiento: '' },
          citv:      docsMap.citv      || { tipo_documento: 'citv',      vigente: '', numero: '', centro_citv: '', fecha_vencimiento: '', frecuencia_citv: '' },
          seguro:    docsMap.seguro    || { tipo_documento: 'seguro',    vigente: 'no_aplica', numero: '', aseguradora: '', fecha_vencimiento: '' },
          propiedad: docsMap.propiedad || { tipo_documento: 'propiedad', vigente: '', numero: '', aseguradora: '', placa_coincide: null },
        });
        setLoading(false);
      });
  }, [placa]);

  function setF(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }
  function setDoc(tipo, field, value) {
    setDocs((p) => ({ ...p, [tipo]: { ...p[tipo], [field]: value } }));
  }
  function setEquip(item, field, value) {
    setForm((p) => ({ ...p, equipamiento: { ...p.equipamiento, [item]: { ...p.equipamiento[item], [field]: value } } }));
  }
  function setDamage(zona, value) {
    setForm((p) => ({ ...p, danos_carroceria: { ...p.danos_carroceria, [zona]: value } }));
  }
  function setLeak(tipo, value) {
    setForm((p) => ({ ...p, fugas: { ...p.fugas, [tipo]: value } }));
  }

  async function handleSave() {
    if (!form.placa.trim()) { setErrors({ placa: 'La placa es obligatoria' }); return; }
    if (!form.tipo)         { setErrors({ tipo: 'Selecciona el tipo' }); return; }

    setSaving(true);
    const documents = Object.values(docs);
    const res = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, documents }),
    });

    setSaving(false);
    if (res.ok) router.push(`/flota/${form.placa}`);
    else {
      const data = await res.json();
      setErrors({ general: data.error || 'Error al guardar' });
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-[var(--color-text-muted)] text-sm">
      Cargando...
    </div>
  );
  if (!vehicle) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <p className="text-[var(--color-text-secondary)]">Vehiculo no encontrado</p>
      <Link href="/flota" className="text-sm text-[var(--color-primary)] hover:underline">Volver</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/flota/${placa}`} className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Editar unidad</h1>
            <p className="text-sm text-[var(--color-text-secondary)] font-mono">{vehicle.placa}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-light)] disabled:opacity-60 transition-colors"
        >
          {saving
            ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
            : <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
          }
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {errors.general && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errors.general}
        </div>
      )}

      {/* A. Identificacion */}
      <Section title="A. Identificacion">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Placa" required error={errors.placa}>
            <Input value={form.placa} onChange={(e) => setF('placa', e.target.value.toUpperCase())} maxLength={8} />
          </FormField>
          <FormField label="Tipo de unidad" required error={errors.tipo}>
            <Select value={form.tipo} onChange={(e) => setF('tipo', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="moto">Moto</option>
              <option value="auto">Auto</option>
              <option value="camioneta">Camioneta</option>
              <option value="vehiculo_pesado">Vehiculo pesado</option>
            </Select>
          </FormField>
          <FormField label="Marca"><Input value={form.marca} onChange={(e) => setF('marca', e.target.value)} /></FormField>
          <FormField label="Modelo"><Input value={form.modelo} onChange={(e) => setF('modelo', e.target.value)} /></FormField>
          <FormField label="Año"><Input type="number" value={form.anio} onChange={(e) => setF('anio', e.target.value)} min={1990} max={2030} /></FormField>
          <FormField label="Color"><Input value={form.color} onChange={(e) => setF('color', e.target.value)} /></FormField>
          <FormField label="N° de motor"><Input value={form.tipo_motor} onChange={(e) => setF('tipo_motor', e.target.value)} /></FormField>
          <FormField label="N° de chasis"><Input value={form.chasis} onChange={(e) => setF('chasis', e.target.value)} /></FormField>
        </div>
      </Section>

      {/* B. Caracteristicas */}
      <Section title="B. Caracteristicas tecnicas">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Tipo de motor">
            <Select value={form.tipo_motor} onChange={(e) => setF('tipo_motor', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="Diesel 2.8">Diesel 2.8</option>
              <option value="Diesel otro">Diesel otro</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Electrico / Hibrido">Electrico / Hibrido</option>
            </Select>
          </FormField>
          <FormField label="Transmision">
            <Select value={form.transmision} onChange={(e) => setF('transmision', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="manual">Manual</option>
              <option value="automatica">Automatica</option>
            </Select>
          </FormField>
          <FormField label="Traccion">
            <Select value={form.traccion} onChange={(e) => setF('traccion', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="4x4">4x4</option>
              <option value="4x2">4x2</option>
            </Select>
          </FormField>
          <FormField label="Propietario">
            <Select value={form.propietario} onChange={(e) => setF('propietario', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="empresa">Empresa (SELCOSI)</option>
              <option value="leasing">Leasing</option>
              <option value="tercero">Tercero / otro</option>
            </Select>
          </FormField>
          <FormField label="GPS">
            <Select value={form.gps ? 'si' : 'no'} onChange={(e) => setF('gps', e.target.value === 'si')}>
              <option value="si">Si</option>
              <option value="no">No</option>
            </Select>
          </FormField>
        </div>
      </Section>

      {/* C. Estado operativo */}
      <Section title="C. Estado operativo">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="KM actuales">
            <Input type="number" value={form.km_actuales} onChange={(e) => setF('km_actuales', e.target.value)} min={0} />
          </FormField>
          <FormField label="Zona">
            <Select value={form.zona} onChange={(e) => setF('zona', e.target.value)}>
              <option value="Juliaca">Juliaca</option>
            </Select>
          </FormField>
          <FormField label="Estado operativo">
            <Select value={form.estado} onChange={(e) => setF('estado', e.target.value)}>
              <option value="operativo">Operativo</option>
              <option value="parcialmente">Parcialmente operativo</option>
              <option value="fuera_de_servicio">Fuera de servicio</option>
            </Select>
          </FormField>
          <FormField label="Conductor">
            <Input value={form.conductor} onChange={(e) => setF('conductor', e.target.value)} />
          </FormField>
          <FormField label="Telefono conductor">
            <Input type="tel" value={form.conductor_tel} onChange={(e) => setF('conductor_tel', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Problema activo">
          <Textarea value={form.problema_activo} onChange={(e) => setF('problema_activo', e.target.value)} />
        </FormField>
      </Section>

      {/* D. Mantenimiento */}
      <Section title="D. Historial de mantenimiento">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Fecha ultimo mantenimiento">
            <Input type="date" value={form.fecha_ultimo_mant} onChange={(e) => setF('fecha_ultimo_mant', e.target.value)} />
          </FormField>
          <FormField label="KM en ultimo mantenimiento">
            <Input type="number" value={form.km_ultimo_mant} onChange={(e) => setF('km_ultimo_mant', e.target.value)} min={0} />
          </FormField>
          <FormField label="Tipo de servicio">
            <Input value={form.tipo_servicio_mant} onChange={(e) => setF('tipo_servicio_mant', e.target.value)} />
          </FormField>
          <FormField label="Taller">
            <Input value={form.taller_mant} onChange={(e) => setF('taller_mant', e.target.value)} />
          </FormField>
          <FormField label="Tiene registro/factura">
            <Select value={form.tiene_registro_factura} onChange={(e) => setF('tiene_registro_factura', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="si">Si</option>
              <option value="no">No</option>
              <option value="parcial">Parcial</option>
            </Select>
          </FormField>
        </div>
      </Section>

      {/* Documentacion */}
      <Section title="Documentacion legal">
        {[
          { key: 'soat',      title: 'SOAT',                    showAseg: true,  showCitv: false, showFecha: true },
          { key: 'citv',      title: 'CITV — Revision Tecnica', showAseg: false, showCitv: true,  showFecha: true },
          { key: 'seguro',    title: 'Seguro vehicular',        showAseg: true,  showCitv: false, showFecha: true },
          { key: 'propiedad', title: 'Tarjeta de propiedad',    showAseg: true,  showCitv: false, showFecha: false },
        ].map(({ key, title, showAseg, showCitv, showFecha }) => (
          <div key={key} className="border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-3 mb-3">
            <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Estado">
                <Select value={docs[key].vigente} onChange={(e) => setDoc(key, 'vigente', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="si">Si — Vigente</option>
                  <option value="no">No</option>
                  <option value="vencido">Vencido</option>
                  {key === 'seguro' && <option value="no_aplica">No aplica</option>}
                </Select>
              </FormField>
              {showAseg && (
                <FormField label={key === 'propiedad' ? 'Registrada a nombre de' : 'Aseguradora'}>
                  <Input value={docs[key].aseguradora} onChange={(e) => setDoc(key, 'aseguradora', e.target.value)} />
                </FormField>
              )}
              {showCitv && (
                <>
                  <FormField label="Centro de inspeccion">
                    <Input value={docs[key].centro_citv} onChange={(e) => setDoc(key, 'centro_citv', e.target.value)} />
                  </FormField>
                  <FormField label="Frecuencia">
                    <Select value={docs[key].frecuencia_citv} onChange={(e) => setDoc(key, 'frecuencia_citv', e.target.value)}>
                      <option value="">Seleccionar...</option>
                      <option value="anual">Anual (camioneta)</option>
                      <option value="semestral">Semestral (camion/volquete)</option>
                    </Select>
                  </FormField>
                </>
              )}
              <FormField label="N° de documento">
                <Input value={docs[key].numero} onChange={(e) => setDoc(key, 'numero', e.target.value)} />
              </FormField>
              {showFecha && (
                <FormField label="Fecha de vencimiento">
                  <Input type="date" value={docs[key].fecha_vencimiento} onChange={(e) => setDoc(key, 'fecha_vencimiento', e.target.value)} />
                </FormField>
              )}
              {key === 'propiedad' && (
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
              )}
            </div>
          </div>
        ))}
      </Section>

      {/* Equipamiento */}
      <Section title="Equipamiento de seguridad">
        <div className="flex flex-col divide-y divide-[var(--color-border)]">
          {EQUIP_ITEMS.map((item) => {
            const val = form.equipamiento[item] || {};
            return (
              <div key={item} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 sm:gap-4 py-3 items-center">
                <span className="text-sm text-[var(--color-text)]">{item}</span>
                <div className="flex gap-3 sm:w-20 sm:justify-center">
                  {['si','no'].map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name={`e_${item}`} value={opt} checked={val.presente === opt}
                        onChange={() => setEquip(item, 'presente', opt)} className="accent-[var(--color-primary)]" />
                      <span className="text-sm capitalize">{opt}</span>
                    </label>
                  ))}
                </div>
                <div className="sm:w-24">
                  <Select value={val.estado || ''} onChange={(e) => setEquip(item, 'estado', e.target.value)} className="text-xs py-1.5">
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

        <div className="mt-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Daños en carroceria</p>
          {DAMAGE_ZONES.map((zona) => (
            <div key={zona} className="grid grid-cols-[130px_1fr] gap-3 items-center">
              <span className="text-sm font-medium text-[var(--color-text)]">{zona}</span>
              <Input value={form.danos_carroceria[zona] || ''} onChange={(e) => setDamage(zona, e.target.value)} placeholder="Sin daños" />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">Fugas</p>
          {LEAK_TYPES.map(({ key, label }) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-t border-[var(--color-border)]">
              <span className="text-sm text-[var(--color-text)]">{label}</span>
              <div className="flex gap-4">
                {['no','leve','grave'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name={`f_${key}`} value={opt} checked={form.fugas[key] === opt}
                      onChange={() => setLeak(key, opt)} className="accent-[var(--color-primary)]" />
                    <span className="text-sm capitalize">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Boton guardar inferior */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-light)] disabled:opacity-60 transition-colors"
        >
          {saving
            ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
            : <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
          }
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 flex flex-col gap-4">
      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}
