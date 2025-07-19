import { sleep, group } from 'k6';
import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Importamos funciones compartidas
import { performLogin, getAuthHeaders, loginErrors } from './shared/auth.js';
import { randomNumber, randomItem, formatSummary, thresholds } from './shared/utils.js';

// Métrica para errores y duración de llamadas a facturas
export const invoiceErrors = new Counter('invoice_errors');
export const invoiceCallDuration = new Trend('invoice_call_duration');

// Opciones de la prueba
export const options = {
  // Configuración de la carga - versión ligera
  vus: 2,                  // Solo 2 usuarios virtuales concurrentes
  duration: '10s',         // Duración corta: 10 segundos

  // Umbrales de rendimiento específicos para facturas
  thresholds: thresholds.invoices,
};

// Variables de entorno
const baseUrl = __ENV.API_BASE || 'https://api.factupro.com/api/v1';
const merchantId = __ENV.MERCHANT_ID || '';
const testUser = {
  email: __ENV.USER_EMAIL || 'usuario@test.com',
  password: __ENV.USER_PASSWORD || 'contraseña_segura'
};

console.log(`Prueba de facturas: Usando API base: ${baseUrl}`);
console.log(`Usuario de prueba: ${testUser.email}`);

/**
 * Obtiene la lista de facturas
 * 
 * @param {string} baseUrl - URL base de la API
 * @param {Object} authHeaders - Headers con autenticación
 * @param {Object} queryParams - Parámetros de consulta opcionales
 * @returns {Array|null} - Lista de facturas o null si falló
 */
function getInvoices(baseUrl, authHeaders, queryParams = {}) {
  console.log('Obteniendo lista de facturas...');
  
  // Registrar tiempo de inicio para medir duración
  const startTime = new Date();
  
  // Parámetros por defecto
  const defaultParams = {
    limit: 10,
    offset: 0
  };
  
  // Combinar parámetros por defecto con los proporcionados
  const params = { ...defaultParams, ...queryParams };
  
  // Hacer petición GET a facturas
  const invoicesRes = http.get(
    `${baseUrl}/invoices`,
    {
      ...authHeaders,
      tags: { name: 'get_invoices' },
      params: params
    }
  );
  
  // Calcular duración de la llamada
  invoiceCallDuration.add(new Date() - startTime);
  
  // Verificar si la petición fue exitosa
  const success = check(invoicesRes, {
    'invoices status is 200': (r) => r.status === 200,
    'invoices has data': (r) => r.json('data') !== undefined,
  });
  
  if (!success) {
    invoiceErrors.add(1);
    console.log(`Error al obtener facturas - Status: ${invoicesRes.status}`);
    return null;
  }
  
  try {
    // Extraer datos de facturas
    const invoicesData = invoicesRes.json('data');
    console.log(`Facturas obtenidas. ${invoicesData.length} elementos encontrados.`);
    return invoicesData;
  } catch (error) {
    invoiceErrors.add(1);
    console.log(`Error procesando respuesta de facturas: ${error}`);
    return null;
  }
}

/**
 * Obtiene los detalles de una factura específica
 * 
 * @param {string} baseUrl - URL base de la API
 * @param {string} invoiceId - ID de la factura
 * @param {Object} authHeaders - Headers con autenticación
 * @returns {Object|null} - Detalles de la factura o null si falló
 */
function getInvoiceDetails(baseUrl, invoiceId, authHeaders) {
  console.log(`Obteniendo detalles de la factura: ${invoiceId}`);
  
  // Hacer petición GET a la factura específica
  const invoiceRes = http.get(
    `${baseUrl}/invoices/${invoiceId}`,
    {
      ...authHeaders,
      tags: { name: 'get_invoice_details' }
    }
  );
  
  // Verificar si la petición fue exitosa
  const success = check(invoiceRes, {
    'invoice details status is 200': (r) => r.status === 200,
    'invoice details has data': (r) => r.json('data') !== undefined,
  });
  
  if (!success) {
    invoiceErrors.add(1);
    console.log(`Error al obtener detalles de la factura - Status: ${invoiceRes.status}`);
    return null;
  }
  
  try {
    // Extraer datos de la factura
    const invoiceData = invoiceRes.json('data');
    console.log(`Detalles de la factura obtenidos: ${invoiceData.reference || invoiceData.id}`);
    return invoiceData;
  } catch (error) {
    invoiceErrors.add(1);
    console.log(`Error procesando detalles de la factura: ${error}`);
    return null;
  }
}

// Función principal que ejecutará cada usuario virtual
export default function() {
  // Login para obtener token
  let token = null;
  
  group('1. Autenticación', function() {
    token = performLogin(baseUrl, testUser.email, testUser.password);
    if (!token) {
      console.log('No se pudo obtener token. Finalizando prueba.');
      return;
    }
  });
  
  // Si el login falló, terminar la ejecución
  if (!token) return;
  
  // Simular tiempo entre acciones del usuario
  sleep(randomNumber(1, 2));
  
  // Headers para peticiones autenticadas
  const authHeaders = getAuthHeaders(token, merchantId);
  
  // Obtener lista de facturas
  let invoices = null;
  
  group('2. Listar Facturas', function() {
    invoices = getInvoices(baseUrl, authHeaders);
  });
  
  // Si no hay facturas, terminar la ejecución
  if (!invoices || invoices.length === 0) return;
  
  // Simular tiempo entre acciones del usuario
  sleep(randomNumber(1, 2));
  
  // Filtrar facturas por estado (ejemplo: pendientes)
  group('3. Filtrar Facturas por Estado', function() {
    // Estados posibles de facturas
    const states = ['DRAFT', 'PENDING', 'PAID', 'CANCELLED'];
    
    // Seleccionar un estado aleatorio
    const randomState = randomItem(states);
    console.log(`Filtrando facturas por estado: ${randomState}`);
    
    // Obtener facturas filtradas
    const filteredInvoices = getInvoices(baseUrl, authHeaders, {
      status: randomState
    });
    
    if (filteredInvoices) {
      console.log(`Se encontraron ${filteredInvoices.length} facturas con estado ${randomState}`);
      sleep(randomNumber(1, 2));
    }
  });
  
  // Seleccionar una factura aleatoria y ver sus detalles
  group('4. Ver Detalle de Factura', function() {
    // Elegir una factura aleatoria
    const randomInvoice = randomItem(invoices);
    
    // Obtener detalles de la factura
    const invoiceDetails = getInvoiceDetails(baseUrl, randomInvoice.id, authHeaders);
    
    // Simular tiempo revisando la factura
    if (invoiceDetails) {
      sleep(randomNumber(2, 4));
    }
  });
  
  // Pausa final antes de terminar
  sleep(randomNumber(1, 2));
}

// Personalizar el formato del informe
export function handleSummary(data) {
  return formatSummary(data, 'invoices');
}
