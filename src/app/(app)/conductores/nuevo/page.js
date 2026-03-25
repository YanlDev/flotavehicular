'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import FormField, { Input, Select, Textarea } from '@/components/ui/FormField';

const INITIAL = {
  nombres: '', apellidos: '', dni: '', telefono: '',
  fecha_nacimiento: '', numero_licencia: '',
  licencia_categoria: '', licencia_vencimiento: '',
  estado: 'activo', observaciones: '',
};

export default function NuevoConductorPage() {
  const router = useRouter();
  const [form, setForm]     = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function setF(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.nombres.trim())   e.nombres   = 'El nombre es obligatorio';
    if (!form.apellidos.trim()) e.apellidos = 'El apellido es obligatorio';
    if (!form.dni.trim())       e.dni       = 'El DNI es obligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const res = await fetch('/api/conductors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setErrors({ general: data.error?.includes('unique') ? 'Ya existe un conductor con ese DNI' : data.error });
      return;
    }
    router.push(`/conductores/${form.dni}`);
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">

      <div className="flex items-center gap-3">
        <Link href="/conductores" className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-colors">
          <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Nuevo conductor</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Registro de conductor — SELCOSI</p>
        </div>
      </div>

      {errors.general && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errors.general}
        </div>
      )}

      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 flex flex-col gap-5">

        <Section title="Datos personales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Nombres" required error={errors.nombres}>
              <Input value={form.nombres} onChange={(e) => setF('nombres', e.target.value)} placeholder="Ej: Juan Carlos" />
            </FormField>
            <FormField label="Apellidos" required error={errors.apellidos}>
              <Input value={form.apellidos} onChange={(e) => setF('apellidos', e.target.value)} placeholder="Ej: Quispe Mamani" />
            </FormField>
            <FormField label="DNI" required error={errors.dni}>
              <Input value={form.dni} onChange={(e) => setF('dni', e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="8 digitos" maxLength={8} />
            </FormField>
            <FormField label="Telefono / celular">
              <Input type="tel" value={form.telefono} onChange={(e) => setF('telefono', e.target.value)} placeholder="Ej: 951234567" />
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

        <Section title="Brevete (licencia de conducir)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="N° de brevete">
              <Input value={form.numero_licencia} onChange={(e) => setF('numero_licencia', e.target.value.toUpperCase())} placeholder="Ej: Q54312345" />
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
          <Textarea
            value={form.observaciones}
            onChange={(e) => setF('observaciones', e.target.value)}
            placeholder="Notas adicionales, restricciones, antecedentes relevantes..."
          />
        </Section>

      </div>

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
          {saving ? 'Guardando...' : 'Registrar conductor'}
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
