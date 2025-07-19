/**
 * FACTUPRO - PRUEBA DE CATÁLOGO DE PRODUCTOS
 * 
 * Este test simula un usuario navegando y explorando el catálogo de productos:
 * 
 * 🔐 AUTENTICACIÓN:
 *   - Login con credenciales reales de prueba
 *   - Obtención y validación de token JWT
 * 
 * 📦 NAVEGACIÓN DE CATÁLOGO:
 *   - Obtener catálogo completo de productos
 *   - Listar productos con paginación
 *   - Ver detalles de productos aleatorios
 *   - Simular tiempo de navegación realista
 * 
 * 📊 MÉTRICAS MONITOREADAS:
 *   - login_errors: Errores de autenticación
 *   - product_errors: Errores en operaciones de productos
 *   - catalog_call_duration: Duración de llamadas al catálogo
 * 
 * ⚡ CONFIGURACIÓN:
 *   - 2 usuarios virtuales concurrentes
 *   - Duración: 30 segundos
 *   - Enfoque en rendimiento del catálogo
 * 
 * 🎯 OBJETIVO: Validar rendimiento y funcionalidad del catálogo de productos
 */

import { sleep, group } from 'k6';
import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Métricas personalizadas
const loginErrors = new Counter('login_errors');
const productErrors = new Counter('product_errors');
const catalogCallDuration = new Trend('catalog_call_duration');

// Opciones de la prueba optimizadas para k6 Cloud
export const options = {
  vus: 2,
  duration: '30s',
  
  // Umbrales de rendimiento específicos para catálogo (ajustados)
  thresholds: {
    'http_req_duration': ['p(95)<5000'],     // 5 segundos para el 95% de requests
    'http_req_failed': ['rate<0.10'],        // Hasta 10% de fallos permitidos
    'login_errors': ['count<10'],            // Hasta 10 errores de login
    'product_errors': ['count<15'],          // Hasta 15 errores de productos
    'catalog_call_duration': ['p(95)<4000'], // 4 segundos para llamadas de catálogo
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

console.log(`Prueba de catálogo: Usando API base: ${baseUrl}`);
console.log(`Usuario de prueba: ${testUser.email}`);

/**
 * Realiza login y retorna el token
 */
function performLogin() {
  console.log(`VU ${__VU}: iniciando login para catálogo`);
  
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
      console.log(`VU ${__VU}: Login exitoso para catálogo`);
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
 * Obtiene la lista de productos del catálogo
 */
function getProductCatalog(token) {
  console.log(`VU ${__VU}: obteniendo catálogo de productos`);
  
  const startTime = Date.now();
  
  const catalogRes = http.get(`${baseUrl}/api/v1/catalog`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Merchant-Id': merchantId,
    },
    tags: { name: 'get_product_catalog' }
  });
  
  catalogCallDuration.add(Date.now() - startTime);
  
  const success = check(catalogRes, {
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
  
  if (!success) {
    productErrors.add(1);
    console.log(`VU ${__VU}: Error al obtener catálogo - Status: ${catalogRes.status}`);
    return null;
  }
  
  try {
    const catalogData = JSON.parse(catalogRes.body).data;
    console.log(`VU ${__VU}: Catálogo obtenido. ${catalogData.length} elementos encontrados`);
    return catalogData;
  } catch (error) {
    productErrors.add(1);
    console.log(`VU ${__VU}: Error procesando respuesta del catálogo: ${error}`);
    return null;
  }
}

/**
 * Obtiene los detalles de un producto específico
 */
function getProductDetails(token, productId) {
  console.log(`VU ${__VU}: obteniendo detalles del producto: ${productId}`);
  
  const productRes = http.get(`${baseUrl}/api/v1/catalog/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Merchant-Id': merchantId,
    },
    tags: { name: 'get_product_details' }
  });
  
  const success = check(productRes, {
    'product details status is 200': (r) => r.status === 200,
    'product details has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  if (!success) {
    productErrors.add(1);
    console.log(`VU ${__VU}: Error al obtener detalles del producto - Status: ${productRes.status}`);
    return null;
  }
  
  try {
    const productData = JSON.parse(productRes.body).data;
    console.log(`VU ${__VU}: Detalles del producto obtenidos: ${productData.name || 'Sin nombre'}`);
    return productData;
  } catch (error) {
    productErrors.add(1);
    console.log(`VU ${__VU}: Error procesando detalles del producto: ${error}`);
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
  
  // Grupo 2: Listar Productos
  let products = null;
  group('2. Listar Productos', function() {
    products = getProductCatalog(token);
  });
  
  // Si no hay productos, terminar la ejecución
  if (!products || products.length === 0) {
    console.log(`VU ${__VU}: No hay productos disponibles`);
    return;
  }
  
  // Simular tiempo entre acciones del usuario
  sleep(Math.random() * 2 + 1);
  
  // Grupo 3: Ver Detalle de Producto
  group('3. Ver Detalle de Producto', function() {
    // Elegir un producto aleatorio
    const randomIndex = Math.floor(Math.random() * products.length);
    const randomProduct = products[randomIndex];
    
    console.log(`VU ${__VU}: Producto seleccionado: ${randomProduct.name || 'Sin nombre'} (ID: ${randomProduct.id})`);
    
    // Obtener detalles del producto
    const productDetails = getProductDetails(token, randomProduct.id);
    
    // Simular tiempo revisando el producto
    if (productDetails) {
      sleep(Math.random() * 3 + 1);
    }
  });
  
  // Pausa final antes de terminar
  sleep(Math.random() * 2 + 1);
}

// Personalizar el formato del informe
export function handleSummary(data) {
  console.log('Finalizando prueba de catálogo para Factupro');
  
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}
