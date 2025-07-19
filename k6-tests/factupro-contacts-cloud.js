/**
 * FACTUPRO - PRUEBA DE GESTIÓN DE CONTACTOS
 * 
 * Este test simula un usuario gestionando su lista de contactos/clientes:
 * 
 * 🔐 AUTENTICACIÓN:
 *   - Login con credenciales reales de prueba
 *   - Obtención y validación de token JWT
 * 
 * 📞 GESTIÓN DE CONTACTOS:
 *   - Listar contactos con paginación
 *   - Ver detalles de contactos específicos
 *   - Buscar contactos por términos comunes
 *   - Simular tiempo de revisión de información
 * 
 * 🔍 FUNCIONALIDADES DE BÚSQUEDA:
 *   - Búsqueda por nombre, empresa, etc.
 *   - Filtrado y paginación de resultados
 *   - Validación de resultados de búsqueda
 * 
 * 📊 MÉTRICAS MONITOREADAS:
 *   - login_errors: Errores de autenticación
 *   - contact_errors: Errores en operaciones de contactos
 *   - contact_call_duration: Duración de llamadas de contactos
 * 
 * ⚡ CONFIGURACIÓN:
 *   - 2 usuarios virtuales concurrentes
 *   - Duración: 30 segundos
 *   - Enfoque en operaciones de contactos
 * 
 * 🎯 OBJETIVO: Validar funcionalidad completa de gestión de contactos
 */

import { sleep, group } from 'k6';
import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Métricas personalizadas
const loginErrors = new Counter('login_errors');
const contactErrors = new Counter('contact_errors');
const contactCallDuration = new Trend('contact_call_duration');

