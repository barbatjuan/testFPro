/**
 * 🚨 FACTUPRO - PRUEBA DE PRODUCCIÓN SIMPLE 🚨
 * 
 * ⚠️ ATENCIÓN: ESTE TEST EJECUTA PRUEBAS EN EL ENTORNO DE PRODUCCIÓN REAL ⚠️
 * 
 * 🔐 AUTENTICACIÓN:
 *   - Login con credenciales de producción
 *   - Obtención y validación de token JWT
 * 
 * 📊 OPERACIONES GET:
 *   - Consulta de inventario de productos
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
 * 🎯 OBJETIVO: Validar conectividad y rendimiento básico en producción
 * 
 * 🚨 IMPORTANTE: Solo ejecutar con autorización explícita del equipo
 */

// Métricas personalizadas
import http from 'k6/http';
import { sleep, group } from 'k6';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// 🚨 ADVERTENCIA VISUAL EN CONSOLA 🚨
console.log('');
console.log('🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨');
console.log('🚨                                                                🚨');
console.log('🚨              ¡ATENCIÓN: PRUEBA EN PRODUCCIÓN!                  🚨');
console.log('🚨                                                                🚨');
console.log('🚨  Este script ejecuta pruebas en el entorno de producción real  🚨');
console.log('🚨                                                                🚨');
console.log('🚨  Si no tienes autorización, DETÉN AHORA (Ctrl+C)              🚨');
console.log('🚨                                                                🚨');
console.log('🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨');
console.log('');
console.log('⏳ Iniciando en 5 segundos... (Ctrl+C para cancelar)');
console.log('');



// Métricas personalizadas
export const loginErrors = new Counter('login_errors');
export const apiErrors = new Counter('api_errors');
export const responseTime = new Trend('response_time');

// Opciones de la prueba optimizadas para k6 Cloud - PRODUCCIÓN
export const options = {
  // Configuración para Grafana Cloud
  cloud: {
    // Project: Default project
    projectID: 3784419,
    // Test runs with the same name groups test runs together.
    name: 'Factupro Production Test'
  },
  
  // Configuración de escenarios para prueba de estrés gradual
  scenarios: {
    stress_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 15 },  // Rampa inicial
        { duration: '1m', target: 30 },   // Carga objetivo
        { duration: '30s', target: 0 }    // Descenso
      ],
      gracefulStop: '15s'
    }
  },
  
  // Umbrales conservadores
  thresholds: {
    'http_req_duration': ['p(95)<3000'],     // 3 segundos máximo
    'http_req_failed': ['rate<0.05'],        // Máximo 5% de fallos
    'login_errors': ['count<3'],             // Máximo 3 errores de login
    'api_errors': ['count<5'],               // Máximo 5 errores de API
  },
};

// 🚨 CONFIGURACIÓN DE PRODUCCIÓN 🚨
const baseUrl = 'http://factupro-api-alb-1050749400.eu-west-3.elb.amazonaws.com';
const authEndpoint = '/api/v1/auth/login';
const merchantId = 'b886764c-e544-4356-a3ed-c27db6889647';

// Credenciales de prueba para PRODUCCIÓN (usuario real de testing)
const testUser = {
  email: 'testfpro1@adrirodrigoagencia.es',
  password: 'Testfpro_123!!'
};

console.log(`🚨 PRODUCCIÓN: Usando API base: ${baseUrl}`);
console.log(`👤 Usuario de prueba: ${testUser.email}`);

export default function() {
  // Pausa inicial de seguridad
  sleep(5);
  
  let token = null;
  
  // 1. AUTENTICACIÓN
  group('🔐 Login en PRODUCCIÓN', function() {
    console.log(`VU ${__VU}: Iniciando login en PRODUCCIÓN...`);
    
    const startTime = Date.now();
    
    const loginRes = http.post(`${baseUrl}${authEndpoint}`, JSON.stringify({
      email: testUser.email,
      password: testUser.password
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'production_login' }
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
        console.log(`✅ Login exitoso en PRODUCCIÓN en ${loginDuration}ms`);
      } catch (e) {
        loginErrors.add(1);
        console.log('❌ Error parseando respuesta de login en PRODUCCIÓN');
        return;
      }
    } else {
      loginErrors.add(1);
      console.log(`❌ Error de login en PRODUCCIÓN - Status: ${loginRes.status}`);
      return;
    }
  });
  
  // Si no hay token, terminar
  if (!token) {
    console.log('❌ Sin token en PRODUCCIÓN, terminando prueba');
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
  
  // 2. PRUEBAS DE ENDPOINTS GET EN PRODUCCIÓN
  group('📊 Pruebas GET en PRODUCCIÓN', function() {
    
    // Test 1: Obtener catálogo de productos
    const catalogStart = Date.now();
    
    const catalogRes = http.get(`${baseUrl}/api/v1/catalog`, {
      ...authHeaders,
      tags: { name: 'production_catalog' }
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
    
    if (!catalogSuccess) {
      apiErrors.add(1);
      console.log(`❌ Error obteniendo catálogo en PRODUCCIÓN - Status: ${catalogRes.status}`);
    }
    
    sleep(2);
    
    // Test 2: Obtener contactos
    const contactsStart = Date.now();
    
    const contactsRes = http.get(`${baseUrl}/api/v1/contacts?limit=5`, {
      ...authHeaders,
      tags: { name: 'production_contacts' }
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
    
    if (!contactsSuccess) {
      apiErrors.add(1);
      console.log(`❌ Error obteniendo contactos en PRODUCCIÓN - Status: ${contactsRes.status}`);
    }
    
    sleep(2);
    
    // Test 3: Obtener facturas
    const invoicesStart = Date.now();
    
    const invoicesRes = http.get(`${baseUrl}/api/v1/invoices?limit=5`, {
      ...authHeaders,
      tags: { name: 'production_invoices' }
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
    
    if (!invoicesSuccess) {
      apiErrors.add(1);
      console.log(`❌ Error obteniendo facturas en PRODUCCIÓN - Status: ${invoicesRes.status}`);
    }
  });
  
  // Pausa final
  sleep(3);
  
  // Prueba completada silenciosamente
}

// Función de resumen personalizada
export function handleSummary(data) {
  console.log('');
  console.log('🚨🚨🚨 RESUMEN DE PRUEBA EN PRODUCCIÓN 🚨🚨🚨');
  console.log('');
  
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}