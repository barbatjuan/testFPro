# Monitorización de pruebas k6 con Grafana

Este directorio contiene la configuración para monitorizar pruebas de carga de Factupro utilizando k6, InfluxDB y Grafana.

## Requisitos

- Docker
- docker-compose
- k6

## Inicio rápido

1. Ejecuta el script de configuración para crear los archivos necesarios:

```bash
chmod +x ../setup-monitoring.sh
../setup-monitoring.sh
```

2. Inicia InfluxDB y Grafana con Docker Compose:

```bash
docker-compose up -d
```

3. Ejecuta tus pruebas con monitorización activada:

```bash
cd ..
./run-tests.sh --monitoring catalog
```

4. Abre Grafana en tu navegador:
   [http://localhost:3000](http://localhost:3000)

5. El dashboard de k6 debería estar ya disponible y mostrando las métricas de tus pruebas.

## Integración en CI/CD

Para integrar estas pruebas en un pipeline de CI/CD:

1. Asegúrate de que Docker esté disponible en tu entorno CI/CD
2. Ejecuta el script setup-monitoring.sh como parte de tu paso de preparación
3. Configura InfluxDB y Grafana con docker-compose
4. Ejecuta las pruebas con ./run-tests.sh --monitoring all

## Ajustes avanzados

- Puedes cambiar la URL de InfluxDB con el parámetro --influxdb-url
- Para personalizar los dashboards de Grafana, modifica los archivos en grafana-provisioning/dashboards/
- Para ajustar la configuración de InfluxDB, edita las variables de entorno en docker-compose.yml