// Opciones de la prueba optimizadas para k6 Cloud
export const options = {
  vus: 2,
  duration: '30s',
  
  // Umbrales de rendimiento específicos para contactos (ajustados)
  thresholds: {
    'http_req_duration': ['p(95)<5000'],     // 5 segundos para el 95% de requests
    'http_req_failed': ['rate<0.10'],        // Hasta 10% de fallos permitidos
    'login_errors': ['count<10'],            // Hasta 10 errores de login
    'contact_errors': ['count<15'],          // Hasta 15 errores de contactos
    'contact_call_duration': ['p(95)<4000'], // 4 segundos para llamadas de contactos
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

console.log(`Prueba de contactos: Usando API base: ${baseUrl}`);
console.log(`Usuario de prueba: ${testUser.email}`);

/**
 * Realiza login y retorna el token
 */
function performLogin() {
  console.log(`VU ${__VU}: iniciando login para contactos`);
  
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
      console.log(`VU ${__VU}: Login exitoso para contactos`);
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
 * Obtiene la lista de contactos
 */
function getContacts(token, queryParams = {}) {
  console.log(`VU ${__VU}: obteniendo lista de contactos`);
  
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
  const contactsUrl = `${baseUrl}/api/v1/contacts?${queryString}`;
  
  const contactsRes = http.get(contactsUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Merchant-Id': merchantId,
    },
    tags: { name: 'get_contacts' }
  });
  
  contactCallDuration.add(Date.now() - startTime);
  
  const success = check(contactsRes, {
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
  
  if (!success) {
    contactErrors.add(1);
    console.log(`VU ${__VU}: Error al obtener contactos - Status: ${contactsRes.status}`);
    return null;
  }
  
  try {
    const contactsData = JSON.parse(contactsRes.body).data;
    console.log(`VU ${__VU}: Contactos obtenidos. ${contactsData.length} elementos encontrados`);
    return contactsData;
  } catch (error) {
    contactErrors.add(1);
    console.log(`VU ${__VU}: Error procesando respuesta de contactos: ${error}`);
    return null;
  }
}

/**
 * Obtiene los detalles de un contacto específico
 */
function getContactDetails(token, contactId) {
  console.log(`VU ${__VU}: obteniendo detalles del contacto: ${contactId}`);
  
  const contactRes = http.get(`${baseUrl}/api/v1/contacts/${contactId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Merchant-Id': merchantId,
    },
    tags: { name: 'get_contact_details' }
  });
  
  const success = check(contactRes, {
    'contact details status is 200': (r) => r.status === 200,
    'contact details has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  if (!success) {
    contactErrors.add(1);
    console.log(`VU ${__VU}: Error al obtener detalles del contacto - Status: ${contactRes.status}`);
    return null;
  }
  
  try {
    const contactData = JSON.parse(contactRes.body).data;
    console.log(`VU ${__VU}: Detalles del contacto obtenidos: ${contactData.name || contactData.id}`);
    return contactData;
  } catch (error) {
    contactErrors.add(1);
    console.log(`VU ${__VU}: Error procesando detalles del contacto: ${error}`);
    return null;
  }
}

/**
 * Busca contactos por término
 */
function searchContacts(token, searchTerm) {
  console.log(`VU ${__VU}: buscando contactos con término: "${searchTerm}"`);
  
  // Construir parámetros de búsqueda manualmente
  const searchQuery = `search=${encodeURIComponent(searchTerm)}&limit=5`;
  
  const searchRes = http.get(`${baseUrl}/api/v1/contacts?${searchQuery}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Merchant-Id': merchantId,
    },
    tags: { name: 'search_contacts' }
  });
  
  const success = check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  if (!success) {
    contactErrors.add(1);
    console.log(`VU ${__VU}: Error al buscar contactos - Status: ${searchRes.status}`);
    return null;
  }
  
  try {
    const searchResults = JSON.parse(searchRes.body).data;
    console.log(`VU ${__VU}: Búsqueda completada. ${searchResults.length} contactos encontrados para "${searchTerm}"`);
    return searchResults;
  } catch (error) {
    contactErrors.add(1);
    console.log(`VU ${__VU}: Error procesando resultados de búsqueda: ${error}`);
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
  
  // Grupo 2: Listar Contactos
  let contacts = null;
  group('2. Listar Contactos', function() {
    contacts = getContacts(token);
  });
  
  // Si no hay contactos, terminar la ejecución
  if (!contacts || contacts.length === 0) {
    console.log(`VU ${__VU}: No hay contactos disponibles`);
    return;
  }
  
  // Simular tiempo entre acciones del usuario
  sleep(Math.random() * 2 + 1);
  
  // Grupo 3: Ver Detalle de Contacto
  group('3. Ver Detalle de Contacto', function() {
    // Elegir un contacto aleatorio
    const randomIndex = Math.floor(Math.random() * contacts.length);
    const randomContact = contacts[randomIndex];
    
    console.log(`VU ${__VU}: Contacto seleccionado: ${randomContact.name || randomContact.id}`);
    
    // Obtener detalles del contacto
    const contactDetails = getContactDetails(token, randomContact.id);
    
    // Simular tiempo revisando el contacto
    if (contactDetails) {
      sleep(Math.random() * 3 + 1);
    }
  });
  
  // Grupo 4: Buscar Contactos
  group('4. Buscar Contactos', function() {
    // Términos de búsqueda comunes
    const searchTerms = ['empresa', 'cliente', 'juan', 'garcia', 'maria'];
    
    // Seleccionar un término aleatorio
    const randomIndex = Math.floor(Math.random() * searchTerms.length);
    const randomTerm = searchTerms[randomIndex];
    
    // Realizar la búsqueda
    const searchResults = searchContacts(token, randomTerm);
    
    // Simular tiempo revisando resultados
    if (searchResults && searchResults.length > 0) {
      sleep(Math.random() * 2 + 1);
    }
  });
  
  // Pausa final antes de terminar
  sleep(Math.random() * 2 + 1);
}

// Personalizar el formato del informe
export function handleSummary(data) {
  console.log('Finalizando prueba de contactos para Factupro');
  
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}
