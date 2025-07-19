import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

/**
 * Genera un número aleatorio dentro de un rango
 * 
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} - Número aleatorio entre min y max
 */
export function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Selecciona un elemento aleatorio de un array
 * 
 * @param {Array} array - Array de elementos
 * @returns {*} - Elemento aleatorio del array
 */
export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Formatea la respuesta para que sea más legible en la consola
 * 
 * @param {Object} data - Datos de la respuesta
 * @returns {Object} - Objeto con los formatos para la salida
 */
export function formatSummary(data, testName) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    [`./k6-results-${testName}.json`]: JSON.stringify(data),
  };
}

/**
 * Configuraciones de umbrales predefinidas para pruebas
 */
export const thresholds = {
  // Configuración base común para todas las pruebas
  base: {
    'http_req_duration': ['p(95)<2000'],     // 2 segundos para el percentil 95
    'http_req_failed': ['rate<0.05'],        // 5% de fallos permitidos
    'login_errors': ['count<3'],             // Máximo 3 errores de login
  },
  
  // Umbrales específicos para pruebas de catálogo
  catalog: {
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
    'login_errors': ['count<3'],
    'product_errors': ['count<3'],
    'catalog_call_duration': ['p(95)<2500'],
  },
  
  // Umbrales específicos para pruebas de facturas
  invoices: {
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
    'login_errors': ['count<3'],
    'invoice_errors': ['count<3'],
    'invoice_call_duration': ['p(95)<2500'],
  },
  
  // Umbrales específicos para pruebas de contactos
  contacts: {
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
    'login_errors': ['count<3'],
    'contact_errors': ['count<3'],
    'contact_call_duration': ['p(95)<2500'],
  },
  
  // Configuración más estricta para pruebas avanzadas (producción)
  production: {
    'http_req_duration': ['p(90)<800', 'p(95)<1200', 'p(99)<1800'],
    'http_req_failed': ['rate<0.01'],        // 1% de fallos permitidos
    'login_errors': ['count<1'],             // Máximo 1 error de login
  }
};
