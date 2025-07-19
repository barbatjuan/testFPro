import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Definición de métricas personalizadas
const loginErrors = new Counter('login_errors');
const productErrors = new Counter('product_errors');
const apiCallDuration = new Trend('api_call_duration');

export const options = {
  vus: 2,
  duration: '10s',
  thresholds: {
    'login_errors': ['count<10'],
    'product_errors': ['count<10'],
  },
};

export default function () {
  // Simulamos incrementar los contadores de errores
  loginErrors.add(1);
  productErrors.add(2);
  
  // Simulamos tiempos de API
  apiCallDuration.add(100, { api: 'login' });
  apiCallDuration.add(200, { api: 'products' });
  
  // Hacemos una petición HTTP simple para generar métricas estándar
  http.get('https://test.k6.io');
  
  sleep(1);
}
