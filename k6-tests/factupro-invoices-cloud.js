/**
 * FACTUPRO - PRUEBA DE GESTIÓN DE FACTURAS
 * 
 * Este test simula un usuario revisando y gestionando facturas:
 * 
 * 🔐 AUTENTICACIÓN:
 *   - Login con credenciales reales de prueba
 *   - Obtención y validación de token JWT
 * 
 * 🧾 GESTIÓN DE FACTURAS:
 *   - Listar facturas con paginación
 *   - Filtrar facturas por estado (DRAFT, PENDING, PAID, CANCELLED)
 *   - Ver detalles de facturas específicas
 *   - Simular tiempo de análisis de facturas
 * 
 * 📊 OPERACIONES DE FILTRADO:
 *   - Filtros por estado de factura
 *   - Búsqueda y navegación de resultados
 *   - Validación de datos de factura
 * 
 * 📊 MÉTRICAS MONITOREADAS:
 *   - login_errors: Errores de autenticación
 *   - invoice_errors: Errores en operaciones de facturas
 *   - invoice_call_duration: Duración de llamadas de facturas
 * 
 * ⚡ CONFIGURACIÓN:
 *   - 2 usuarios virtuales concurrentes
 *   - Duración: 30 segundos
 *   - Enfoque en operaciones de facturación
 * 
 * 🎯 OBJETIVO: Validar funcionalidad completa de gestión de facturas
 */

import { sleep, group } from 'k6';
import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Métricas personalizadas
const loginErrors = new Counter('login_errors');
const invoiceErrors = new Counter('invoice_errors');
const invoiceCallDuration = new Trend('invoice_call_duration');

// Opciones de la prueba optimizadas para k6 Cloud
export const options = {
  vus: 2,
  duration: '30s',
  
  // Umbrales de rendimiento específicos para facturas (ajustados)
  thresholds: {
    'http_req_duration': ['p(95)<5000'],     // 5 segundos para el 95% de requests
    'http_req_failed': ['rate<0.10'],        // Hasta 10% de fallos permitidos
    'login_errors': ['count<10'],            // Hasta 10 errores de login
    'invoice_errors': ['count<15'],          // Hasta 15 errores de facturas
    'invoice_call_duration': ['p(95)<4000'], // 4 segundos para llamadas de facturas
  },
};

// Configuración para k6 Cloud
const baseUrl = 'https://factupro-backend-development.up.railway.app';
const authEndpoint = '/api/v1/auth/login';
const merchantId = '123e7ae5-b9f9-46f1-8e85-36d0ed560cf9';

// Credenciales de prueba para k6 Cloud (usuario real de testing)
const testUser = {
  email: 'testfpro1@adrirodrigoagencia.es',
  password: 'Testfpro_123!!'
};

console.log(`Prueba de facturas: Usando API base: ${baseUrl}`);
console.log(`Usuario de prueba: ${testUser.email}`);

/**
 * Realiza login y retorna el token
 */
function performLogin() {
  console.log(`VU ${__VU}: iniciando login para facturas`);
  
  const loginResponse = http.post(`${baseUrl}${authEndpoint}`, JSON.stringify({
    email: testUser.email,
    password: testUser.password
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.token;
      } catch (e) {
        return false;
      }
    },
  });
  
  if (loginSuccess && loginResponse.status === 200) {
    try {
      const loginData = JSON.parse(loginResponse.body);
      console.log(`VU ${__VU}: Login exitoso para facturas`);
      return loginData.data.token;
    } catch (e) {
      console.log(`VU ${__VU}: Error parseando respuesta de login`);
      loginErrors.add(1);
      return null;
    }
  } else {
    console.log(`VU ${__VU}: Error de login - ${loginResponse.status}`);
    loginErrors.add(1);
    return null;
  }
}

/**
 * Obtiene la lista de facturas
 */
