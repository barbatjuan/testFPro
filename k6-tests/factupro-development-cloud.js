/**
 * FACTUPRO - PRUEBA DE DESARROLLO SIMPLE
 * 
 * Este test mide tiempos de respuesta básicos en el entorno de desarrollo:
 * 
 * 🔐 AUTENTICACIÓN:
 *   - Login con credenciales de desarrollo
 *   - Obtención y validación de token JWT
 * 
 * 📊 OPERACIONES GET:
 *   - Consulta de catálogo de productos
 *   - Listado de contactos (limitado a 5)
 *   - Listado de facturas (limitado a 5)
 * 
 * 📈 MÉTRICAS MONITOREADAS:
 *   - login_errors: Errores de autenticación
 *   - api_errors: Errores en operaciones de API
 *   - response_time: Tiempos de respuesta personalizados
 * 
 * ⚡ CONFIGURACIÓN:
 *   - 1 usuario virtual (conservador)
 *   - Duración: 30 segundos
 *   - Solo operaciones de lectura (GET)
 * 
 * 🎯 OBJETIVO: Validar conectividad y rendimiento básico antes de producción
 */

import http from 'k6/http';
import { sleep, group } from 'k6';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Métricas personalizadas
export const loginErrors = new Counter('login_errors');
export const apiErrors = new Counter('api_errors');
export const responseTime = new Trend('response_time');

// Opciones de la prueba optimizadas para k6 Cloud
export const options = {
  vus: 1,                    // SOLO 1 usuario virtual
  duration: '30s',           // Duración corta: 30 segundos
  
  // Configuración para Grafana Cloud
  cloud: {
    // Project: Default project
    projectID: 3664457,
    // Test runs with the same name groups test runs together.
    name: 'Factupro Development Test'
  },
  
  // Umbrales conservadores
  thresholds: {
    'http_req_duration': ['p(95)<3000'],     // 3 segundos máximo
    'http_req_failed': ['rate<0.05'],        // Máximo 5% de fallos
    'login_errors': ['count<3'],             // Máximo 3 errores de login
    'api_errors': ['count<5'],               // Máximo 5 errores de API
  },
};

// Configuración para k6 Cloud - COPIADA EXACTAMENTE de factupro-catalog-cloud.js
const baseUrl = 'https://factupro-backend-development.up.railway.app';
const authEndpoint = '/api/v1/auth/login';
const merchantId = '123e7ae5-b9f9-46f1-8e85-36d0ed560cf9';

// Credenciales de prueba para k6 Cloud (usuario real de testing)
const testUser = {
  email: 'testfpro1@adrirodrigoagencia.es',
  password: 'Testfpro_123!!'
};

console.log(`Prueba de desarrollo: Usando API base: ${baseUrl}`);
console.log(`Usuario de prueba: ${testUser.email}`);

export default function() {
  // Pausa inicial de seguridad
  sleep(5);
  
  let token = null;
  
  // 1. AUTENTICACIÓN
  group('🔐 Login en Desarrollo', function() {
    console.log(`VU ${__VU}: Iniciando login en DESARROLLO...`);
    
    const startTime = Date.now();
    
    const loginRes = http.post(`${baseUrl}${authEndpoint}`, JSON.stringify({
      email: testUser.email,
      password: testUser.password
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'development_login' }
    });
    
    const loginDuration = Date.now() - startTime;
    responseTime.add(loginDuration, { endpoint: 'login' });
    
    const loginSuccess = check(loginRes, {
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
    
    if (loginSuccess) {
      try {
        const loginData = JSON.parse(loginRes.body);
        token = loginData.data.token;
        console.log(`✅ Login exitoso en ${loginDuration}ms`);
      } catch (e) {
        loginErrors.add(1);
        console.log('❌ Error parseando respuesta de login');
        return;
      }
    } else {
      loginErrors.add(1);
      console.log(`❌ Error de login - Status: ${loginRes.status}`);
      return;
    }
  });
  
  // Si no hay token, terminar
  if (!token) {
    console.log('❌ Sin token, terminando prueba');
    return;
  }
  
  // Headers para peticiones autenticadas
  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Merchant-Id': merchantId,
    }
  };
  
  // Pausa entre operaciones
  sleep(2);
  
  // 2. PRUEBAS DE ENDPOINTS GET
  group('📊 Pruebas GET en Desarrollo', function() {
    
    // Test 1: Obtener catálogo de productos
    console.log(`VU ${__VU}: Obteniendo catálogo...`);
    const catalogStart = Date.now();
    
    const catalogRes = http.get(`${baseUrl}/api/v1/catalog`, {
      ...authHeaders,
      tags: { name: 'development_catalog' }
    });
    
    const catalogDuration = Date.now() - catalogStart;
    responseTime.add(catalogDuration, { endpoint: 'catalog' });
    
    const catalogSuccess = check(catalogRes, {
      'catalog status is 200': (r) => r.status === 200,
      'catalog has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data !== undefined;
        } catch (e) {
          return false;
        }
      },
    });
    
    if (catalogSuccess) {
      console.log(`✅ Catálogo obtenido en ${catalogDuration}ms`);
    } else {
      apiErrors.add(1);
      console.log(`❌ Error obteniendo catálogo - Status: ${catalogRes.status}`);
    }
    
    sleep(2);
    
    // Test 2: Obtener contactos
    console.log(`VU ${__VU}: Obteniendo contactos...`);
    const contactsStart = Date.now();
    
    const contactsRes = http.get(`${baseUrl}/api/v1/contacts?limit=5`, {
      ...authHeaders,
      tags: { name: 'development_contacts' }
    });
    
    const contactsDuration = Date.now() - contactsStart;
    responseTime.add(contactsDuration, { endpoint: 'contacts' });
    
    const contactsSuccess = check(contactsRes, {
      'contacts status is 200': (r) => r.status === 200,
      'contacts has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data !== undefined;
        } catch (e) {
          return false;
        }
      },
    });
    
    if (contactsSuccess) {
      console.log(`✅ Contactos obtenidos en ${contactsDuration}ms`);
    } else {
      apiErrors.add(1);
      console.log(`❌ Error obteniendo contactos - Status: ${contactsRes.status}`);
    }
    
    sleep(2);
    
    // Test 3: Obtener facturas
    console.log(`VU ${__VU}: Obteniendo facturas...`);
    const invoicesStart = Date.now();
    
    const invoicesRes = http.get(`${baseUrl}/api/v1/invoices?limit=5`, {
      ...authHeaders,
      tags: { name: 'development_invoices' }
    });
    
    const invoicesDuration = Date.now() - invoicesStart;
    responseTime.add(invoicesDuration, { endpoint: 'invoices' });
    
    const invoicesSuccess = check(invoicesRes, {
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
    
    if (invoicesSuccess) {
      console.log(`✅ Facturas obtenidas en ${invoicesDuration}ms`);
    } else {
      apiErrors.add(1);
      console.log(`❌ Error obteniendo facturas - Status: ${invoicesRes.status}`);
    }
  });
  
  // Pausa final
  sleep(3);
  
  console.log(`VU ${__VU}: Prueba completada`);
}

// Función de resumen personalizada
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}
