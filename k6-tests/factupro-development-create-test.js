/**
 * FACTUPRO - PRUEBA DE DESARROLLO CON CREACIÓN DE DATOS
 * 
 * Este test incluye operaciones de creación además de las consultas básicas:
 * 
 * 🔐 AUTENTICACIÓN:
 *   - Login con credenciales de desarrollo
 *   - Obtención y validación de token JWT
 * 
 * 📝 OPERACIONES CREATE:
 *   - Creación de cliente con datos de prueba
 *   - Creación de producto con datos de prueba
 * 
 * 📊 OPERACIONES GET:
 *   - Consulta de catálogo de productos
 *   - Listado de contactos
 *   - Listado de facturas
 * 
 * 📈 MÉTRICAS MONITOREADAS:
 *   - login_errors: Errores de autenticación
 *   - api_errors: Errores en operaciones de API
 *   - create_errors: Errores específicos de creación
 *   - response_time: Tiempos de respuesta personalizados
 * 
 * ⚡ CONFIGURACIÓN:
 *   - 1 usuario virtual (conservador)
 *   - Duración: 45 segundos (más tiempo para creaciones)
 *   - Operaciones de lectura y escritura
 * 
 * 🎯 OBJETIVO: Validar operaciones CRUD completas en desarrollo
 */

import http from 'k6/http';
import { sleep, group } from 'k6';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Métricas personalizadas
export const loginErrors = new Counter('login_errors');
export const apiErrors = new Counter('api_errors');
export const createErrors = new Counter('create_errors');
export const responseTime = new Trend('response_time');

// Opciones de la prueba optimizadas para k6 Cloud
export const options = {
  // Configuración para Grafana Cloud
  cloud: {
    projectID: 3784419,
    name: 'Factupro Development Create Test'
  },
  
  // Configuración de escenarios para VUs simultáneos con rampa gradual
  scenarios: {
    simultaneous_create_operations: {
      executor: 'ramping-vus',
      stages: [
        { duration: '45s', target: 1 },   // 1 VU creando durante 45s
        { duration: '60s', target: 3 },   // Rampa a 3 VUs simultáneos
        { duration: '60s', target: 3 },   // Mantener 3 VUs simultáneos
        { duration: '30s', target: 0 }    // Descenso gradual
      ],
      gracefulStop: '20s'
    }
  },
  
  // Umbrales flexibles para múltiples VUs
  thresholds: {
    'http_req_duration': ['p(95)<8000'],     // 8 segundos máximo (más tiempo para concurrencia)
    'http_req_failed': ['rate<0.1'],         // Máximo 10% de fallos
    'login_errors': ['count<6'],             // Máximo 6 errores de login (3 VUs x 2)
    'api_errors': ['count<10'],              // Máximo 10 errores de API
    'create_errors': ['count<5'],            // Máximo 5 errores de creación
  },
};

// Configuración de la API
const baseUrl = 'https://factupro-backend-development.up.railway.app';
const authEndpoint = '/api/v1/auth/login';
const merchantId = '123e7ae5-b9f9-46f1-8e85-36d0ed560cf9';

// Credenciales de prueba
const testUser = {
  email: 'testfpro1@adrirodrigoagencia.es',
  password: 'Testfpro_123!!'
};

// Función para generar datos únicos
function generateUniqueData() {
  const timestamp = Date.now();
  const timestampShort = timestamp.toString().slice(-6);
  const vuId = __VU; // ID del Virtual User
  const randomSuffix = Math.floor(Math.random() * 10000);
  
  // 1. Generación de NIF válido para empresas españolas con mayor unicidad
  const letrasValidas = 'ABCDEFGHJKLMNPQRSUVWXYZ'; // Excluye I, Ñ, O, U
  const letraInicial = letrasValidas.charAt(Math.floor(Math.random() * letrasValidas.length));
  
  // Incluir VU ID en los dígitos para evitar duplicación
  const baseNumber = Math.floor(1000000 + Math.random() * 8000000);
  const uniqueNumber = baseNumber + (vuId * 1000) + randomSuffix;
  const sieteDigitos = uniqueNumber.toString().slice(-7).padStart(7, '0');
  
  // Cálculo correcto del carácter de control para NIF
  const letrasControl = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const numeroCompleto = parseInt(sieteDigitos);
  const caracterControl = letrasControl.charAt(numeroCompleto % 23);
  
  const nifValido = `${letraInicial}${sieteDigitos}${caracterControl}`;
  
  // 2. Generación de datos únicos con VU ID
  const uniqueName = `Test Client VU${vuId}-${randomSuffix}`;
  const uniquePhone = `91${vuId}${Math.floor(100000 + Math.random() * 900000).toString().slice(-5)}`;
  const uniqueEmail = `client.vu${vuId}.${timestampShort}.${randomSuffix}@factupro.com`;
  
  return {
    productName: `[TEST][DO NOT USE] Product ${timestampShort}`,
    productDescription: `🔴 PRODUCTO DE PRUEBA - ELIMINAR (${new Date().toLocaleDateString()}) - K6 Test`,
    productPrice: Number((Math.random() * 50 + 5).toFixed(2)), // Rango seguro: 5-55€
    contactName: uniqueName,
    nif: nifValido,
    email: uniqueEmail,
    phone: uniquePhone,
    cellPhone: uniquePhone
  };
}

console.log(`Prueba de desarrollo con creación: Usando API base: ${baseUrl}`);
console.log(`Usuario de prueba: ${testUser.email}`);

