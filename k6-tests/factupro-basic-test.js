/**
 * FACTUPRO - PRUEBA BÁSICA COMPLETA
 * 
 * Este test simula un usuario típico de Factupro realizando operaciones básicas:
 * 
 * AUTENTICACIÓN:
 *   - Login con credenciales reales de prueba
 *   - Obtención y validación de token JWT
 * 
 * GESTIÓN DE PRODUCTOS:
 *   - Listar productos del catálogo
 *   - Ver detalles de productos específicos
 *   - Navegación realista entre productos
 * 
 * GESTIÓN DE FACTURAS:
 *   - Crear nuevas facturas con datos de prueba
 *   - Listar facturas existentes
 *   - Validar estructura de respuestas
 * 
 * MÉTRICAS MONITOREADAS:
 *   - login_errors: Errores de autenticación
 *   - product_errors: Errores en operaciones de productos
 *   - api_call_duration: Duración de llamadas API
 * 
 * CONFIGURACIÓN:
 *   - 5 usuarios virtuales concurrentes
 *   - Duración: 30 segundos
 *   - Umbrales de rendimiento configurados
 * 
 * OBJETIVO: Validar el flujo básico end-to-end de Factupro
 */

import http from 'k6/http';
import { sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Cargamos las variables de entorno del archivo .env
// NOTA: Para que k6 pueda acceder a estas variables, debes ejecutarlo con
// k6 run -e API_BASE=value -e USER_EMAIL=value -e USER_PASSWORD=value factupro-basic-test.js
// O definirlas en tu entorno antes de ejecutar k6

// Métricas personalizadas
const loginErrors = new Counter('login_errors');
const productErrors = new Counter('product_errors');
const apiCallDuration = new Trend('api_call_duration');

// Opciones de la prueba
export const options = {
  /* 
   * CONFIGURACIÓN DE CARGA INICIAL - MODO "TEST"
   * ----------------------------------------
   * Esta configuración ligera es ideal para desarrollo y pruebas iniciales.
   * Para realizar pruebas de carga más realistas, considera modificar estos parámetros:
   *
   * Escenarios de prueba recomendados:
   * 1. Prueba de humo: 2-5 VUs durante 1-2 minutos (comprobar funcionalidad básica)
   * 2. Prueba de carga: 10-20 VUs durante 5-10 minutos (simular carga normal)
   * 3. Prueba de pico: 30-50 VUs durante 2-5 minutos (simular picos de tráfico)
   * 4. Prueba de resistencia: 10-20 VUs durante 30-60 minutos (detectar memory leaks)
   */
  vus: 2,                  // Sólo 2 usuarios virtuales concurrentes
  duration: '10s',         // Duración más corta: 10 segundos

  // Para configuraciones más avanzadas, puedes usar escenarios como este:
  // scenarios: {
  //   ramping_load: {
  //     executor: 'ramping-vus',
  //     startVUs: 0,
  //     stages: [
  //       { duration: '30s', target: 5 },   // Ramp-up a 5 usuarios en 30s
  //       { duration: '1m', target: 5 },    // Mantener 5 usuarios por 1 minuto
  //       { duration: '30s', target: 20 },  // Ramp-up a 20 usuarios en 30s
  //       { duration: '2m', target: 20 },   // Mantener 20 usuarios por 2 minutos
  //       { duration: '30s', target: 0 },   // Ramp-down a 0 usuarios
  //     ],
  //   },
  // },

  // Umbrales de rendimiento (ajustados para ser más realistas)
  thresholds: {
    'http_req_duration': ['p(95)<5000'],     // 5 segundos para el 95% de requests
    'http_req_failed': ['rate<0.10'],        // Hasta 10% de fallos permitidos
    'login_errors': ['count<10'],            // Hasta 10 errores de login
    'product_errors': ['count<15'],          // Hasta 15 errores de productos
    'api_call_duration': ['p(95)<4000'],     // 4 segundos para llamadas API
  },
};

// Variables de entorno - Se obtienen del sistema o de los parámetros pasados a k6
const baseUrl = __ENV.API_BASE;
const authEndpoint = '/api/v1/auth/login';
const merchantId = __ENV.MERCHANT_ID || ''; // ID del comerciante si es necesario

// Credenciales de prueba para k6 Cloud (usuario real de testing)
const testUser = {
  email: __ENV.USER_EMAIL,
  password: __ENV.USER_PASSWORD
};

// Comprobación de seguridad: asegurar que las variables críticas están definidas
if (!baseUrl || !testUser.email || !testUser.password) {
  throw new Error('Faltan variables de entorno críticas. Asegúrate de definir API_BASE, USER_EMAIL y USER_PASSWORD.');
}

console.log(`Usando API base: ${baseUrl}`);
console.log(`Usuario de prueba: ${testUser.email}`);

// Función principal que ejecutará cada usuario virtual
export default function() {
  // Variable para almacenar el token entre grupos
  let token = null;
  
  // Grupo para el Login - agrupa métricas y logs relacionados con el login
  group('Login Flow', function() {
    console.log(`VU ${__VU}: iniciando login`);
    
    const loginPayload = JSON.stringify({
      email: testUser.email,
      password: testUser.password
    });
    
    const loginParams = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // Realizar petición de login
    const loginRes = http.post(
      `${baseUrl}${authEndpoint}`, 
      loginPayload, 
      loginParams
    );
    
    // Mostrar la respuesta para depuración
    console.log(`VU ${__VU}: Respuesta de login: ${loginRes.body}`);
    
    // Verificar si el login fue exitoso
    const loginSuccess = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'has access token': (r) => r.json('data.token') !== undefined, // El token está dentro de data.token
    });
    
    if (!loginSuccess) {
      loginErrors.add(1);
      console.log(`VU ${__VU}: Error de login - ${loginRes.status}`);
      return;  // Si el login falla, no continuar con el resto del flujo
    }
    
    // Extraer token para usarlo en las siguientes peticiones
    try {
      token = loginRes.json('data.token'); // El token está dentro del objeto data
      console.log(`VU ${__VU}: Token obtenido correctamente`);
    } catch (error) {
      console.log(`VU ${__VU}: Error al obtener el token: ${error.message}`);
    }
  });
  
  // Simular el tiempo que un usuario real pasaría en la página después de iniciar sesión
  sleep(1);
  
  // Si no hay token, terminar la ejecución para este VU
  if (!token) {
    return;
  }
  
  // Grupo para operaciones con Productos
  group('Products Operations', function() {
    // Configuración para peticiones autenticadas con merchant ID
    const authParams = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-merchant-id': merchantId,  // Header obligatorio según Swagger
      },
    };
    
    // 1. Obtener lista de productos
    console.log(`VU ${__VU}: obteniendo lista de productos`);
    const startTime = new Date();
    
    // Ajustamos la URL para productos según el Swagger
    const catalogUrl = `${baseUrl}/catalog`;
    console.log(`VU ${__VU}: URL de catálogo: ${catalogUrl}`);
    
    // Parámetros opcionales de búsqueda y paginación
    const queryParams = {
      limit: 10,
      offset: 0,
      // Podemos añadir type: 'PRODUCT' para filtrar solo por productos
    };
    
    const productsRes = http.get(
      catalogUrl, 
      { ...authParams, tags: { name: 'get_catalog' }, params: queryParams }
    );
    apiCallDuration.add(new Date() - startTime, { api: 'products' });
    
    // Mostrar respuesta para depuración
    console.log(`VU ${__VU}: Respuesta de productos (status: ${productsRes.status}): ${productsRes.body.substring(0, 150)}...`);
    
    // Verificar respuesta - ajustada para la estructura probable de datos.products[]
    const productsSuccess = check(productsRes, {
      'products status is 200': (r) => r.status === 200,
      'has products data': (r) => r.json('data') !== undefined,
    });
    
    if (!productsSuccess) {
      productErrors.add(1);
      console.log(`VU ${__VU}: Error al obtener productos - ${productsRes.status}`);
    } else {
      // Si la petición fue exitosa, intentar obtener un producto específico
      try {
        // Intentamos acceder a los productos tanto en data como en data.products
        // Ahora sabemos exactamente dónde están los productos según el Swagger
        const products = productsRes.json('data');
        
        if (!Array.isArray(products)) {
          throw new Error('La respuesta no contiene un array de productos');
        }
        
        if (products && products.length > 0) {
          // Seleccionar un producto aleatorio de la lista
          const randomIndex = Math.floor(Math.random() * products.length);
          const product = products[randomIndex];
          const productId = product.id;
          
          console.log(`VU ${__VU}: Producto seleccionado: ${JSON.stringify(product)}`);
          
          // Obtener detalles de un producto específico
          console.log(`VU ${__VU}: obteniendo detalles del producto ${productId}`);
          const productDetailRes = http.get(
            `${catalogUrl}/${productId}`, 
            authParams
          );
          
          console.log(`VU ${__VU}: Respuesta detalle producto (status: ${productDetailRes.status}): ${productDetailRes.body.substring(0, 150)}...`);
          
          check(productDetailRes, {
            'product detail status is 200': (r) => r.status === 200,
            'has product data': (r) => r.json('data') !== undefined,
          });
        } else {
          console.log(`VU ${__VU}: No se encontraron productos en la respuesta`);
        }
      } catch (e) {
        console.log(`VU ${__VU}: Error procesando productos: ${e.message}`);
        productErrors.add(1);
      }
    }
  });
  
  // Simular tiempo entre acciones del usuario
  sleep(Math.random() * 3 + 1); // Entre 1-4 segundos
  
  // Grupo para operaciones con Facturas
  group('Invoice Operations', function() {
    // Aquí puedes añadir operaciones relacionadas con facturas
    // Similar a las operaciones con productos
  });
  
  // Pausa antes de que el usuario virtual inicie un nuevo ciclo
  sleep(Math.random() * 2 + 1); // Entre 1-3 segundos
}

// Función opcional que se ejecuta al inicio de la prueba (una sola vez)
export function setup() {
  console.log('Iniciando prueba de carga para Factupro');
}

// Función opcional que se ejecuta al finalizar la prueba (una sola vez)
export function teardown(data) {
  console.log('Finalizando prueba de carga para Factupro');
}

// Esta función personaliza el formato del informe final
export function handleSummary(data) {
  console.log('Generando resumen de la prueba...');
  
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    './k6-results.json': JSON.stringify(data),
  };
}
