import { differenceInDays, parseISO } from 'date-fns';

/**
 * Calcula el estado del semaforo de un documento segun su fecha de vencimiento.
 * @param {string|null} fechaVencimiento - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {{ estado: 'ok'|'alert'|'critical'|'nodata', diasRestantes: number|null }}
 */
export function calcularSemaforo(fechaVencimiento) {
  if (!fechaVencimiento) {
    return { estado: 'nodata', diasRestantes: null };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = parseISO(fechaVencimiento);
  const dias = differenceInDays(vencimiento, hoy);

  if (dias <= 15) return { estado: 'critical', diasRestantes: dias };
  if (dias <= 45) return { estado: 'alert', diasRestantes: dias };
  return { estado: 'ok', diasRestantes: dias };
}

/**
 * Calcula el semaforo global de un vehiculo basado en todos sus documentos.
 * Retorna el estado mas critico encontrado.
 * @param {import('../types/fleet').VehicleDocument[]} documentos
 * @returns {'ok'|'alert'|'critical'|'nodata'}
 */
export function semaforoGlobal(documentos) {
  if (!documentos || documentos.length === 0) return 'nodata';

  const prioridad = { critical: 0, alert: 1, nodata: 2, ok: 3 };
  let peor = 'ok';

  for (const doc of documentos) {
    const { estado } = calcularSemaforo(doc.fecha_vencimiento);
    if (prioridad[estado] < prioridad[peor]) {
      peor = estado;
    }
  }

  return peor;
}

/**
 * Clases de color Tailwind segun el estado del semaforo.
 */
export const SEMAFORO_CLASES = {
  ok:       { bg: 'bg-[var(--color-status-ok)]',       text: 'text-white', label: 'Vigente' },
  alert:    { bg: 'bg-[var(--color-status-alert)]',    text: 'text-white', label: 'Por vencer' },
  critical: { bg: 'bg-[var(--color-status-critical)]', text: 'text-white', label: 'Critico' },
  nodata:   { bg: 'bg-[var(--color-status-nodata)]',   text: 'text-white', label: 'Sin datos' },
};
