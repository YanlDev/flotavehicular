-- ============================================================
-- SELCOSI FLOTA — Schema de referencia
-- Generado: 2026-03-28
-- Proyecto Supabase: ydcuxnzpynvpzvuvaicr (selcosi-flota)
-- ============================================================

-- ─── TABLA: vehicles ──────────────────────────────────────────
CREATE TABLE vehicles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placa                 text NOT NULL UNIQUE,
  tipo                  text NOT NULL CHECK (tipo IN ('moto','auto','camioneta','vehiculo_pesado')),
  marca                 text,
  modelo                text,
  anio                  integer,
  color                 text,
  motor                 text,                    -- N° de serie grabado en el motor
  tipo_motor            text,                    -- Diesel 2.8 / Gasolina / etc.
  chasis                text,
  transmision           text CHECK (transmision IN ('manual','automatica')),
  traccion              text CHECK (traccion IN ('4x4','4x2')),
  propietario           text,                    -- RUC asociado (texto libre, sin constraint)
  km_actuales           integer,
  zona                  text DEFAULT 'Juliaca',
  conductor             text,
  conductor_tel         text,
  estado                text DEFAULT 'operativo' CHECK (estado IN ('operativo','parcialmente','fuera_de_servicio')),
  problema_activo       text,
  observaciones         text,
  gps                   boolean DEFAULT false,
  -- Mantenimiento (columnas legacy, módulo separado en desarrollo)
  km_ultimo_mant        integer,
  fecha_ultimo_mant     date,
  tipo_servicio_mant    text,
  taller_mant           text,
  tiene_registro_factura text CHECK (tiene_registro_factura IN ('si','no','parcial')),
  -- Inspección visual (JSON)
  equipamiento          jsonb DEFAULT '{}',
  danos_carroceria      jsonb DEFAULT '{}',
  fugas                 jsonb DEFAULT '{}',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- ─── TABLA: vehicle_documents ────────────────────────────────
CREATE TABLE vehicle_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id        uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  tipo_documento    text NOT NULL CHECK (tipo_documento IN ('soat','citv','propiedad','seguro')),
  numero            text,
  aseguradora       text,
  fecha_vencimiento date,
  vigente           text CHECK (vigente IN ('si','no','vencido','no_aplica')),
  placa_coincide    boolean,
  centro_citv       text,
  frecuencia_citv   text CHECK (frecuencia_citv IN ('anual','semestral')),
  -- Adjunto PDF del documento
  file_url          text,
  file_key          text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE (vehicle_id, tipo_documento)
);

-- ─── TABLA: vehicle_photos ───────────────────────────────────
CREATE TABLE vehicle_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  tipo        text NOT NULL CHECK (tipo IN ('placa','odometro','frontal','lateral_der','lateral_izq','posterior','cabina','guantera')),
  url         text NOT NULL,
  key         text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ─── TABLA: vehicle_infractions ──────────────────────────────
-- Registro manual de papeletas/infracciones SUTRAN, SAT, MTC, Municipio
CREATE TABLE vehicle_infractions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  fecha           date NOT NULL,
  entidad         text NOT NULL CHECK (entidad IN ('sutran','sat','mtc','municipio','otro')),
  codigo          text,                          -- Código de infracción (ej: M.1, E.8)
  descripcion     text,
  monto           numeric(10,2),
  estado          text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagado','apelado','anulado')),
  fecha_pago      date,
  referencia_pago text,
  -- Adjunto PDF de la papeleta
  file_url        text,
  file_key        text,
  observaciones   text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ─── TABLA: conductors ───────────────────────────────────────
CREATE TABLE conductors (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres             text NOT NULL,
  apellidos           text,
  dni                 text UNIQUE,
  telefono            text,
  zona                text DEFAULT 'Juliaca',
  licencia_categoria  text,
  numero_licencia     text,
  licencia_vencimiento date,
  fecha_nacimiento    date,
  estado              text DEFAULT 'activo' CHECK (estado IN ('activo','inactivo','suspendido')),
  observaciones       text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ─── MIGRACIÓN 001: propietario sin constraint ───────────────
-- ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_propietario_check;
-- (ya aplicada 2026-03-28)

-- ─── MIGRACIÓN 002: PDF en documentos + tabla infracciones ───
-- Ver: migrations/002_docs_pdf_and_infractions.sql
