'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import FormField, { Input, Select, Textarea } from '@/components/ui/FormField';

export default function EditarConductorPage() {
  const { dni }  = useParams();
  const router   = useRouter();
  const [conductor, setConductor] = useState(null);
  const [form, setForm]           = useState(null);
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    fetch('/api/conductors')
      .then((r) => r.json())
      .then((data) => {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(dni);
        const c = data.find((c) => isUUID ? c.id === dni : c.dni === decodeURIComponent(dni));
        if (c) {
          setConductor(c);
          setForm({
            nombres:             c.nombres || '',
            apellidos:           c.apellidos || '',
            dni:                 c.dni || '',
            telefono:            c.telefono || '',
            fecha_nacimiento:    c.fecha_nacimiento || '',
            numero_licencia:     c.numero_licencia || '',
            licencia_categoria:  c.licencia_categoria || '',
            licencia_vencimiento: c.licencia_vencimiento || '',
            estado:              c.estado || 'activo',
            observaciones:       c.observaciones || '',
          });
        }
        setLoading(false);
      });
  }, [dni]);

  function setF(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  async function handleSave() {
    const e = {};
    if (!form.nombres.trim())   e.nombres   = 'Obligatorio';
    if (!form.apellidos.trim()) e.apellidos = 'Obligatorio';
    if (!form.dni.trim())       e.dni       = 'Obligatorio';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    const res = await fetch(`/api/conductors/${conductor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSaving(false);
    if (res.ok) router.push(`/conductores/${form.dni || conductor.id}`);
    else setErrors({ general: data.error || 'Error al guardar' });
  }

  if (loading) return <div className="flex justify-center py-24 text-sm text-[var(--color-text-muted)]">Cargando...</div>;
  if (!conductor) return <div className="flex justify-center py-24 text-sm text-[var(--color-text-muted)]">Conductor no encontrado</div>;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/conductores/${dni}`} className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Editar conductor</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">{conductor.apellidos}, {conductor.nombres}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-light)] disabled:opacity-60 transition-colors"
        >
          {saving ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" /> : <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />}
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {errors.general && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{errors.general}</div>
      )}

      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 flex flex-col gap-5">

        <Section title="Datos personales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Nombres" required error={errors.nombres}>
              <Input value={form.nombres} onChange={(e) => setF('nombres', e.target.value)} />
            </FormField>
            <FormField label="Apellidos" required error={errors.apellidos}>
              <Input value={form.apellidos} onChange={(e) => setF('apellidos', e.target.value)} />
            </FormField>
            <FormField label="DNI" required error={errors.dni}>
              <Input value={form.dni} onChange={(e) => setF('dni', e.target.value.replace(/\D/g, '').slice(0, 8))} maxLength={8} />
            </FormField>
            <FormField label="Telefono">
              <Input type="tel" value={form.telefono} onChange={(e) => setF('telefono', e.target.value)} />
            </FormField>
            <FormField label="Fecha de nacimiento">
              <Input type="date" value={form.fecha_nacimiento} onChange={(e) => setF('fecha_nacimiento', e.target.value)} />
            </FormField>
            <FormField label="Estado">
              <Select value={form.estado} onChange={(e) => setF('estado', e.target.value)}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </Select>
            </FormField>
          </div>
        </Section>

        <Section title="Brevete">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="N° de brevete">
              <Input value={form.numero_licencia} onChange={(e) => setF('numero_licencia', e.target.value.toUpperCase())} />
            </FormField>
            <FormField label="Categoria">
              <Select value={form.licencia_categoria} onChange={(e) => setF('licencia_categoria', e.target.value)}>
                <option value="">Seleccionar...</option>
                <optgroup label="Clase B — 2 o 3 ruedas">
                  <option value="B-I">B-I — Triciclos transporte publico</option>
                  <option value="B-IIa">B-IIa — Bicimotos</option>
                  <option value="B-IIb">B-IIb — Bicimotos y motocicletas</option>
                  <option value="B-IIc">B-IIc — B-IIb + Mototaxis y trimotos</option>
                </optgroup>
                <optgroup label="Clase A — Vehiculos motorizados">
                  <option value="A-I">A-I — Autos, SUV, pickup, furgones</option>
                  <option value="A-IIa">A-IIa — A-I + taxis, buses, ambulancias</option>
                  <option value="A-IIb">A-IIb — A-IIa + microbuses y minibuses</option>
                  <option value="A-IIIa">A-IIIa — A-IIb + omnibuses urbanos e interurbanos</option>
                  <option value="A-IIIb">A-IIIb — A-IIb + volquetes, gruas, remolques</option>
                  <option value="A-IIIc">A-IIIc — Todas las categorias anteriores</option>
                </optgroup>
              </Select>
            </FormField>
            <FormField label="Fecha de vencimiento">
              <Input type="date" value={form.licencia_vencimiento} onChange={(e) => setF('licencia_vencimiento', e.target.value)} />
            </FormField>
          </div>
        </Section>

        <Section title="Observaciones">
          <Textarea value={form.observaciones} onChange={(e) => setF('observaciones', e.target.value)} placeholder="Notas adicionales..." />
        </Section>

      </div>

      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-light)] disabled:opacity-60 transition-colors"
        >
          {saving ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" /> : <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}
