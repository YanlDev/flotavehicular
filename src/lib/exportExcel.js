import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { calcularSemaforo } from './semaforo';

/**
 * Formatea una fecha ISO para mostrar en Excel.
 * @param {string|null} fecha
 */
function formatFecha(fecha) {
  if (!fecha) return 'Sin datos';
  try {
    return format(parseISO(fecha), 'dd/MM/yyyy');
  } catch {
    return fecha;
  }
}

/**
 * Obtiene el estado del semaforo como texto.
 * @param {string|null} fecha
 */
function estadoTexto(fecha) {
  const { estado, diasRestantes } = calcularSemaforo(fecha);
  if (estado === 'nodata') return 'Sin datos';
  if (estado === 'critical') return diasRestantes < 0 ? 'VENCIDO' : `CRITICO (${diasRestantes}d)`;
  if (estado === 'alert') return `ALERTA (${diasRestantes}d)`;
  return `VIGENTE (${diasRestantes}d)`;
}

/**
 * Genera y descarga un archivo Excel con el inventario completo de flota.
 * @param {Array} vehiculos - Lista de vehiculos con sus documentos
 */
export function exportarInventarioExcel(vehiculos) {
  const filas = vehiculos.map((v) => {
    const docs = v.vehicle_documents || [];
    const getDoc = (tipo) => docs.find((d) => d.tipo_documento === tipo) || {};

    const soat     = getDoc('soat');
    const citv     = getDoc('citv');
    const seguro   = getDoc('seguro');
    const propiedad = getDoc('propiedad');

    return {
      'Placa':               v.placa,
      'Tipo':                v.tipo,
      'Marca':               v.marca || '',
      'Modelo':              v.modelo || '',
      'Año':                 v.anio || '',
      'Color':               v.color || '',
      'Motor':               v.motor || '',
      'Transmision':         v.transmision || '',
      'Traccion':            v.traccion || '',
      'Propietario':         v.propietario || '',
      'KM Actuales':         v.km_actuales || '',
      'Zona':                v.zona || '',
      'Conductor':           v.conductor || '',
      'Tel. Conductor':      v.conductor_tel || '',
      'Estado Operativo':    v.estado || '',
      'Observaciones':       v.observaciones || '',
      // SOAT
      'SOAT - Aseguradora':  soat.aseguradora || '',
      'SOAT - N° Poliza':    soat.numero || '',
      'SOAT - Vencimiento':  formatFecha(soat.fecha_vencimiento),
      'SOAT - Estado':       estadoTexto(soat.fecha_vencimiento),
      // CITV
      'CITV - N° Cert.':     citv.numero || '',
      'CITV - Centro':       citv.centro_citv || '',
      'CITV - Vencimiento':  formatFecha(citv.fecha_vencimiento),
      'CITV - Estado':       estadoTexto(citv.fecha_vencimiento),
      // Seguro
      'Seguro - Aseguradora': seguro.aseguradora || '',
      'Seguro - N° Poliza':   seguro.numero || '',
      'Seguro - Vencimiento': formatFecha(seguro.fecha_vencimiento),
      'Seguro - Estado':      estadoTexto(seguro.fecha_vencimiento),
      // Tarjeta de propiedad
      'Propiedad - A nombre de': propiedad.aseguradora || '',
      'Propiedad - Numero':      propiedad.numero || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(filas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario Flota');

  const fecha = format(new Date(), 'yyyyMMdd');
  XLSX.writeFile(wb, `SELCOSI_Flota_${fecha}.xlsx`);
}
