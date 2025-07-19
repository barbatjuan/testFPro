import { sleep, group } from 'k6';
import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Importamos funciones compartidas
import { performLogin, getAuthHeaders, loginErrors } from './shared/auth.js';
import { randomNumber, randomItem, formatSummary, thresholds } from './shared/utils.js';

// Métrica para errores y duración de llamadas al catálogo
export const productErrors = new Counter('product_errors');
export const catalogCallDuration = new Trend('catalog_call_duration');

// Opciones de la prueba
export const options = {
  // Configuración de la carga - versión ligera
  vus: 2,                  // Solo 2 usuarios virtuales concurrentes
  duration: '10s',         // Duración corta: 10 segundos

  // Umbrales de rendimiento específicos para catálogo
  thresholds: thresholds.catalog,
};

// Variables de entorno
const baseUrl = __ENV.API_BASE || 'https://api.factupro.com/api/v1';
const merchantId = __ENV.MERCHANT_ID || '';
const testUser = {
  email: __ENV.USER_EMAIL || 'usuario@test.com',
  password: __ENV.USER_PASSWORD || 'contraseña_segura'
};

console.log(`Prueba de catálogo: Usando API base: ${baseUrl}`);
console.log(`Usuario de prueba: ${testUser.email}`);

/**
 * Obtiene la lista de productos del catálogo
 * 
 * @param {string} baseUrl - URL base de la API
 * @param {Object} authHeaders - Headers con autenticación
 * @returns {Array|null} - Lista de productos o null si falló
 */
function getProductCatalog(baseUrl, authHeaders) {
  console.log('Obteniendo catálogo de productos...');
  
  // Registrar tiempo de inicio para medir duración
  const startTime = new Date();
  
  // Hacer petición GET al catálogo
  const catalogRes = http.get(
    `${baseUrl}/catalog`,
    {
      ...authHeaders,
      tags: { name: 'get_product_catalog' }
    }
  );
  
  // Calcular duración de la llamada
  catalogCallDuration.add(new Date() - startTime);
  
  // Verificar si la petición fue exitosa
  const success = check(catalogRes, {
    'catalog status is 200': (r) => r.status === 200,
    'catalog has data': (r) => r.json('data') !== undefined,
  });
  
  if (!success) {
    productErrors.add(1);
    console.log(`Error al obtener catálogo - Status: ${catalogRes.status}`);
    return null;
  }
  
  try {
    // Extraer datos del catálogo
    const catalogData = catalogRes.json('data');
    console.log(`Catálogo obtenido. ${catalogData.length} elementos encontrados.`);
    return catalogData;
  } catch (error) {
    productErrors.add(1);
    console.log(`Error procesando respuesta del catálogo: ${error}`);
    return null;
  }
}

/**
 * Obtiene los detalles de un producto específico
 * 
 * @param {string} baseUrl - URL base de la API
 * @param {string} productId - ID del producto
 * @param {Object} authHeaders - Headers con autenticación
 * @returns {Object|null} - Detalles del producto o null si falló
 */
function getProductDetails(baseUrl, productId, authHeaders) {
  console.log(`Obteniendo detalles del producto: ${productId}`);
  
  // Hacer petición GET al producto específico
  const productRes = http.get(
    `${baseUrl}/catalog/${productId}`,
    {
      ...authHeaders,
      tags: { name: 'get_product_details' }
    }
  );
  
  // Verificar si la petición fue exitosa
  const success = check(productRes, {
    'product details status is 200': (r) => r.status === 200,
    'product details has data': (r) => r.json('data') !== undefined,
  });
  
  if (!success) {
    productErrors.add(1);
    console.log(`Error al obtener detalles del producto - Status: ${productRes.status}`);
    return null;
  }
  
  try {
    // Extraer datos del producto
    const productData = productRes.json('data');
    console.log(`Detalles del producto obtenidos: ${productData.name}`);
    return productData;
  } catch (error) {
    productErrors.add(1);
    console.log(`Error procesando detalles del producto: ${error}`);
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
  
  // Obtener catálogo de productos
  let products = null;
  
  group('2. Listar Productos', function() {
    products = getProductCatalog(baseUrl, authHeaders);
  });
  
  // Si no hay productos, terminar la ejecución
  if (!products || products.length === 0) return;
  
  // Simular tiempo entre acciones del usuario
  sleep(randomNumber(1, 2));
  
  // Seleccionar un producto aleatorio y ver sus detalles
  group('3. Ver Detalle de Producto', function() {
    // Elegir un producto aleatorio
    const randomProduct = randomItem(products);
    console.log(`Producto seleccionado: ${randomProduct.name} (ID: ${randomProduct.id})`);
    
    // Obtener detalles del producto
    const productDetails = getProductDetails(baseUrl, randomProduct.id, authHeaders);
    
    // Simular tiempo revisando el producto
    if (productDetails) {
      sleep(randomNumber(1, 3));
    }
  });
  
  // Pausa final antes de terminar
  sleep(randomNumber(1, 2));
}

// Personalizar el formato del informe
export function handleSummary(data) {
  return formatSummary(data, 'catalog');
}
