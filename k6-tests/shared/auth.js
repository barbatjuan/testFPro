import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

// Métrica para errores de login
export const loginErrors = new Counter('login_errors');

/**
 * Realiza el proceso de autenticación y obtiene un token
 * 
 * @param {string} baseUrl - URL base de la API
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {string|null} - Token de autenticación o null si falló
 */
export function performLogin(baseUrl, email, password) {
  console.log(`Iniciando login para usuario: ${email}`);
  
  // Endpoint de autenticación
  const authEndpoint = '/auth/login';
  
  // Datos del login
  const loginPayload = JSON.stringify({
    email: email,
    password: password
  });
  
  // Headers para el login
  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'login' }
  };
  
  // Realizar la petición de login
  const loginRes = http.post(
    `${baseUrl}${authEndpoint}`, 
    loginPayload, 
    loginParams
  );
  
  // Verificar si el login fue exitoso
  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => r.json('data.token') !== undefined,
  });
  
  if (!loginSuccess) {
    loginErrors.add(1);
    console.log(`Error de login - Status: ${loginRes.status}, Response: ${loginRes.body}`);
    return null;
  }
  
  // Obtener el token del cuerpo de la respuesta
  try {
    const token = loginRes.json('data.token');
    console.log('Login exitoso, token obtenido');
    return token;
  } catch (error) {
    console.log(`Error al extraer el token: ${error}`);
    loginErrors.add(1);
    return null;
  }
}

/**
 * Crea los headers de autenticación para las peticiones a la API
 * 
 * @param {string} token - Token de autenticación
 * @param {string} merchantId - ID del comerciante
 * @returns {Object} - Headers para peticiones autenticadas
 */
export function getAuthHeaders(token, merchantId) {
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-merchant-id': merchantId
    }
  };
}
