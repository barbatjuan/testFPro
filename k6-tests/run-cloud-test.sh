#!/bin/bash

# Script para ejecutar prueba directamente con Grafana Cloud Prometheus

# Variables de Grafana Cloud (obtenidas del config proporcionado)
PROM_URL="https://prometheus-prod-58-prod-eu-central-0.grafana.net/api/prom/push"
PROM_USER="2559069"
# La API Key se debe cargar desde una variable de entorno por seguridad
# Ejemplo: export GRAFANA_CLOUD_API_KEY="tu_clave_aqui"
if [ -z "$GRAFANA_CLOUD_API_KEY" ]; then
  echo "Error: La variable de entorno GRAFANA_CLOUD_API_KEY no está definida."
  echo "Por favor, expórtala antes de ejecutar el script."
  exit 1
fi

# Ejecutar k6 con el script de prueba de métricas directo a Grafana Cloud
k6 run --out experimental-prometheus-remote="url=$PROM_URL,username=$PROM_USER,password=$GRAFANA_CLOUD_API_KEY" \
  --tag testname="metric-test" \
  --tag source="k6-factupro-cloud" \
  metric-test.js

echo "Prueba completada. Verifica los resultados en Grafana Cloud: https://barbatjuan.grafana.net/explore"
