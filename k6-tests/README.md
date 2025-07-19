# Factupro - Pruebas de Carga con k6

Este directorio contiene pruebas de carga para la API de Factupro utilizando [k6](https://k6.io), una herramienta moderna para pruebas de rendimiento.

## Estructura del Proyecto

```
k6-tests/
├── factupro-basic-test.js     # Script original básico
├── factupro-catalog-test.js   # Pruebas para catálogo de productos
├── factupro-invoices-test.js  # Pruebas para facturas
├── factupro-contacts-test.js  # Pruebas para contactos
├── shared/                    # Código compartido reutilizable
│   ├── auth.js                # Funciones de autenticación
│   └── utils.js               # Utilidades y configuraciones
└── run-tests.sh               # Script para ejecutar las pruebas
```

## Requisitos Previos

- [k6](https://k6.io/docs/getting-started/installation/) instalado
- [dotenv-cli](https://www.npmjs.com/package/dotenv-cli) para cargar variables de entorno

## Configuración

Copia el archivo `.env.example` a `.env` y configura las siguientes variables:

```
API_BASE=https://api.factupro.com/api/v1  # URL base de la API
MERCHANT_ID=tu-id-de-merchant             # ID de merchant para las pruebas
USER_EMAIL=usuario@ejemplo.com            # Email para autenticación
USER_PASSWORD=contraseña_segura           # Contraseña para autenticación
```

## Ejecución de Pruebas

### Usar el script de ayuda

Para ejecutar una prueba específica:

```bash
./k6-tests/run-tests.sh catalog   # Ejecuta la prueba de catálogo
./k6-tests/run-tests.sh invoices  # Ejecuta la prueba de facturas
./k6-tests/run-tests.sh contacts  # Ejecuta la prueba de contactos
```

Para ejecutar todas las pruebas:

```bash
./k6-tests/run-tests.sh all
```

### Ejecutar directamente con k6

Puedes ejecutar los scripts directamente con k6:

```bash
dotenv -- k6 run k6-tests/factupro-catalog-test.js
```

## Descripción de las Pruebas

### 1. Prueba de Catálogo (`factupro-catalog-test.js`)

Simula la navegación de usuarios por el catálogo de productos:

- Autenticación
- Listar productos del catálogo
- Ver detalles de un producto aleatorio

### 2. Prueba de Facturas (`factupro-invoices-test.js`)

Simula la gestión de facturas:

- Autenticación
- Listar facturas
- Filtrar facturas por estado
- Ver detalles de una factura

### 3. Prueba de Contactos (`factupro-contacts-test.js`)

Simula la gestión de contactos:

- Autenticación
- Listar contactos
- Ver detalles de un contacto
- Buscar contactos por término

## Código Compartido

### Autenticación (`shared/auth.js`)

Contiene funciones para:
- Login y obtención de token
- Generación de headers autenticados
- Métricas de errores de login

### Utilidades (`shared/utils.js`)

Contiene funciones para:
- Números y elementos aleatorios
- Formateo de resultados
- Configuraciones de umbrales por tipo de prueba

## Configuración de Carga

Por defecto, las pruebas utilizan una configuración ligera:
- 2 usuarios virtuales (VUs)
- Duración de 10 segundos
- Umbrales de rendimiento adaptados por tipo de prueba

## Personalización

### Modificar los umbrales

Los umbrales se definen en `shared/utils.js` y están separados por tipo de prueba.

### Aumentar la carga

Para aumentar la carga, modifica los parámetros `vus` y `duration` en las opciones de cada script:

```javascript
export const options = {
  vus: 5,              // Aumentar a 5 usuarios
  duration: '30s',     // Aumentar a 30 segundos
  thresholds: thresholds.catalog,
};
```

## Resultados y Reportes

Los resultados se muestran en la terminal y se exportan a archivos JSON con el formato:
`k6-results-[tipo-prueba].json`

## Próximos Pasos

1. Expandir pruebas a más flujos de negocio
2. Añadir escenarios de rampa (aumentando gradualmente VUs)
3. Implementar pruebas de resistencia (soak tests)
4. Configurar CI/CD para ejecución periódica de pruebas
