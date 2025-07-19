#!/bin/bash

# Script para ejecutar pruebas de carga de Factupro

# Colores para mejor legibilidad
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Cabecera
echo -e "${GREEN}============================================="
echo -e "     FACTUPRO K6 LOAD TESTING RUNNER"
echo -e "=============================================\n${NC}"

# Variables de configuración
MONITORING=false
INFLUXDB_URL="http://localhost:8086/k6"

# Función para ejecutar una prueba
run_test() {
  local test_file=$1
  local test_name=$(basename $test_file .js | sed 's/factupro-//g')
  
  echo -e "${YELLOW}Ejecutando prueba: ${test_name}...${NC}"
  
  if [ "$MONITORING" = true ]; then
    echo -e "${BLUE}🔍 Modo monitorización activado - Enviando métricas a InfluxDB${NC}"
    dotenv -- k6 run -o influxdb=$INFLUXDB_URL $test_file
  else
    dotenv -- k6 run $test_file
  fi
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prueba completada con éxito${NC}\n"
  else
    echo -e "${RED}⚠️ Prueba completada con advertencias${NC}\n"
  fi
}

# Procesar argumentos
while [[ $# -gt 0 ]]; do
  case $1 in
    -m|--monitoring)
      MONITORING=true
      shift
      ;;
    -u|--influxdb-url)
      INFLUXDB_URL="$2"
      shift 2
      ;;
    all|catalog|invoices|contacts)
      TEST_NAME="$1"
      shift
      ;;
    -h|--help)
      SHOW_HELP=true
      shift
      ;;
    *)
      echo -e "${RED}❌ Opción desconocida: $1${NC}"
      SHOW_HELP=true
      shift
      ;;
  esac
done

# Verificar si se solicita ayuda o no hay argumentos válidos
if [ "$SHOW_HELP" = true ] || [ -z "$TEST_NAME" ]; then
  echo -e "Uso: ./run-tests.sh [opciones] [nombre_prueba|all]\n"
  echo -e "Pruebas disponibles:"
  echo -e "  catalog    - Ejecuta pruebas del catálogo de productos"
  echo -e "  invoices   - Ejecuta pruebas de facturas"
  echo -e "  contacts   - Ejecuta pruebas de contactos"
  echo -e "  all        - Ejecuta todas las pruebas\n"
  
  echo -e "Opciones:"
  echo -e "  -m, --monitoring    Activa la monitorización con InfluxDB/Grafana"
  echo -e "  -u, --influxdb-url  URL de InfluxDB (por defecto: $INFLUXDB_URL)"
  echo -e "  -h, --help          Muestra esta ayuda\n"
  
  echo -e "Ejemplos:"
  echo -e "  ./run-tests.sh catalog                  # Ejecuta pruebas de catálogo sin monitorización"
  echo -e "  ./run-tests.sh --monitoring all         # Ejecuta todas las pruebas con monitorización"
  echo -e "  ./run-tests.sh -m -u http://influxdb:8086/k6 catalog  # Con URL personalizada"
  exit 0
fi

# Verificar si hay monitorización activada
if [ "$MONITORING" = true ]; then
  # Comprobar si InfluxDB y Grafana están en ejecución
  if ! curl -s "$INFLUXDB_URL" > /dev/null; then
    echo -e "${YELLOW}⚠️ Advertencia: No se puede conectar a InfluxDB en $INFLUXDB_URL${NC}"
    echo -e "${YELLOW}Asegúrate de que InfluxDB esté en ejecución o utiliza ./setup-monitoring.sh${NC}"
    echo -e "¿Deseas continuar de todas formas? (s/N): "
    read -r response
    if [[ "$response" != "s" && "$response" != "S" ]]; then
      echo -e "${RED}Ejecución cancelada${NC}"
      exit 1
    fi
  else
    echo -e "${GREEN}✅ Conexión a InfluxDB establecida${NC}"
    echo -e "${BLUE}📊 Monitorización disponible en: http://localhost:3000${NC}\n"
  fi
fi

# Ejecutar las pruebas seleccionadas
if [ "$TEST_NAME" == "all" ]; then
  echo -e "Ejecutando todas las pruebas...\n"
  
  run_test "factupro-catalog-test.js"
  run_test "factupro-invoices-test.js"
  run_test "factupro-contacts-test.js"
  run_test "factupro-basic-test.js"
  
  echo -e "${GREEN}✅ Todas las pruebas han sido ejecutadas${NC}"
else
  # Comprobar si el archivo existe
  if [ -f "factupro-$TEST_NAME-test.js" ]; then
    run_test "factupro-$TEST_NAME-test.js"
  else
    echo -e "${RED}❌ Error: Prueba 'factupro-$TEST_NAME-test.js' no encontrada${NC}"
    echo -e "Pruebas disponibles: catalog, invoices, contacts, basic"
    exit 1
  fi
fi

echo -e "\n${GREEN}Proceso completado${NC}"

# Mostrar recordatorio de Grafana si la monitorización está activada
if [ "$MONITORING" = true ]; then
  echo -e "${BLUE}📊 Recordatorio: Puedes ver las métricas en http://localhost:3000${NC}"