function getInvoices(token, queryParams = {}) {
  console.log(`VU ${__VU}: obteniendo lista de facturas`);
  
  const startTime = Date.now();
  
  // Parámetros por defecto
  const defaultParams = {
    limit: 10,
    offset: 0
  };
  
  // Combinar parámetros
  const params = { ...defaultParams, ...queryParams };
  
  // Construir URL con parámetros manualmente (k6 no soporta URLSearchParams)
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  const invoicesUrl = `${baseUrl}/api/v1/invoices?${queryString}`;
  
  const invoicesRes = http.get(invoicesUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Merchant-Id': merchantId,
    },
    tags: { name: 'get_invoices' }
  });
  
  invoiceCallDuration.add(Date.now() - startTime);
  
  const success = check(invoicesRes, {
    'invoices status is 200': (r) => r.status === 200,
    'invoices has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  if (!success) {
    invoiceErrors.add(1);
    console.log(`VU ${__VU}: Error al obtener facturas - Status: ${invoicesRes.status}`);
    return null;
  }
  
  try {
    const invoicesData = JSON.parse(invoicesRes.body).data;
    console.log(`VU ${__VU}: Facturas obtenidas. ${invoicesData.length} elementos encontrados`);
    return invoicesData;
  } catch (error) {
    invoiceErrors.add(1);
    console.log(`VU ${__VU}: Error procesando respuesta de facturas: ${error}`);
    return null;
  }
}

/**
 * Obtiene los detalles de una factura específica
 */
function getInvoiceDetails(token, invoiceId) {
  console.log(`VU ${__VU}: obteniendo detalles de la factura: ${invoiceId}`);
  
  const invoiceRes = http.get(`${baseUrl}/api/v1/invoices/${invoiceId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Merchant-Id': merchantId,
    },
    tags: { name: 'get_invoice_details' }
  });
  
  const success = check(invoiceRes, {
    'invoice details status is 200': (r) => r.status === 200,
    'invoice details has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  if (!success) {
    invoiceErrors.add(1);
    console.log(`VU ${__VU}: Error al obtener detalles de la factura - Status: ${invoiceRes.status}`);
    return null;
  }
  
  try {
    const invoiceData = JSON.parse(invoiceRes.body).data;
    console.log(`VU ${__VU}: Detalles de la factura obtenidos: ${invoiceData.reference || invoiceData.id}`);
    return invoiceData;
  } catch (error) {
    invoiceErrors.add(1);
    console.log(`VU ${__VU}: Error procesando detalles de la factura: ${error}`);
    return null;
  }
}

// Función principal que ejecutará cada usuario virtual
export default function() {
  let token = null;
  
  // Grupo 1: Autenticación
  group('1. Autenticación', function() {
    token = performLogin();
    if (!token) {
      console.log(`VU ${__VU}: No se pudo obtener token. Finalizando prueba.`);
      return;
    }
  });
  
  // Si el login falló, terminar la ejecución
  if (!token) return;
  
  // Simular tiempo entre acciones del usuario
  sleep(Math.random() * 2 + 1);
  
  // Grupo 2: Listar Facturas
  let invoices = null;
  group('2. Listar Facturas', function() {
    invoices = getInvoices(token);
  });
  
  // Si no hay facturas, terminar la ejecución
  if (!invoices || invoices.length === 0) {
    console.log(`VU ${__VU}: No hay facturas disponibles`);
    return;
  }
  
  // Simular tiempo entre acciones del usuario
  sleep(Math.random() * 2 + 1);
  
  // Grupo 3: Filtrar Facturas por Estado
  group('3. Filtrar Facturas por Estado', function() {
    // Estados posibles de facturas
    const states = ['DRAFT', 'PENDING', 'PAID', 'CANCELLED'];
    
    // Seleccionar un estado aleatorio
    const randomIndex = Math.floor(Math.random() * states.length);
    const randomState = states[randomIndex];
    console.log(`VU ${__VU}: Filtrando facturas por estado: ${randomState}`);
    
    // Obtener facturas filtradas
    const filteredInvoices = getInvoices(token, {
      status: randomState
    });
    
    if (filteredInvoices) {
      console.log(`VU ${__VU}: Se encontraron ${filteredInvoices.length} facturas con estado ${randomState}`);
      sleep(Math.random() * 2 + 1);
    }
  });
  
  // Grupo 4: Ver Detalle de Factura
  group('4. Ver Detalle de Factura', function() {
    // Elegir una factura aleatoria
    const randomIndex = Math.floor(Math.random() * invoices.length);
    const randomInvoice = invoices[randomIndex];
    
    console.log(`VU ${__VU}: Factura seleccionada: ${randomInvoice.reference || randomInvoice.id}`);
    
    // Obtener detalles de la factura
    const invoiceDetails = getInvoiceDetails(token, randomInvoice.id);
    
    // Simular tiempo revisando la factura
    if (invoiceDetails) {
      sleep(Math.random() * 4 + 2);
    }
  });
  
  // Pausa final antes de terminar
  sleep(Math.random() * 2 + 1);
}

// Personalizar el formato del informe
export function handleSummary(data) {
  console.log('Finalizando prueba de facturas para Factupro');
  
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}
