import { sleep, group } from 'k6';
import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Importamos funciones compartidas
import { performLogin, getAuthHeaders, loginErrors } from './shared/auth.js';
import { randomNumber, randomItem, formatSummary, thresholds } from './shared/utils.js';

// Métrica para errores y duración de llamadas a contactos
export const contactErrors = new Counter('contact_errors');
export const contactCallDuration = new Trend('contact_call_duration');

// Opciones de la prueba
export const options = {
  // Configuración de la carga - versión ligera
  vus: 2,                  // Solo 2 usuarios virtuales concurrentes
  duration: '10s',         // Duración corta: 10 segundos

  // Umbrales de rendimiento específicos para contactos
  thresholds: thresholds.contacts,
};

// Variables de entorno
const baseUrl = __ENV.API_BASE || 'https://api.factupro.com/api/v1';
const merchantId = __ENV.MERCHANT_ID || '';
const testUser = {
  email: __ENV.USER_EMAIL || 'usuario@test.com',
  password: __ENV.USER_PASSWORD || 'contraseña_segura'
};

console.log(`Prueba de contactos: Usando API base: ${baseUrl}`);
console.log(`Usuario de prueba: ${testUser.email}`);

/**
 * Obtiene la lista de contactos
 * 
 * @param {string} baseUrl - URL base de la API
 * @param {Object} authHeaders - Headers con autenticación
 * @param {Object} queryParams - Parámetros de consulta opcionales
 * @returns {Array|null} - Lista de contactos o null si falló
 */
function getContacts(baseUrl, authHeaders, queryParams = {}) {
  console.log('Obteniendo lista de contactos...');
  
  // Registrar tiempo de inicio para medir duración
  const startTime = new Date();
  
  // Parámetros por defecto
  const defaultParams = {
    limit: 10,
    offset: 0
  };
  
  // Combinar parámetros por defecto con los proporcionados
  const params = { ...defaultParams, ...queryParams };
  
  // Hacer petición GET a contactos
  const contactsRes = http.get(
    `${baseUrl}/contacts`,
    {
      ...authHeaders,
      tags: { name: 'get_contacts' },
      params: params
    }
  );
  
  // Calcular duración de la llamada
  contactCallDuration.add(new Date() - startTime);
  
  // Verificar si la petición fue exitosa
  const success = check(contactsRes, {
    'contacts status is 200': (r) => r.status === 200,
    'contacts has data': (r) => r.json('data') !== undefined,
  });
  
  if (!success) {
    contactErrors.add(1);
    console.log(`Error al obtener contactos - Status: ${contactsRes.status}`);
    return null;
  }
  
  try {
    // Extraer datos de contactos
    const contactsData = contactsRes.json('data');
    console.log(`Contactos obtenidos. ${contactsData.length} elementos encontrados.`);
    return contactsData;
  } catch (error) {
    contactErrors.add(1);
    console.log(`Error procesando respuesta de contactos: ${error}`);
    return null;
  }
}

/**
 * Obtiene los detalles de un contacto específico
 * 
 * @param {string} baseUrl - URL base de la API
 * @param {string} contactId - ID del contacto
 * @param {Object} authHeaders - Headers con autenticación
 * @returns {Object|null} - Detalles del contacto o null si falló
 */
function getContactDetails(baseUrl, contactId, authHeaders) {
  console.log(`Obteniendo detalles del contacto: ${contactId}`);
  
  // Hacer petición GET al contacto específico
  const contactRes = http.get(
    `${baseUrl}/contacts/${contactId}`,
    {
      ...authHeaders,
      tags: { name: 'get_contact_details' }
    }
  );
  
  // Verificar si la petición fue exitosa
  const success = check(contactRes, {
    'contact details status is 200': (r) => r.status === 200,
    'contact details has data': (r) => r.json('data') !== undefined,
  });
  
  if (!success) {
    contactErrors.add(1);
    console.log(`Error al obtener detalles del contacto - Status: ${contactRes.status}`);
    return null;
  }
  
  try {
    // Extraer datos del contacto
    const contactData = contactRes.json('data');
    console.log(`Detalles del contacto obtenidos: ${contactData.name || contactData.id}`);
    return contactData;
  } catch (error) {
    contactErrors.add(1);
    console.log(`Error procesando detalles del contacto: ${error}`);
    return null;
  }
}

/**
 * Busca contactos por término
 * 
 * @param {string} baseUrl - URL base de la API
 * @param {string} searchTerm - Término de búsqueda
 * @param {Object} authHeaders - Headers con autenticación
 * @returns {Array|null} - Lista de contactos encontrados o null si falló
 */
function searchContacts(baseUrl, searchTerm, authHeaders) {
  console.log(`Buscando contactos con término: "${searchTerm}"`);
  
  // Hacer petición de búsqueda
  const searchRes = http.get(
    `${baseUrl}/contacts`,
    {
      ...authHeaders,
      tags: { name: 'search_contacts' },
      params: {
        search: searchTerm,
        limit: 5
      }
    }
  );
  
  // Verificar si la petición fue exitosa
  const success = check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search has data': (r) => r.json('data') !== undefined,
  });
  
  if (!success) {
    contactErrors.add(1);
    console.log(`Error al buscar contactos - Status: ${searchRes.status}`);
    return null;
  }
  
  try {
    // Extraer resultados de búsqueda
    const searchResults = searchRes.json('data');
    console.log(`Búsqueda completada. ${searchResults.length} contactos encontrados para "${searchTerm}"`);
    return searchResults;
  } catch (error) {
    contactErrors.add(1);
    console.log(`Error procesando resultados de búsqueda: ${error}`);
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
  
  // Obtener lista de contactos
  let contacts = null;
  
  group('2. Listar Contactos', function() {
    contacts = getContacts(baseUrl, authHeaders);
  });
  
  // Si no hay contactos, terminar la ejecución
  if (!contacts || contacts.length === 0) return;
  
  // Simular tiempo entre acciones del usuario
  sleep(randomNumber(1, 2));
  
  // Seleccionar un contacto aleatorio y ver sus detalles
  group('3. Ver Detalle de Contacto', function() {
    // Elegir un contacto aleatorio
    const randomContact = randomItem(contacts);
    
    // Obtener detalles del contacto
    const contactDetails = getContactDetails(baseUrl, randomContact.id, authHeaders);
    
    // Simular tiempo revisando el contacto
    if (contactDetails) {
      sleep(randomNumber(1, 3));
    }
  });
  
  // Buscar contactos por término
  group('4. Buscar Contactos', function() {
    // Términos de búsqueda comunes
    const searchTerms = ['empresa', 'cliente', 'juan', 'garcia', 'maria'];
    
    // Seleccionar un término aleatorio
    const randomTerm = randomItem(searchTerms);
    
    // Realizar la búsqueda
    const searchResults = searchContacts(baseUrl, randomTerm, authHeaders);
    
    // Simular tiempo revisando resultados
    if (searchResults && searchResults.length > 0) {
      sleep(randomNumber(1, 2));
    }
  });
  
  // Pausa final antes de terminar
  sleep(randomNumber(1, 2));
}

// Personalizar el formato del informe
export function handleSummary(data) {
  return formatSummary(data, 'contacts');
}
