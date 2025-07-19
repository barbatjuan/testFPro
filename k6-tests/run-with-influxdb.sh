#!/bin/bash

# Colores para mejor legibilidad
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================="
echo -e "     FACTUPRO K6 TEST WITH INFLUXDB"
echo -e "=============================================\n${NC}"

# Verificar que k6 esté instalado
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}Error: k6 no está instalado. Por favor instala k6 primero.${NC}"
    echo -e "Puedes instalarlo con: brew install k6"
    exit 1
fi

# Verificar si InfluxDB está corriendo
if ! docker ps | grep -q k6_influxdb; then
    echo -e "${YELLOW}Advertencia: No se detecta que InfluxDB esté en ejecución.${NC}"
    echo -e "Intenta iniciar el stack de monitoreo primero con:"
    echo -e "cd monitoring && docker-compose up -d"
    echo -e "${YELLOW}¿Deseas continuar de todos modos? (s/n)${NC}"
    read CONTINUE
    if [[ ! $CONTINUE =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Valores por defecto
TEST_FILE="factupro-basic-test.js"
INFLUXDB_URL="http://localhost:8086/k6"

# Opciones para el usuario
echo -e "${BLUE}Selecciona el archivo de prueba a ejecutar:${NC}"
echo -e "1) factupro-basic-test.js (prueba básica)"
echo -e "2) factupro-catalog-test.js (prueba de catálogo)"
echo -e "3) factupro-contacts-test.js (prueba de contactos)"
echo -e "4) factupro-invoices-test.js (prueba de facturas)"
echo -e "5) Otro archivo (especificar ruta)"
read -p "Opción (1-5): " TEST_OPTION

case $TEST_OPTION in
    1) TEST_FILE="factupro-basic-test.js" ;;
    2) TEST_FILE="factupro-catalog-test.js" ;;
    3) TEST_FILE="factupro-contacts-test.js" ;;
    4) TEST_FILE="factupro-invoices-test.js" ;;
    5) 
        read -p "Introduce la ruta del archivo de prueba: " TEST_FILE
        if [ ! -f "$TEST_FILE" ]; then
            echo -e "${RED}Error: El archivo $TEST_FILE no existe.${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}Opción no válida. Usando factupro-basic-test.js por defecto.${NC}"
        TEST_FILE="factupro-basic-test.js"
        ;;
esac

echo -e "${GREEN}Ejecutando prueba $TEST_FILE y enviando resultados a InfluxDB...${NC}"
echo -e "${YELLOW}Los resultados estarán disponibles en Grafana: http://localhost:3000${NC}"

# Ejecutar k6 con output a InfluxDB
k6 run --out influxdb=$INFLUXDB_URL $TEST_FILE

echo -e "${GREEN}Prueba completada. Verifica los resultados en Grafana: http://localhost:3000${NC}"
