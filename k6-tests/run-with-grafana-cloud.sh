#!/bin/bash

# Script para ejecutar pruebas k6 enviando datos a Grafana Cloud Prometheus

# Colores para salida
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar si k6 está instalado
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}k6 no está instalado. Por favor, instálalo primero.${NC}"
    echo "Puedes instalarlo con: brew install k6"
    exit 1
fi

# Asegurarse que estamos en el directorio correcto
if [[ ! -d "./k6-tests" && ! -f "./metric-test.js" && ! -f "./factupro-basic-test.js" ]]; then
    if [[ -d "../k6-tests" ]]; then
        cd ../k6-tests
    else
        echo -e "${RED}No se encuentra el directorio de pruebas k6. Este script debe ejecutarse desde el directorio k6-tests o su directorio padre.${NC}"
        exit 1
    fi
fi

# Solicitar credenciales de Grafana Cloud
echo -e "${YELLOW}Configuración de Grafana Cloud Prometheus${NC}"
read -p "Ingresa tu URL de Prometheus remote write (ej: https://prometheus-prod-XX-grafana.com/api/prom/push): " PROM_URL
read -p "Ingresa tu usuario (normalmente es tu ID numérico Grafana): " PROM_USER
read -p "Ingresa tu API key de Grafana Cloud: " PROM_API_KEY

# Verificar si se proporcionaron los valores
if [[ -z "$PROM_URL" || -z "$PROM_USER" || -z "$PROM_API_KEY" ]]; then
    echo -e "${RED}Todos los campos son obligatorios. Por favor, ejecuta el script nuevamente.${NC}"
    exit 1
fi

# Mostrar los archivos de prueba disponibles
echo -e "${GREEN}Archivos de prueba disponibles:${NC}"
find . -name "*.js" -not -path "*/node_modules/*" | sort | nl

# Solicitar selección de archivo
echo ""
read -p "Selecciona el número del archivo de prueba a ejecutar: " FILE_NUMBER

# Obtener el archivo seleccionado
SELECTED_FILE=$(find . -name "*.js" -not -path "*/node_modules/*" | sort | sed -n "${FILE_NUMBER}p")

if [[ -z "$SELECTED_FILE" ]]; then
    echo -e "${RED}Selección inválida. Por favor, ejecuta el script nuevamente.${NC}"
    exit 1
fi

echo -e "${GREEN}Ejecutando prueba $SELECTED_FILE con output a Grafana Cloud Prometheus...${NC}"

# Ejecutar k6 con output a Prometheus Remote Write
k6 run --out=experimental-prometheus-remote \
    --tag testname="$(basename "$SELECTED_FILE" .js)" \
    --tag source=k6-factupro \
    "$SELECTED_FILE"

echo -e "${GREEN}Prueba completada. Verifica los resultados en tu dashboard de Grafana Cloud.${NC}"
echo -e "${YELLOW}URL de Grafana Cloud: https://barbatjuan.grafana.net/dashboards${NC}"
