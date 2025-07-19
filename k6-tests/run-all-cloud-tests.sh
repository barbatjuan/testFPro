#!/bin/bash

# Script para ejecutar todas las pruebas de k6 en k6 Cloud
# Este script ejecuta todos los tests adaptados para k6 Cloud de forma secuencial

echo "🚀 Ejecutando todas las pruebas de Factupro en k6 Cloud"
echo "=================================================="

# Verificar que k6 esté instalado
if ! command -v k6 &> /dev/null; then
    echo "❌ Error: k6 no está instalado"
    echo "Instala k6 desde: https://k6.io/docs/get-started/installation/"
    exit 1
fi

# Verificar que estamos logueados en k6 Cloud
echo "🔐 Verificando autenticación en k6 Cloud..."
k6 login cloud --show-token > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Error: No estás autenticado en k6 Cloud"
    echo "Ejecuta: k6 login cloud"
    exit 1
fi

echo "✅ Autenticación verificada"
echo ""

# Lista de scripts de prueba para k6 Cloud
TESTS=(
    "factupro-basic-test.js:Prueba básica de autenticación y productos"
    "factupro-catalog-cloud.js:Prueba del catálogo de productos"
    "factupro-contacts-cloud.js:Prueba de gestión de contactos"
    "factupro-invoices-cloud.js:Prueba de gestión de facturas"
    "factupro-cloud-test.js:Prueba completa integrada"
)

# Contador de pruebas
TOTAL_TESTS=${#TESTS[@]}
CURRENT_TEST=0
FAILED_TESTS=()
SUCCESSFUL_TESTS=()

echo "📋 Se ejecutarán $TOTAL_TESTS pruebas en k6 Cloud"
echo ""

# Ejecutar cada prueba
for test_info in "${TESTS[@]}"; do
    CURRENT_TEST=$((CURRENT_TEST + 1))
    
    # Separar nombre del archivo y descripción
    IFS=':' read -r test_file test_description <<< "$test_info"
    
    echo "[$CURRENT_TEST/$TOTAL_TESTS] 🧪 $test_description"
    echo "Archivo: $test_file"
    echo "----------------------------------------"
    
    # Verificar que el archivo existe
    if [ ! -f "$test_file" ]; then
        echo "❌ Error: El archivo $test_file no existe"
        FAILED_TESTS+=("$test_file (archivo no encontrado)")
        echo ""
        continue
    fi
    
    # Ejecutar la prueba en k6 Cloud
    echo "🚀 Ejecutando en k6 Cloud..."
    k6 cloud "$test_file"
    
    # Verificar el resultado
    if [ $? -eq 0 ]; then
        echo "✅ Prueba completada exitosamente: $test_description"
        SUCCESSFUL_TESTS+=("$test_file")
    else
        echo "❌ Error en la prueba: $test_description"
        FAILED_TESTS+=("$test_file")
    fi
    
    echo ""
    
    # Pausa entre pruebas para evitar sobrecarga
    if [ $CURRENT_TEST -lt $TOTAL_TESTS ]; then
        echo "⏳ Esperando 10 segundos antes de la siguiente prueba..."
        sleep 10
        echo ""
    fi
done

# Resumen final
echo "=================================================="
echo "📊 RESUMEN DE EJECUCIÓN"
echo "=================================================="
echo "Total de pruebas: $TOTAL_TESTS"
echo "Exitosas: ${#SUCCESSFUL_TESTS[@]}"
echo "Fallidas: ${#FAILED_TESTS[@]}"
echo ""

if [ ${#SUCCESSFUL_TESTS[@]} -gt 0 ]; then
    echo "✅ Pruebas exitosas:"
    for test in "${SUCCESSFUL_TESTS[@]}"; do
        echo "  - $test"
    done
    echo ""
fi

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo "❌ Pruebas fallidas:"
    for test in "${FAILED_TESTS[@]}"; do
        echo "  - $test"
    done
    echo ""
fi

echo "🔗 Revisa los resultados detallados en:"
echo "   https://app.k6.io/runs"
echo ""
echo "📊 Dashboard de Grafana Cloud:"
echo "   https://barbatjuan.grafana.net/a/k6-app/projects/3784419"
echo ""

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo "🎉 ¡Todas las pruebas se ejecutaron exitosamente!"
    exit 0
else
    echo "⚠️  Algunas pruebas fallaron. Revisa los logs para más detalles."
    exit 1
fi
