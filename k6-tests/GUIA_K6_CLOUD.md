# Guía Completa: k6 Tests con Visualización Centralizada en Grafana Cloud

Esta guía te permitirá ejecutar todas las pruebas de carga de Factupro y visualizar los resultados de forma centralizada en tu dashboard de k6 Cloud App en Grafana Cloud.

## 📋 Resumen de Scripts Adaptados

Se han creado versiones optimizadas para k6 Cloud de todos los scripts de prueba:

### Scripts Disponibles
1. **`factupro-basic-test.js`** - Prueba básica de autenticación y productos
2. **`factupro-catalog-cloud.js`** - Prueba específica del catálogo de productos
3. **`factupro-contacts-cloud.js`** - Prueba de gestión de contactos
4. **`factupro-invoices-cloud.js`** - Prueba de gestión de facturas
5. **`factupro-cloud-test.js`** - Prueba completa integrada

### Características de los Scripts
- ✅ **Credenciales incorporadas**: `testfpro1@adrirodrigoagencia.es` / `Testfpro_123!!`
- ✅ **URLs correctas**: Apuntan a `https://factupro-backend-development.up.railway.app`
- ✅ **Métricas personalizadas**: login_errors, product_errors, contact_errors, etc.
- ✅ **Sin dependencias locales**: Funcionan independientemente en k6 Cloud
- ✅ **Umbrales optimizados**: Configurados para k6 Cloud

## 🚀 Ejecución Individual de Pruebas

### Opción 1: Ejecutar una prueba específica
```bash
cd /Users/juanbarbat/factupro-e2e/k6-tests

# Ejecutar prueba básica
k6 cloud factupro-basic-test.js

# Ejecutar prueba de catálogo
k6 cloud factupro-catalog-cloud.js

# Ejecutar prueba de contactos
k6 cloud factupro-contacts-cloud.js

# Ejecutar prueba de facturas
k6 cloud factupro-invoices-cloud.js

# Ejecutar prueba completa
k6 cloud factupro-cloud-test.js
```

### Opción 2: Ejecutar todas las pruebas automáticamente
```bash
cd /Users/juanbarbat/factupro-e2e/k6-tests
./run-all-cloud-tests.sh
```

## 📊 Visualización Centralizada

### 1. Dashboard Principal de k6 Cloud
Después de ejecutar las pruebas, todos los resultados aparecerán en:
- **URL**: https://app.k6.io/runs
- **Proyecto**: Factupro Load Tests

### 2. Integración con Grafana Cloud
Los resultados también se visualizan en tu dashboard de Grafana Cloud:
- **URL**: https://barbatjuan.grafana.net/a/k6-app/projects/3784419
- **App**: k6 Cloud App

### 3. Métricas Disponibles
Cada prueba reporta las siguientes métricas:

#### Métricas Estándar de k6
- `http_req_duration` - Duración de peticiones HTTP
- `http_req_failed` - Tasa de fallos de peticiones
- `http_reqs` - Total de peticiones HTTP
- `vus` - Usuarios virtuales activos
- `vus_max` - Máximo de usuarios virtuales

#### Métricas Personalizadas por Script
- **Login**: `login_errors`
- **Productos**: `product_errors`, `catalog_call_duration`
- **Contactos**: `contact_errors`, `contact_call_duration`
- **Facturas**: `invoice_errors`, `invoice_call_duration`

## 🔧 Configuración Previa (Solo Primera Vez)

### 1. Verificar Autenticación en k6 Cloud
```bash
k6 login cloud --show-token
```

Si no estás autenticado:
```bash
k6 login cloud
```

### 2. Verificar Instalación de k6
```bash
k6 version
```

Si no está instalado, visita: https://k6.io/docs/get-started/installation/

## 📈 Interpretación de Resultados

### En k6 Cloud (app.k6.io)
1. **Performance Overview**: Gráficos de rendimiento en tiempo real
2. **Checks**: Estado de las validaciones (should be 100% passed)
3. **HTTP Metrics**: Tiempos de respuesta, throughput, errores
4. **Custom Metrics**: Métricas específicas de Factupro

### En Grafana Cloud
1. **Test Runs**: Historial de todas las ejecuciones
2. **Performance Trends**: Tendencias de rendimiento a lo largo del tiempo
3. **Alerts**: Configuración de alertas basadas en umbrales
4. **Dashboards**: Visualizaciones personalizadas

## ⚡ Flujo Recomendado

### Para Desarrollo Diario
1. Ejecutar prueba específica del módulo que estés desarrollando
2. Revisar resultados en k6 Cloud
3. Verificar que los checks pasen al 100%
4. Monitorear métricas personalizadas

### Para Releases
1. Ejecutar todas las pruebas con `./run-all-cloud-tests.sh`
2. Revisar dashboard completo en Grafana Cloud
3. Verificar tendencias de rendimiento
4. Documentar cualquier degradación

## 🔍 Troubleshooting

### Si una prueba falla
1. **Revisar logs**: Los logs aparecen en la consola y en k6 Cloud
2. **Verificar API**: Confirmar que el backend esté disponible
3. **Validar credenciales**: Asegurar que las credenciales sigan siendo válidas
4. **Revisar umbrales**: Los umbrales podrían ser muy estrictos

### Si no aparecen métricas en Grafana
1. **Verificar integración**: Confirmar que k6 Cloud App esté conectado
2. **Esperar sincronización**: Puede tomar unos minutos aparecer
3. **Revisar proyecto**: Asegurar que estés viendo el proyecto correcto

## 📝 Próximos Pasos

1. **Ejecutar las pruebas** usando el script automatizado
2. **Revisar resultados** en ambos dashboards
3. **Configurar alertas** en Grafana Cloud si es necesario
4. **Documentar baseline** de rendimiento para futuras comparaciones

## 🎯 Objetivos Cumplidos

✅ **Centralización**: Todos los resultados en un solo dashboard  
✅ **Automatización**: Script para ejecutar todas las pruebas  
✅ **Métricas reales**: Usando endpoints y credenciales reales  
✅ **Sin dependencias**: Scripts independientes para k6 Cloud  
✅ **Visualización**: Integración completa con Grafana Cloud  

---

**¡Listo para usar!** Ejecuta `./run-all-cloud-tests.sh` y revisa los resultados en tu dashboard de Grafana Cloud.
