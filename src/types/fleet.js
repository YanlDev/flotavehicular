/**
 * @typedef {'camioneta'|'camion'|'volquete'} TipoUnidad
 * @typedef {'operativa'|'mantenimiento'|'inoperativa'} EstadoOperativo
 * @typedef {'soat'|'citv'|'propiedad'|'seguro'} TipoDocumento
 * @typedef {'placa'|'odometro'|'estado'|'general'} TipoFoto
 * @typedef {'ok'|'alert'|'critical'|'nodata'} EstadoSemaforo
 */

/**
 * @typedef {Object} Vehicle
 * @property {string} id
 * @property {string} placa
 * @property {TipoUnidad} tipo
 * @property {string} marca
 * @property {string} modelo
 * @property {number} anio
 * @property {string} color
 * @property {string} motor
 * @property {string} transmision
 * @property {string} traccion
 * @property {string} propietario
 * @property {number} km_actuales
 * @property {string} zona
 * @property {string} conductor
 * @property {string} conductor_tel
 * @property {EstadoOperativo} estado
 * @property {string} observaciones
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} VehicleDocument
 * @property {string} id
 * @property {string} vehicle_id
 * @property {TipoDocumento} tipo_documento
 * @property {string} numero
 * @property {string} aseguradora
 * @property {string} fecha_vencimiento
 * @property {string} centro_citv
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} VehiclePhoto
 * @property {string} id
 * @property {string} vehicle_id
 * @property {TipoFoto} tipo
 * @property {string} url
 * @property {string} key
 * @property {string} created_at
 */
