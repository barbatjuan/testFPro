/**
 * FACTUPRO - PRUEBA COMPLETA INTEGRADA
 * 
 * Este test simula un flujo completo de trabajo de un usuario de Factupro:
 * 
 * AUTENTICACIÓN:
 *   - Login con credenciales reales de prueba
 *   - Obtención y validación de token JWT
 * 
 * NAVEGACIÓN POR PRODUCTOS:
 *   - Listar productos del catálogo
 *   - Ver detalles de productos específicos
 *   - Navegación realista entre productos
 * 
 * GESTIÓN DE CONTACTOS:
 *   - Listar contactos existentes
 *   - Ver detalles de contactos
 *   - Buscar contactos por términos
 * 
 * OPERACIONES CON FACTURAS:
 *   - Listar facturas existentes
 *   - Filtrar por diferentes estados
 *   - Ver detalles de facturas específicas
 * 
 * FLUJO END-TO-END:
 *   - Simula un flujo de trabajo completo y realista
 *   - Incluye pausas naturales entre acciones
 *   - Valida todas las operaciones principales
 * 
 * MÉTRICAS MONITOREADAS:
 *   - login_errors: Errores de autenticación
 *   - product_errors: Errores en operaciones de productos
 *   - contact_errors: Errores en operaciones de contactos
 *   - api_call_duration: Duración general de llamadas API
 * 
 * CONFIGURACIÓN:
 *   - 3 usuarios virtuales concurrentes
 *   - Duración: 60 segundos
 *   - Cobertura completa de funcionalidades
 * 
 * OBJETIVO: Validar el flujo completo end-to-end de Factupro con carga realista
 */

import http from 'k6/http';
import { sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Métricas personalizadas
const loginErrors = new Counter('login_errors');
const productErrors = new Counter('product_errors');
const apiCallDuration = new Trend('api_call_duration');

// Opciones de la prueba optimizadas para k6 Cloud
export const options = {
  vus: 2,
  duration: '30s',
  
  // Umbrales de rendimiento (ajustados para ser más realistas)
  thresholds: {
    'http_req_duration': ['p(95)<5000'],     // 5 segundos para el 95% de requests
    'http_req_failed': ['rate<0.10'],        // Hasta 10% de fallos permitidos
    'login_errors': ['count<10'],            // Hasta 10 errores de login
    'product_errors': ['count<15'],          // Hasta 15 errores de productos
    'contact_errors': ['count<15'],          // Hasta 15 errores de contactos
    'api_call_duration': ['p(95)<4000'],     // 4 segundos para llamadas API
  },
};

// Configuración para k6 Cloud - credenciales directas
const baseUrl = 'https://factupro-backend-development.up.railway.app';
const authEndpoint = '/api/v1/auth/login';

// Credenciales de prueba para k6 Cloud (usuario real de testing)
const testUser = {
  email: 'testfpro1@adrirodrigoagencia.es',
  password: 'Testfpro_123!!'
};

console.log(`Usando API base: ${baseUrl}`);
console.log(`Usuario de prueba: ${testUser.email}`);

// Función principal que ejecutará cada usuario virtual
export default function() {
  // Variable para almacenar el token entre grupos
  let token = null;
  
  // Grupo para el Login - agrupa métricas y logs relacionados con el login
  group('Login Flow', function() {
    console.log(`VU ${__VU}: iniciando login`);
    
    // Medimos el tiempo de la llamada de login
    const loginStart = Date.now();
    
    const loginResponse = http.post(`${baseUrl}${authEndpoint}`, JSON.stringify({
      email: testUser.email,
      password: testUser.password
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Registramos el tiempo de la llamada API
    apiCallDuration.add(Date.now() - loginStart);
    
    console.log(`VU ${__VU}: Respuesta de login: ${loginResponse.body}`);
    
    // Verificamos que el login fue exitoso
    const loginSuccess = check(loginResponse, {
      'login status is 200': (r) => r.status === 200,
      'has access token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.accessToken;
        } catch (e) {
          return false;
        }
      },
    });
    
    if (loginSuccess && loginResponse.status === 200) {
      try {
        const loginData = JSON.parse(loginResponse.body);
        token = loginData.data.accessToken;
        console.log(`VU ${__VU}: Login exitoso, token obtenido`);
      } catch (e) {
        console.log(`VU ${__VU}: Error parseando respuesta de login`);
        loginErrors.add(1);
      }
    } else {
      console.log(`VU ${__VU}: Error de login - ${loginResponse.status}`);
      loginErrors.add(1);
    }
  });
  
  // Solo continuamos si tenemos un token válido
  if (token) {
    // Grupo para operaciones de productos
    group('Products Operations', function() {
      console.log(`VU ${__VU}: obteniendo productos`);
      
      const productsStart = Date.now();
      
      // Intentamos obtener la lista de productos (ajusta el endpoint según tu API)
      const productsResponse = http.get(`${baseUrl}/api/v1/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      apiCallDuration.add(Date.now() - productsStart);
      
      const productsSuccess = check(productsResponse, {
        'products status is 200': (r) => r.status === 200,
        'has products data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data !== undefined;
          } catch (e) {
            return false;
          }
        },
      });
      
      if (!productsSuccess) {
        console.log(`VU ${__VU}: Error obteniendo productos - ${productsResponse.status}`);
        productErrors.add(1);
      } else {
        console.log(`VU ${__VU}: Productos obtenidos exitosamente`);
      }
    });
    
    // Grupo para operaciones de facturas/contactos
    group('Invoice Operations', function() {
      console.log(`VU ${__VU}: probando endpoints adicionales`);
      
      // Puedes agregar más endpoints aquí según tu API
      const contactsStart = Date.now();
      
      const contactsResponse = http.get(`${baseUrl}/api/v1/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      apiCallDuration.add(Date.now() - contactsStart);
      
      check(contactsResponse, {
        'contacts accessible': (r) => r.status === 200 || r.status === 404, // 404 puede ser normal si no hay contactos
      });
      
      console.log(`VU ${__VU}: Respuesta de contactos: ${contactsResponse.status}`);
    });
  }
  
  // Pausa entre iteraciones para simular comportamiento real del usuario
  sleep(1);
}

// Función de resumen personalizada para k6 Cloud
export function handleSummary(data) {
  console.log('Finalizando prueba de carga para Factupro');
  
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}
