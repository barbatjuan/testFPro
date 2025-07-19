#!/bin/bash

# Script para configurar InfluxDB y Grafana para k6
# Este script configura un entorno de monitorización para las pruebas de k6

# Colores para mejor legibilidad
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================="
echo -e "     FACTUPRO K6 MONITORING SETUP"
echo -e "=============================================\n${NC}"

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker no está instalado. Por favor instala Docker primero.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose no está instalado. Por favor instala docker-compose primero.${NC}"
    exit 1
fi

# Crear el directorio de monitorización si no existe
MONITORING_DIR="./monitoring"
mkdir -p "$MONITORING_DIR"

# Crear el archivo docker-compose.yml para InfluxDB y Grafana
echo -e "${YELLOW}Creando configuración de docker-compose...${NC}"
cat > "$MONITORING_DIR/docker-compose.yml" << 'EOF'
version: '3'
services:
  influxdb:
    image: influxdb:1.8
    container_name: k6_influxdb
    ports:
      - "8086:8086"
    environment:
      - INFLUXDB_DB=k6
      - INFLUXDB_HTTP_AUTH_ENABLED=false
    volumes:
      - influxdb-data:/var/lib/influxdb
    networks:
      - k6-network

  grafana:
    image: grafana/grafana:latest
    container_name: k6_grafana
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
      - GF_AUTH_DISABLE_LOGIN_FORM=true
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-provisioning:/etc/grafana/provisioning
    depends_on:
      - influxdb
    networks:
      - k6-network

networks:
  k6-network:

volumes:
  influxdb-data:
  grafana-data:
EOF

# Crear directorios para la configuración de Grafana
mkdir -p "$MONITORING_DIR/grafana-provisioning/datasources"
mkdir -p "$MONITORING_DIR/grafana-provisioning/dashboards"

# Crear configuración de datasource para Grafana
echo -e "${YELLOW}Configurando datasource de InfluxDB para Grafana...${NC}"
cat > "$MONITORING_DIR/grafana-provisioning/datasources/influxdb.yml" << 'EOF'
apiVersion: 1

datasources:
  - name: k6-influxdb
    type: influxdb
    access: proxy
    database: k6
    url: http://influxdb:8086
    isDefault: true
    editable: true
EOF

# Crear configuración para el dashboard de Grafana
echo -e "${YELLOW}Configurando dashboard de k6 para Grafana...${NC}"
cat > "$MONITORING_DIR/grafana-provisioning/dashboards/dashboard.yml" << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
      foldersFromFilesStructure: true
EOF

# Descargar dashboard de k6 para Grafana
echo -e "${YELLOW}Descargando dashboard de k6...${NC}"
curl -s https://raw.githubusercontent.com/grafana/k6/main/grafana/dashboards/k6-load-testing-results.json \
  > "$MONITORING_DIR/grafana-provisioning/dashboards/k6-dashboard.json"

echo -e "${GREEN}Configuración completada. Para iniciar el entorno de monitorización:${NC}"
echo -e "cd $MONITORING_DIR && docker-compose up -d"
echo -e "Grafana estará disponible en: http://localhost:3000"
echo -e "Dashboard de k6 disponible automáticamente en Grafana"