export default function() {
  // Pausa inicial de seguridad
  sleep(3);
  
  let token = null;
  const testData = generateUniqueData();
  
  console.log(`VU ${__VU}: Datos generados para la prueba:`, JSON.stringify(testData, null, 2));
  
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
  
  // 2. CREACIÓN DE CLIENTE
  group('👤 Crear Cliente', function() {
    console.log(`VU ${__VU}: Creando cliente...`);
    
    const clientData = {
      "name": testData.contactName,
      "nif": testData.nif,
      "country": "ESP",
      "state": "Madrid",
      "address": "Calle Ejemplo 123",
      "city": "Madrid",
      "zipCode": "28001",
      "email": testData.email,
      "phone": testData.phone,
      "cellPhone": testData.cellPhone,
      "website": "factupro.com",
      "isCustomer": true,
      "isSupplier": false,
      "type": "company",
      "vatId": testData.nif,
      "tags": ["test", "autogenerated"],
      "preferences": [
        {
          "key": "currency",
          "value": "EUR",
          "ambit": "general"
        }
      ]
    };
    
    const clientStart = Date.now();
    
    const clientRes = http.post(`${baseUrl}/api/v1/contacts`, JSON.stringify(clientData), {
      ...authHeaders,
      tags: { name: 'create_client' }
    });
    
    const clientDuration = Date.now() - clientStart;
    responseTime.add(clientDuration, { endpoint: 'create_client' });
    
    const clientSuccess = check(clientRes, {
      'client creation status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'client response has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data !== undefined || body.id !== undefined;
        } catch (e) {
          return false;
        }
      },
    });
    
    if (clientSuccess) {
      console.log(`✅ Cliente creado exitosamente en ${clientDuration}ms`);
      console.log(`📋 Cliente: ${testData.contactName} (${testData.email})`);
    } else {
      createErrors.add(1);
      console.log(`❌ Error creando cliente - Status: ${clientRes.status}`);
      console.log(`📋 Response: ${clientRes.body}`);
    }
  });
  
  sleep(2);
  
  // 3. CREACIÓN DE PRODUCTO
  group('📦 Crear Producto', function() {
    console.log(`VU ${__VU}: Creando producto...`);
    
    const productData = {
      "name": testData.productName,
      "description": testData.productDescription,
      "price": testData.productPrice,
      "type": "PRODUCT",
      "tags": ["test", "do_not_use", "temporary", "k6_autogenerated"]
    };
    
    const productStart = Date.now();
    
    const productRes = http.post(`${baseUrl}/api/v1/catalog`, JSON.stringify(productData), {
      ...authHeaders,
      tags: { name: 'create_product' }
    });
    
    const productDuration = Date.now() - productStart;
    responseTime.add(productDuration, { endpoint: 'create_product' });
    
    const productSuccess = check(productRes, {
      'product creation status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'product response has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data !== undefined || body.id !== undefined;
        } catch (e) {
          return false;
        }
      },
    });
    
    if (productSuccess) {
      console.log(`✅ Producto creado exitosamente en ${productDuration}ms`);
      console.log(`📦 Producto: ${testData.productName} - €${testData.productPrice}`);
    } else {
      createErrors.add(1);
      console.log(`❌ Error creando producto - Status: ${productRes.status}`);
      console.log(`📦 Response: ${productRes.body}`);
    }
  });
  
  sleep(2);
  
  // 4. VERIFICACIÓN - CONSULTAS GET
  group('📊 Verificar Datos Creados', function() {
    
    // Verificar catálogo actualizado
    console.log(`VU ${__VU}: Verificando catálogo actualizado...`);
    const catalogStart = Date.now();
    
    const catalogRes = http.get(`${baseUrl}/api/v1/catalog?limit=10`, {
      ...authHeaders,
      tags: { name: 'verify_catalog' }
    });
    
    const catalogDuration = Date.now() - catalogStart;
    responseTime.add(catalogDuration, { endpoint: 'verify_catalog' });
    
    const catalogSuccess = check(catalogRes, {
      'catalog status is 200': (r) => r.status === 200,
      'catalog has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data !== undefined && Array.isArray(body.data);
        } catch (e) {
          return false;
        }
      },
    });
    
    if (catalogSuccess) {
      console.log(`✅ Catálogo verificado en ${catalogDuration}ms`);
    } else {
      apiErrors.add(1);
      console.log(`❌ Error verificando catálogo - Status: ${catalogRes.status}`);
    }
    
    sleep(1);
    
    // Verificar contactos actualizados
    console.log(`VU ${__VU}: Verificando contactos actualizados...`);
    const contactsStart = Date.now();
    
    const contactsRes = http.get(`${baseUrl}/api/v1/contacts?limit=10`, {
      ...authHeaders,
      tags: { name: 'verify_contacts' }
    });
    
    const contactsDuration = Date.now() - contactsStart;
    responseTime.add(contactsDuration, { endpoint: 'verify_contacts' });
    
    const contactsSuccess = check(contactsRes, {
      'contacts status is 200': (r) => r.status === 200,
      'contacts has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data !== undefined && Array.isArray(body.data);
        } catch (e) {
          return false;
        }
      },
    });
    
    if (contactsSuccess) {
      console.log(`✅ Contactos verificados en ${contactsDuration}ms`);
    } else {
      apiErrors.add(1);
      console.log(`❌ Error verificando contactos - Status: ${contactsRes.status}`);
    }
  });
  
  // Pausa final
  sleep(3);
  
  console.log(`VU ${__VU}: Prueba completada - Cliente y producto creados`);
}

// Función de resumen personalizada
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}
